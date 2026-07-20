import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAvailabilityBlockDto, BlockDayDto, BlockSlotDto } from './dto/availability.dto';
import { parseISO, startOfDay, endOfDay } from 'date-fns';

@Injectable()
export class AvailabilityService {
  constructor(private prisma: PrismaService) {}

  async listar(ownerId: string, from?: string, to?: string, barberId?: string) {
    const where: any = { ownerId };
    if (from || to) {
      where.startAt = {};
      if (from) where.startAt.gte = parseISO(from);
      if (to) where.startAt.lte = parseISO(to);
    }
    if (barberId) where.barberId = barberId;

    return this.prisma.availabilityBlock.findMany({
      where,
      orderBy: { startAt: 'asc' },
    });
  }

  async criar(ownerId: string, dto: CreateAvailabilityBlockDto) {
    return this.prisma.availabilityBlock.create({
      data: {
        ownerId,
        startAt: parseISO(dto.startAt),
        endAt: parseISO(dto.endAt),
        fullDay: dto.fullDay ?? false,
        reason: dto.reason,
        barberId: dto.barberId,
        unitId: dto.unitId,
      },
    });
  }

  async bloquearDia(ownerId: string, dto: BlockDayDto) {
    const day = parseISO(dto.date);
    return this.prisma.availabilityBlock.create({
      data: {
        ownerId,
        startAt: startOfDay(day),
        endAt: endOfDay(day),
        fullDay: true,
        reason: dto.reason || 'Dia bloqueado',
        barberId: dto.barberId,
      },
    });
  }

  async bloquearSlot(ownerId: string, dto: BlockSlotDto) {
    return this.prisma.availabilityBlock.create({
      data: {
        ownerId,
        startAt: parseISO(dto.startAt),
        endAt: parseISO(dto.endAt),
        fullDay: false,
        reason: dto.reason || 'Slot bloqueado',
        barberId: dto.barberId,
      },
    });
  }

  async remover(ownerId: string, id: string) {
    const block = await this.prisma.availabilityBlock.findUnique({ where: { id } });
    if (!block) throw new NotFoundException('Bloqueio não encontrado');
    if (block.ownerId !== ownerId) throw new ForbiddenException('Sem permissão');
    return this.prisma.availabilityBlock.delete({ where: { id } });
  }

  // Retorna intervalos ocupados por bloqueios (usado por SlotsService)
  async obterPeriodosBloqueados(
    ownerId: string,
    dayStart: Date,
    dayEnd: Date,
    barberId?: string,
  ): Promise<{ inicio: Date; fim: Date }[]> {
    const blocks = await this.prisma.availabilityBlock.findMany({
      where: {
        ownerId,
        AND: [
          { startAt: { lte: dayEnd } },
          { endAt: { gte: dayStart } },
        ],
        // Bloqueio global (barberId null) ou específico do barbeiro
        OR: barberId ? [{ barberId: null }, { barberId }] : [{}],
      },
    });

    return blocks.map((b) => ({ inicio: b.startAt, fim: b.endAt }));
  }
}
