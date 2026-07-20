import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WorkingHoursService } from '../services/working-hours.service';
import { GoogleCalendarService } from '../integrations/google-calendar/google-calendar.service';
import { AvailabilityService } from '../availability/availability.service';
import { addMinutes, parseISO, startOfDay, endOfDay } from 'date-fns';

export interface Slot {
  startAt: string;
  endAt: string;
  disponivel: boolean;
}

export interface Periodo {
  inicio: Date;
  fim: Date;
}

@Injectable()
export class SlotsService {
  constructor(
    private prisma: PrismaService,
    private workingHours: WorkingHoursService,
    private googleCalendar: GoogleCalendarService,
    private availability: AvailabilityService,
  ) {}

  async calcularSlotsDisponiveis(
    ownerId: string,
    date: string,
    serviceId: string,
    barberId?: string,
    unitId?: string,
  ): Promise<Slot[]> {
    const data = parseISO(date);
    const diaSemana = data.getDay();

    const service = await this.prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return [];

    const horario = await this.workingHours.obterPorDia(ownerId, diaSemana);
    if (!horario || !horario.active) return [];

    const owner = await this.prisma.owner.findUnique({ where: { id: ownerId } });

    // Se barberId informado, olha só a agenda do barbeiro; senão, olha o dono todo
    const agendamentosDB = await this.prisma.appointment.findMany({
      where: {
        ownerId,
        ...(barberId ? { barberId } : {}),
        ...(unitId ? { unitId } : {}),
        startAt: { gte: startOfDay(data), lte: endOfDay(data) },
        status: { notIn: ['CANCELLED'] },
      },
    });

    const periodosOcupados: Periodo[] = agendamentosDB.map((a) => ({
      inicio: a.startAt,
      fim: a.endAt,
    }));

    if (owner?.googleAccessToken && owner?.googleRefreshToken) {
      try {
        const eventosGoogle = await this.googleCalendar.obterEventosOcupados(
          owner.googleAccessToken,
          owner.googleRefreshToken,
          startOfDay(data).toISOString(),
          endOfDay(data).toISOString(),
          owner.id,
        );
        periodosOcupados.push(...eventosGoogle);
      } catch {
        // Google Calendar não configurado ou erro
      }
    }

    // Bloqueios manuais de agenda (dia inteiro ou slots)
    const bloqueios = await this.availability.obterPeriodosBloqueados(
      ownerId,
      startOfDay(data),
      endOfDay(data),
      barberId,
    );
    periodosOcupados.push(...bloqueios);

    const slots: Slot[] = [];
    const [horaInicio, minInicio] = horario.startTime.split(':').map(Number);
    const [horaFim, minFim] = horario.endTime.split(':').map(Number);

    let slotInicio = new Date(data);
    slotInicio.setHours(horaInicio, minInicio, 0, 0);

    const fimExpediente = new Date(data);
    fimExpediente.setHours(horaFim, minFim, 0, 0);

    while (true) {
      const slotFim = addMinutes(slotInicio, service.durationMin);
      if (slotFim > fimExpediente) break;

      const ocupado = this.verificarColisao(slotInicio, slotFim, periodosOcupados);
      const passado = slotInicio <= new Date();

      slots.push({
        startAt: slotInicio.toISOString(),
        endAt: slotFim.toISOString(),
        disponivel: !ocupado && !passado,
      });

      slotInicio = addMinutes(slotInicio, service.durationMin);
    }

    return slots;
  }

  private verificarColisao(inicio: Date, fim: Date, periodos: Periodo[]): boolean {
    return periodos.some((p) => inicio < p.fim && fim > p.inicio);
  }
}
