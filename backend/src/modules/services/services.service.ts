import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async listar(ownerId: string) {
    return this.prisma.service.findMany({
      where: { ownerId, active: true },
      orderBy: { name: 'asc' },
    });
  }

  async listarPublico(ownerId: string) {
    return this.prisma.service.findMany({
      where: { ownerId, active: true },
      select: { id: true, name: true, price: true, durationMin: true, description: true },
      orderBy: { name: 'asc' },
    });
  }

  async criar(ownerId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({ data: { ...dto, ownerId } });
  }

  async atualizar(ownerId: string, id: string, dto: UpdateServiceDto) {
    await this.verificarPropriedade(ownerId, id);
    return this.prisma.service.update({ where: { id }, data: dto });
  }

  async desativar(ownerId: string, id: string) {
    await this.verificarPropriedade(ownerId, id);
    return this.prisma.service.update({ where: { id }, data: { active: false } });
  }

  private async verificarPropriedade(ownerId: string, id: string) {
    const service = await this.prisma.service.findUnique({ where: { id } });
    if (!service) throw new NotFoundException('Serviço não encontrado');
    if (service.ownerId !== ownerId) throw new ForbiddenException('Sem permissão');
    return service;
  }
}
