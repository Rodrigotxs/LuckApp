import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BulkWorkingHoursDto } from './dto/working-hours.dto';

@Injectable()
export class WorkingHoursService {
  constructor(private prisma: PrismaService) {}

  async listar(ownerId: string) {
    return this.prisma.workingHours.findMany({
      where: { ownerId },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  async salvarBulk(ownerId: string, dto: BulkWorkingHoursDto) {
    await this.prisma.workingHours.deleteMany({ where: { ownerId } });
    return this.prisma.workingHours.createMany({
      data: dto.horarios.map((h) => ({ ...h, ownerId })),
    });
  }

  async obterPorDia(ownerId: string, dayOfWeek: number) {
    return this.prisma.workingHours.findFirst({
      where: { ownerId, dayOfWeek, active: true },
    });
  }
}
