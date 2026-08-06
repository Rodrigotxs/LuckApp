import { Injectable, BadRequestException } from '@nestjs/common';
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
    // Valida startTime < endTime em cada dia ativo
    for (const h of dto.horarios) {
      if (!h.active) continue;
      if (h.startTime >= h.endTime) {
        throw new BadRequestException(
          `Dia ${h.dayOfWeek}: início (${h.startTime}) deve ser antes do fim (${h.endTime})`,
        );
      }
    }
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
