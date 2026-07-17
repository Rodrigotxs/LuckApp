import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async listar(ownerId: string) {
    return this.prisma.unit.findMany({
      where: { ownerId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async listarPublico(ownerId: string) {
    return this.prisma.unit.findMany({
      where: { ownerId, active: true },
      select: { id: true, name: true, address: true, neighborhood: true },
      orderBy: { name: 'asc' },
    });
  }

  async criar(ownerId: string, dto: CreateUnitDto) {
    return this.prisma.unit.create({ data: { ...dto, ownerId } });
  }

  async atualizar(ownerId: string, id: string, dto: UpdateUnitDto) {
    await this.verificarPropriedade(ownerId, id);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async desativar(ownerId: string, id: string) {
    await this.verificarPropriedade(ownerId, id);
    return this.prisma.unit.update({ where: { id }, data: { active: false } });
  }

  private async verificarPropriedade(ownerId: string, id: string) {
    const unit = await this.prisma.unit.findUnique({ where: { id } });
    if (!unit) throw new NotFoundException('Unidade não encontrada');
    if (unit.ownerId !== ownerId) throw new ForbiddenException('Sem permissão');
    return unit;
  }
}
