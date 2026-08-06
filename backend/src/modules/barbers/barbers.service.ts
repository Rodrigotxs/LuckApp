import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBarberDto, UpdateBarberDto } from './dto/barber.dto';

@Injectable()
export class BarbersService {
  constructor(private prisma: PrismaService) {}

  async listar(ownerId: string, unitId?: string) {
    return this.prisma.barber.findMany({
      where: { ownerId, active: true, ...(unitId ? { unitId } : {}) },
      include: { unit: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async listarPublico(ownerId: string, unitId?: string) {
    return this.prisma.barber.findMany({
      where: { ownerId, active: true, ...(unitId ? { unitId } : {}) },
      select: {
        id: true,
        name: true,
        role: true,
        rating: true,
        avatarLabel: true,
        unitId: true,
        unit: { select: { name: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async criar(ownerId: string, dto: CreateBarberDto) {
    // Confirmar que a unidade pertence ao dono
    const unit = await this.prisma.unit.findFirst({ where: { id: dto.unitId, ownerId } });
    if (!unit) throw new NotFoundException('Unidade não encontrada');

    return this.prisma.barber.create({
      data: {
        ownerId,
        unitId: dto.unitId,
        name: dto.name,
        role: dto.role || 'Barbeiro',
        rating: dto.rating ?? 5.0,
        avatarLabel: dto.avatarLabel || this.gerarAvatar(dto.name),
      },
    });
  }

  async atualizar(ownerId: string, id: string, dto: UpdateBarberDto) {
    await this.verificarPropriedade(ownerId, id);
    if (dto.unitId) {
      const unit = await this.prisma.unit.findFirst({ where: { id: dto.unitId, ownerId } });
      if (!unit) throw new NotFoundException('Unidade não encontrada');
    }
    return this.prisma.barber.update({ where: { id }, data: dto });
  }

  async desativar(ownerId: string, id: string) {
    await this.verificarPropriedade(ownerId, id);
    return this.prisma.barber.update({ where: { id }, data: { active: false } });
  }

  private async verificarPropriedade(ownerId: string, id: string) {
    const barber = await this.prisma.barber.findUnique({ where: { id } });
    if (!barber) throw new NotFoundException('Barbeiro não encontrado');
    if (barber.ownerId !== ownerId) throw new ForbiddenException('Sem permissão');
    return barber;
  }

  private gerarAvatar(nome: string): string {
    return nome
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
