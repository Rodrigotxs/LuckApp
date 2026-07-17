import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OwnersService } from '../owners/owners.service';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth,
  parseISO, format, eachDayOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

@Injectable()
export class FinancialService {
  constructor(
    private prisma: PrismaService,
    private ownersService: OwnersService,
  ) {}

  async resumo(ownerId: string, periodo: 'today' | 'week' | 'month') {
    const { inicio, fim } = this.obterIntervalo(periodo);

    const agendamentos = await this.prisma.appointment.findMany({
      where: {
        ownerId,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        startAt: { gte: inicio, lte: fim },
      },
      include: { service: true },
    });

    const total = agendamentos.reduce((sum, a) => sum + a.service.price, 0);
    const quantidade = agendamentos.length;
    const ticketMedio = quantidade > 0 ? total / quantidade : 0;

    return { total, quantidade, ticketMedio, periodo, inicio, fim };
  }

  async relatorio(ownerId: string, startDate: string, endDate: string) {
    const inicio = startOfDay(parseISO(startDate));
    const fim = endOfDay(parseISO(endDate));

    const agendamentos = await this.prisma.appointment.findMany({
      where: { ownerId, startAt: { gte: inicio, lte: fim } },
      include: { client: true, service: true },
      orderBy: { startAt: 'asc' },
    });

    const dias = eachDayOfInterval({ start: inicio, end: fim });
    const porDia = dias.map((dia) => {
      const agsDia = agendamentos.filter((a) => startOfDay(a.startAt).getTime() === startOfDay(dia).getTime());
      const faturamento = agsDia
        .filter((a) => a.status === 'COMPLETED' && a.paymentStatus === 'PAID')
        .reduce((sum, a) => sum + a.service.price, 0);

      return {
        data: format(dia, 'dd/MM', { locale: ptBR }),
        faturamento,
        agendamentos: agsDia.length,
      };
    });

    return { agendamentos, porDia };
  }

  async meta(ownerId: string) {
    const owner = await this.ownersService.findById(ownerId);
    const { inicio, fim } = this.obterIntervalo('month');

    const agendamentos = await this.prisma.appointment.findMany({
      where: {
        ownerId,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        startAt: { gte: inicio, lte: fim },
      },
      include: { service: true },
    });

    const faturamentoAtual = agendamentos.reduce((sum, a) => sum + a.service.price, 0);
    const metaMensal = owner.monthlyGoal || 0;
    const progresso = metaMensal > 0 ? (faturamentoAtual / metaMensal) * 100 : 0;

    return { metaMensal, faturamentoAtual, progresso: Math.min(progresso, 100) };
  }

  async atualizarMeta(ownerId: string, monthlyGoal: number) {
    return this.ownersService.update(ownerId, { monthlyGoal });
  }

  private obterIntervalo(periodo: string) {
    const agora = new Date();
    switch (periodo) {
      case 'today':
        return { inicio: startOfDay(agora), fim: endOfDay(agora) };
      case 'week':
        return { inicio: startOfWeek(agora, { locale: ptBR }), fim: endOfWeek(agora, { locale: ptBR }) };
      case 'month':
      default:
        return { inicio: startOfMonth(agora), fim: endOfMonth(agora) };
    }
  }
}
