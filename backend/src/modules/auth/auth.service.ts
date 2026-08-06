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
import {
  LoginClientDto, SetClientPasswordDto,
  RequestClientPasswordResetDto, ConfirmClientPasswordResetDto,
} from './dto/client-password.dto';
import {
  gerarCodigoOtp,
  compararSegredo,
  gerarTokenReset,
  hashToken,
  expiracaoOtp,
  OTP_MAX_ATTEMPTS,
} from '../../common/security/otp.util';

/**
 * Mensagem única para toda falha de OTP. Diferenciar "conta não existe",
 * "código expirado" e "código errado" entrega ao atacante um oráculo para
 * descobrir quais números/e-mails estão cadastrados.
 */
/**
 * Um canal de OTP: onde o código mora e como zerá-lo.
 * Isola o que muda entre cliente e dono do que é regra comum.
 */
interface CanalOtp {
  codigo: string | null;
  expiraEm: Date | null;
  tentativas: number;
  informado: string;
  registrarErro(): Promise<unknown>;
  invalidar(): Promise<unknown>;
}

const MSG_OTP_INVALIDO = 'Código inválido ou expirado. Solicite um novo.';

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
    const codigo = gerarCodigoOtp();
    const expiracao = expiracaoOtp();

    // O `name` NÃO é atualizado aqui de propósito: esta rota é pública, e
    // permitir update de nome sem autenticação deixaria qualquer um renomear
    // a conta de outro cliente só sabendo o número dele.
    await this.prisma.client.upsert({
      where: { whatsapp: dto.whatsapp },
      update: { otpCode: codigo, otpExpiresAt: expiracao, otpAttempts: 0 },
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

    await this.conferirOtp(
      client && {
        codigo: client.otpCode,
        expiraEm: client.otpExpiresAt,
        tentativas: client.otpAttempts,
        informado: dto.code,
        registrarErro: () =>
          this.prisma.client.update({
            where: { id: client.id },
            data: { otpAttempts: { increment: 1 } },
          }),
        invalidar: () => this.limparOtpCliente(client.id),
      },
    );

    const token = this.gerarToken(client.id, 'client');
    return { token, client: { id: client.id, name: client.name, whatsapp: client.whatsapp } };
  }

  // ─── OTP do cliente por e-mail (paridade com WhatsApp) ────────────
  async enviarOtpClienteEmail(dto: SendClientEmailOtpDto) {
    const codigo = gerarCodigoOtp();
    const expiracao = expiracaoOtp();

    // Cliente é identificado por whatsapp (único). Aqui procuramos por email;
    // se não existir client com esse email, criamos um placeholder cujo
    // whatsapp é derivado do email (temporário, atualizável no perfil).
    const existente = await this.prisma.client.findFirst({ where: { email: dto.email } });
    if (existente) {
      await this.prisma.client.update({
        where: { id: existente.id },
        data: { emailOtpCode: codigo, emailOtpExpiresAt: expiracao, emailOtpAttempts: 0 },
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
    await this.conferirOtp(
      client && {
        codigo: client.emailOtpCode,
        expiraEm: client.emailOtpExpiresAt,
        tentativas: client.emailOtpAttempts,
        informado: dto.code,
        registrarErro: () =>
          this.prisma.client.update({
            where: { id: client.id },
            data: { emailOtpAttempts: { increment: 1 } },
          }),
        invalidar: () => this.limparOtpEmail(client.id),
      },
    );

    const token = this.gerarToken(client.id, 'client');
    return { token, client: { id: client.id, name: client.name, email: client.email } };
  }

  // ─── Login do cliente com senha (paridade com o dono) ────────────
  async loginCliente(dto: LoginClientDto) {
    if (!dto.email && !dto.whatsapp) {
      throw new BadRequestException('Informe email ou whatsapp');
    }
    const client = await this.prisma.client.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.whatsapp ? [{ whatsapp: dto.whatsapp }] : []),
        ],
      },
    });
    if (!client) throw new UnauthorizedException('Credenciais inválidas');
    if (!client.passwordHash) {
      throw new UnauthorizedException('Esta conta não tem senha. Entre pelo código enviado por WhatsApp/e-mail.');
    }
    const senhaValida = await bcrypt.compare(dto.password, client.passwordHash);
    if (!senhaValida) throw new UnauthorizedException('Credenciais inválidas');

    const token = this.gerarToken(client.id, 'client');
    return { token, client: { id: client.id, name: client.name, whatsapp: client.whatsapp, email: client.email } };
  }

  /** Cliente logado define/altera sua senha (para depois entrar sem OTP). */
  async definirSenhaCliente(clientId: string, dto: SetClientPasswordDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);
    await this.prisma.client.update({ where: { id: clientId }, data: { passwordHash } });
    return { message: 'Senha definida com sucesso' };
  }

  async solicitarResetSenhaCliente(dto: RequestClientPasswordResetDto) {
    if (!dto.email && !dto.whatsapp) {
      throw new BadRequestException('Informe email ou whatsapp');
    }
    const client = await this.prisma.client.findFirst({
      where: {
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.whatsapp ? [{ whatsapp: dto.whatsapp }] : []),
        ],
      },
    });
    if (!client) return { message: 'Se a conta existir, você receberá um link em breve.' };

    const { token, tokenHash } = gerarTokenReset();
    const expira = new Date(Date.now() + 60 * 60 * 1000);
    await this.prisma.client.update({
      where: { id: client.id },
      data: { passwordResetToken: tokenHash, passwordResetExpires: expira },
    });

    const linkBase = process.env.FRONTEND_URL || 'http://localhost:3000';
    const link = `${linkBase}/reset?token=${token}`;
    try {
      if (client.email) {
        await this.email.enviarResetSenha(client.email, link);
      } else if (!client.whatsapp.startsWith('email:')) {
        await this.whatsapp.notificar(
          client.whatsapp,
          `🔐 *Redefinir senha — Barbearia Luck*\n\nToque no link (válido por 1 h): ${link}`,
        );
      }
    } catch {}

    return { message: 'Se a conta existir, você receberá um link em breve.' };
  }

  async confirmarResetSenhaCliente(dto: ConfirmClientPasswordResetDto) {
    const client = await this.prisma.client.findFirst({
      where: {
        passwordResetToken: hashToken(dto.token),
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!client) throw new BadRequestException('Token inválido ou expirado');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.client.update({
      where: { id: client.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null, otpCode: null, otpExpiresAt: null },
    });
    return { message: 'Senha atualizada com sucesso' };
  }

  // ─── OTP do dono (login via WhatsApp) ─────────────────────────────
  async enviarOtpOwner(dto: SendOwnerOtpDto) {
    const owner = await this.prisma.owner.findFirst({ where: { whatsapp: dto.whatsapp } });

    // Resposta idêntica exista ou não a conta: antes, a mensagem de erro
    // permitia varrer números até descobrir quais são de donos cadastrados.
    if (owner) {
      const codigo = gerarCodigoOtp();
      await this.prisma.owner.update({
        where: { id: owner.id },
        data: { otpCode: codigo, otpExpiresAt: expiracaoOtp(), otpAttempts: 0 },
      });
      try {
        await this.whatsapp.enviarOtp(owner.whatsapp, codigo);
      } catch {
        // Falha de envio não pode virar sinal de existência de conta.
      }
    }

    return { message: 'Se houver uma conta com este WhatsApp, o código foi enviado.' };
  }

  async verificarOtpOwner(dto: VerifyOwnerOtpDto) {
    const owner = await this.prisma.owner.findFirst({ where: { whatsapp: dto.whatsapp } });
    await this.conferirOtp(
      owner && {
        codigo: owner.otpCode,
        expiraEm: owner.otpExpiresAt,
        tentativas: owner.otpAttempts,
        informado: dto.code,
        registrarErro: () =>
          this.prisma.owner.update({
            where: { id: owner.id },
            data: { otpAttempts: { increment: 1 } },
          }),
        invalidar: () => this.limparOtpOwner(owner.id),
      },
    );

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

    // O banco guarda só o hash. Se o dump vazar, os tokens em trânsito não
    // servem para tomar conta — o mesmo raciocínio de senha vale aqui.
    const { token, tokenHash } = gerarTokenReset();
    const expira = new Date(Date.now() + 60 * 60 * 1000); // 1 h

    await this.prisma.owner.update({
      where: { id: owner.id },
      data: { passwordResetToken: tokenHash, passwordResetExpires: expira },
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
        passwordResetToken: hashToken(dto.token),
        passwordResetExpires: { gt: new Date() },
      },
    });
    if (!owner) throw new BadRequestException('Token inválido ou expirado');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.owner.update({
      where: { id: owner.id },
      data: { passwordHash, passwordResetToken: null, passwordResetExpires: null, otpCode: null, otpExpiresAt: null },
    });

    return { message: 'Senha atualizada com sucesso' };
  }

  /**
   * Confere um código de OTP.
   *
   * Existe porque a mesma sequência — código ausente, expirado, tentativas
   * estouradas, código errado — valia para três canais: WhatsApp do cliente,
   * e-mail do cliente e WhatsApp do dono. Estava escrita três vezes, quase
   * idêntica. Regra repetida é regra que diverge: a correção entra num lugar
   * e esquece os outros dois, e ninguém percebe até virar falha de segurança.
   *
   * Toda saída de erro usa a MESMA mensagem — diferenciar "não existe" de
   * "errado" entrega ao atacante um oráculo de enumeração de conta.
   */
  private async conferirOtp(canal: CanalOtp | null): Promise<void> {
    if (!canal?.codigo) throw new BadRequestException(MSG_OTP_INVALIDO);

    if (canal.expiraEm && canal.expiraEm < new Date()) {
      await canal.invalidar();
      throw new BadRequestException(MSG_OTP_INVALIDO);
    }

    if (canal.tentativas >= OTP_MAX_ATTEMPTS) {
      await canal.invalidar();
      throw new BadRequestException(MSG_OTP_INVALIDO);
    }

    if (!compararSegredo(canal.codigo, canal.informado)) {
      // Sem contador, um código de 6 dígitos cai por força bruta em minutos.
      await canal.registrarErro();
      throw new BadRequestException(MSG_OTP_INVALIDO);
    }

    await canal.invalidar();
  }

  private limparOtpCliente(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: { otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
    });
  }

  private limparOtpEmail(id: string) {
    return this.prisma.client.update({
      where: { id },
      data: { emailOtpCode: null, emailOtpExpiresAt: null, emailOtpAttempts: 0 },
    });
  }

  private limparOtpOwner(id: string) {
    return this.prisma.owner.update({
      where: { id },
      data: { otpCode: null, otpExpiresAt: null, otpAttempts: 0 },
    });
  }

  private gerarToken(sub: string, role: 'owner' | 'client') {
    return this.jwtService.sign({ sub, role });
  }

  private sanitizarOwner(owner: any) {
    const { passwordHash, googleAccessToken, googleRefreshToken, otpCode, otpExpiresAt, passwordResetToken, passwordResetExpires, ...safe } = owner;
    return safe;
  }
}
