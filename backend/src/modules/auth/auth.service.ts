import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsappService } from '../integrations/whatsapp/whatsapp.service';
import { EmailService } from '../integrations/email/email.service';
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { SendClientEmailOtpDto, VerifyClientEmailOtpDto } from './dto/email-otp.dto';
import { LoginOwnerDto } from './dto/login-owner.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { SendOwnerOtpDto, VerifyOwnerOtpDto } from './dto/owner-otp.dto';
import { RequestPasswordResetDto, ConfirmPasswordResetDto } from './dto/password-reset.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private whatsapp: WhatsappService,
    private email: EmailService,
  ) {}

  async registerOwner(dto: RegisterOwnerDto) {
    const existente = await this.prisma.owner.findUnique({ where: { email: dto.email } });
    if (existente) throw new ConflictException('E-mail já cadastrado');

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const owner = await this.prisma.owner.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        whatsapp: dto.whatsapp,
        barbershopName: dto.barbershopName,
        barbershopAddress: dto.barbershopAddress,
        zipCode: dto.zipCode,
      },
    });

    // Se informou unitId no cadastro, cria o Barber (o próprio dono como profissional
    // da unidade escolhida — assim ele aparece no BarberPicker público).
    if (dto.unitId) {
      const unit = await this.prisma.unit.findUnique({ where: { id: dto.unitId } });
      if (unit) {
        const avatar = dto.name
          .split(' ')
          .slice(0, 2)
          .map((n) => n[0])
          .join('')
          .toUpperCase();
        await this.prisma.barber.create({
          data: {
            ownerId: owner.id,
            unitId: unit.id,
            name: dto.name,
            role: 'Barbeiro',
            rating: 5.0,
            avatarLabel: avatar,
          },
        });
      }
    }

    const token = this.gerarToken(owner.id, 'owner');
    return { token, owner: this.sanitizarOwner(owner) };
  }

  async loginOwner(dto: LoginOwnerDto) {
    const owner = await this.prisma.owner.findUnique({ where: { email: dto.email } });
    if (!owner) throw new UnauthorizedException('E-mail ou senha inválidos');

    const senhaValida = await bcrypt.compare(dto.password, owner.passwordHash);
    if (!senhaValida) throw new UnauthorizedException('E-mail ou senha inválidos');

    const token = this.gerarToken(owner.id, 'owner');
    return { token, owner: this.sanitizarOwner(owner) };
  }

  async enviarOtp(dto: SendOtpDto) {
    const codigo = this.gerarCodigoOtp();
    const expiracao = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.client.upsert({
      where: { whatsapp: dto.whatsapp },
      update: { otpCode: codigo, otpExpiresAt: expiracao, name: dto.name },
      create: {
        name: dto.name,
        whatsapp: dto.whatsapp,
        otpCode: codigo,
        otpExpiresAt: expiracao,
      },
    });

    await this.whatsapp.enviarOtp(dto.whatsapp, codigo);

    return { message: 'Código OTP enviado via WhatsApp' };
  }

  async verificarOtp(dto: VerifyOtpDto) {
    const client = await this.prisma.client.findUnique({ where: { whatsapp: dto.whatsapp } });
    if (!client || !client.otpCode) throw new BadRequestException('Código inválido ou expirado');
    if (client.otpCode !== dto.code) throw new BadRequestException('Código OTP incorreto');
    if (client.otpExpiresAt && client.otpExpiresAt < new Date()) {
      throw new BadRequestException('Código OTP expirado. Solicite um novo.');
    }

    await this.prisma.client.update({
      where: { id: client.id },
      data: { otpCode: null, otpExpiresAt: null },
    });

    const token = this.gerarToken(client.id, 'client');
    return { token, client: { id: client.id, name: client.name, whatsapp: client.whatsapp } };
  }

  // ─── OTP do cliente por e-mail (paridade com WhatsApp) ────────────
  async enviarOtpClienteEmail(dto: SendClientEmailOtpDto) {
    const codigo = this.gerarCodigoOtp();
    const expiracao = new Date(Date.now() + 10 * 60 * 1000);

    // Cliente é identificado por whatsapp (único). Aqui procuramos por email;
    // se não existir client com esse email, criamos um placeholder cujo
    // whatsapp é derivado do email (temporário, atualizável no perfil).
    const existente = await this.prisma.client.findFirst({ where: { email: dto.email } });
    if (existente) {
      await this.prisma.client.update({
        where: { id: existente.id },
        data: { emailOtpCode: codigo, emailOtpExpiresAt: expiracao, name: dto.name },
      });
    } else {
      await this.prisma.client.create({
        data: {
          name: dto.name,
          email: dto.email,
          whatsapp: `email:${dto.email}`, // placeholder — cliente pode atualizar depois
          emailOtpCode: codigo,
          emailOtpExpiresAt: expiracao,
        },
      });
    }

    await this.email.enviarOtp(dto.email, codigo);
    return { message: 'Código OTP enviado por e-mail' };
  }

  async verificarOtpClienteEmail(dto: VerifyClientEmailOtpDto) {
    const client = await this.prisma.client.findFirst({ where: { email: dto.email } });
    if (!client || !client.emailOtpCode) throw new BadRequestException('Código inválido ou expirado');
    if (client.emailOtpCode !== dto.code) throw new BadRequestException('Código OTP incorreto');
    if (client.emailOtpExpiresAt && client.emailOtpExpiresAt < new Date()) {
      throw new BadRequestException('Código expirado. Solicite um novo.');
    }

    await this.prisma.client.update({
      where: { id: client.id },
      data: { emailOtpCode: null, emailOtpExpiresAt: null },
    });

    const token = this.gerarToken(client.id, 'client');
    return { token, client: { id: client.id, name: client.name, email: client.email } };
  }

  // ─── OTP do dono (login via WhatsApp) ─────────────────────────────
  async enviarOtpOwner(dto: SendOwnerOtpDto) {
    const owner = await this.prisma.owner.findFirst({ where: { whatsapp: dto.whatsapp } });
    if (!owner) {
      throw new BadRequestException(
        'Não encontramos uma conta com este WhatsApp. Cadastre-se como funcionário para começar.',
      );
    }

    const codigo = this.gerarCodigoOtp();
    const expiracao = new Date(Date.now() + 10 * 60 * 1000);

    await this.prisma.owner.update({
      where: { id: owner.id },
      data: { otpCode: codigo, otpExpiresAt: expiracao },
    });
    await this.whatsapp.enviarOtp(owner.whatsapp, codigo);

    return { message: 'Código OTP enviado ao seu WhatsApp' };
  }

  async verificarOtpOwner(dto: VerifyOwnerOtpDto) {
    const owner = await this.prisma.owner.findFirst({ where: { whatsapp: dto.whatsapp } });
    if (!owner || !owner.otpCode) throw new BadRequestException('Código inválido ou expirado');
    if (owner.otpCode !== dto.code) throw new BadRequestException('Código OTP incorreto');
    if (owner.otpExpiresAt && owner.otpExpiresAt < new Date()) {
      throw new BadRequestException('Código expirado. Solicite um novo.');
    }

    await this.prisma.owner.update({
      where: { id: owner.id },
      data: { otpCode: null, otpExpiresAt: null },
    });

    const token = this.gerarToken(owner.id, 'owner');
    return { token, owner: this.sanitizarOwner(owner) };
  }

  // ─── Reset de senha (owner) ───────────────────────────────────────
  async solicitarResetSenha(dto: RequestPasswordResetDto) {
    if (!dto.email && !dto.whatsapp) {
      throw new BadRequestException('Informe email ou whatsapp');
    }
    const owner = await this.prisma.owner.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.whatsapp ? [{ whatsapp: dto.whatsapp }] : []),
        ],
      },
    });

    // Sempre retorna sucesso para não vazar existência de conta
    if (!owner) return { message: 'Se a conta existir, você receberá um link em breve.' };

    const token = crypto.randomBytes(24).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 h

    await this.prisma.owner.update({
      where: { id: owner.id },
      data: { passwordResetToken: token, passwordResetExpires: expira },
    });

    // Envia via WhatsApp (fluxo do design)
    try {
      const linkBase = process.env.FRONTEND_URL || 'http://localhost:3000';
      await this.whatsapp.notificar(
        owner.whatsapp,
        `🔐 *Redefinir senha — Barbearia Luck*\n\n` +
          `Toque no link abaixo para escolher uma nova senha (válido por 1 h):\n${linkBase}/reset?token=${token}`,
      );
    } catch {}

    return { message: 'Se a conta existir, você receberá um link em breve.' };
  }

  async confirmarResetSenha(dto: ConfirmPasswordResetDto) {
    const owner = await this.prisma.owner.findFirst({
      where: {
        passwordResetToken: dto.token,
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!owner) throw new BadRequestException('Token inválido ou expirado');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.owner.update({
      where: { id: owner.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null },
    });

    return { message: 'Senha atualizada com sucesso' };
  }

  private gerarToken(sub: string, role: 'owner' | 'client') {
    return this.jwtService.sign({ sub, role });
  }

  private gerarCodigoOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private sanitizarOwner(owner: any) {
    const { passwordHash, googleAccessToken, googleRefreshToken, otpCode, otpExpiresAt, passwordResetToken, passwordResetExpires, ...safe } = owner;
    return safe;
  }
}
