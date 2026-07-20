import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateOwnerDto } from './dto/update-owner.dto';

@Injectable()
export class OwnersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const owner = await this.prisma.owner.findUnique({
      where: { id },
      include: { workingHours: true },
    });
    if (!owner) throw new NotFoundException('Dono não encontrado');
    const {
      passwordHash, googleAccessToken, googleRefreshToken,
      otpCode, otpExpiresAt, passwordResetToken, passwordResetExpires,
      ...safe
    } = owner;
    return { ...safe, googleConnected: Boolean(owner.googleAccessToken && owner.googleRefreshToken) };
  }

  /**
   * Retorna o primeiro dono cadastrado — usado pela SPA quando não há link
   * público específico (`/agendar/:ownerId`). Só expõe dados públicos.
   */
  async findDefaultPublic() {
    const owner = await this.prisma.owner.findFirst({
      orderBy: { createdAt: 'asc' },
      select: { id: true, name: true, barbershopName: true, barbershopAddress: true },
    });
    return owner;
  }

  async update(id: string, dto: UpdateOwnerDto) {
    const owner = await this.prisma.owner.update({ where: { id }, data: dto });
    const {
      passwordHash, googleAccessToken, googleRefreshToken,
      otpCode, otpExpiresAt, passwordResetToken, passwordResetExpires,
      ...safe
    } = owner;
    return { ...safe, googleConnected: Boolean(owner.googleAccessToken && owner.googleRefreshToken) };
  }
}
