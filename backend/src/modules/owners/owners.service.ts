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
    const { passwordHash, googleAccessToken, googleRefreshToken, ...safe } = owner;
    return safe;
  }

  async update(id: string, dto: UpdateOwnerDto) {
    const owner = await this.prisma.owner.update({ where: { id }, data: dto });
    const { passwordHash, googleAccessToken, googleRefreshToken, ...safe } = owner;
    return safe;
  }
}
