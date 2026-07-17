import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: string; role: 'owner' | 'client' }) {
    if (payload.role === 'owner') {
      const owner = await this.prisma.owner.findUnique({ where: { id: payload.sub } });
      if (!owner) throw new UnauthorizedException('Dono não encontrado');
      return { id: owner.id, email: owner.email, role: 'owner', barbershopName: owner.barbershopName };
    }

    const client = await this.prisma.client.findUnique({ where: { id: payload.sub } });
    if (!client) throw new UnauthorizedException('Cliente não encontrado');
    return { id: client.id, whatsapp: client.whatsapp, role: 'client' };
  }
}
