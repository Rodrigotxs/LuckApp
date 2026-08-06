import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Regras que valem para QUALQUER horário que entre na agenda.
 *
 * Existe como serviço próprio porque a mesma regra precisa valer em dois
 * caminhos: criar um agendamento e aprovar um reagendamento. Enquanto ela
 * morava só dentro do AppointmentsService, o reagendamento aprovado escapava —
 * dava para mover um atendimento para fora do expediente ou para cima de um
 * bloqueio, exatamente o que a validação existia para impedir.
 */
@Injectable()
export class AgendaRulesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Garante que o intervalo cai dentro do expediente do dia e não bate num
   * bloqueio de agenda.
   */
  async validarJanela(ownerId: string, startAt: Date, endAt: Date, barberId?: string | null) {
    const diaSemana = startAt.getDay();
    const horario = await this.prisma.workingHours.findFirst({
      where: { ownerId, dayOfWeek: diaSemana },
    });
    if (!horario || !horario.active) {
      throw new BadRequestException('A barbearia não atende neste dia');
    }

    const minutos = (d: Date) => d.getHours() * 60 + d.getMinutes();
    const paraMinutos = (hhmm: string) => {
      const [h, m] = hhmm.split(':').map(Number);
      return h * 60 + (m || 0);
    };

    const mesmoDia =
      startAt.getFullYear() === endAt.getFullYear() &&
      startAt.getMonth() === endAt.getMonth() &&
      startAt.getDate() === endAt.getDate();

    if (
      !mesmoDia ||
      minutos(startAt) < paraMinutos(horario.startTime) ||
      minutos(endAt) > paraMinutos(horario.endTime)
    ) {
      throw new BadRequestException(
        `Horário fora do expediente (${horario.startTime}–${horario.endTime})`,
      );
    }

    const bloqueio = await this.prisma.availabilityBlock.findFirst({
      where: {
        ownerId,
        OR: [{ barberId: null }, ...(barberId ? [{ barberId }] : [])],
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
    if (bloqueio) throw new ConflictException('Horário bloqueado na agenda');
  }

  /**
   * Procura agendamento que se sobreponha ao intervalo.
   *
   * O escopo inclui o barbeiro de propósito: dois barbeiros atendem em
   * paralelo, então um horário ocupado com o barbeiro A não impede o mesmo
   * horário com o barbeiro B. Filtrar só por dono geraria conflito falso.
   *
   * `ignorarId` serve para o reagendamento não colidir consigo mesmo.
   */
  async encontrarConflito(
    ownerId: string,
    startAt: Date,
    endAt: Date,
    barberId?: string | null,
    ignorarId?: string,
  ) {
    return this.prisma.appointment.findFirst({
      where: {
        ownerId,
        ...(barberId ? { barberId } : {}),
        ...(ignorarId ? { id: { not: ignorarId } } : {}),
        status: { notIn: ['CANCELLED'] },
        startAt: { lt: endAt },
        endAt: { gt: startAt },
      },
    });
  }

  /**
   * Traduz a violação da constraint EXCLUDE em 409.
   *
   * A checagem em código tem janela de corrida; quem arbitra de verdade é o
   * banco. Sem esta tradução, o perdedor da corrida recebe um 500 com erro de
   * Prisma no lugar de "horário já ocupado".
   */
  ehConflitoDeBanco(e: any): boolean {
    return (
      e?.code === 'P2010' ||
      e?.meta?.code === '23P01' ||
      /23P01|exclusion/i.test(String(e?.message ?? ''))
    );
  }
}
