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
import { RegisterOwnerDto } from './dto/register-owner.dto';
import { LoginOwnerDto } from './dto/login-owner.dto';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private whatsapp: WhatsappService,
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
      },
    });

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

  private gerarToken(sub: string, role: 'owner' | 'client') {
    return this.jwtService.sign({ sub, role });
  }

  private gerarCodigoOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private sanitizarOwner(owner: any) {
    const { passwordHash, googleAccessToken, googleRefreshToken, ...safe } = owner;
    return safe;
  }
}
