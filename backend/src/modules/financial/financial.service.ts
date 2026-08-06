import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { OwnersService } from '../owners/owners.service';
import {
  startOfDay, endOfDay, startOfWeek, endOfWeek,
  startOfMonth, endOfMonth, startOfYear, endOfYear,
  parseISO, format, eachDayOfInterval,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Periodo = 'today' | 'week' | 'month' | 'year';
type PaymentMethodFilter = 'CASH' | 'PIX' | 'CARD' | undefined;

@Injectable()
export class FinancialService {
  constructor(
    private prisma: PrismaService,
    private ownersService: OwnersService,
  ) {}

  async resumo(ownerId: string, periodo: Periodo, serviceId?: string, paymentMethod?: PaymentMethodFilter) {
    const { inicio, fim } = this.obterIntervalo(periodo);

    const agendamentos = await this.prisma.appointment.findMany({
      where: {
        ownerId,
        status: 'COMPLETED',
        paymentStatus: 'PAID',
        startAt: { gte: inicio, lte: fim },
        ...(serviceId ? { serviceId } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
      },
      include: { service: true },
    });

    const total = agendamentos.reduce((sum, a) => sum + a.service.price, 0);
    const quantidade = agendamentos.length;
    const ticketMedio = quantidade > 0 ? total / quantidade : 0;

    // Breakdown por método de pagamento
    const porMetodo = agendamentos.reduce<Record<string, number>>((acc, a) => {
      const m = a.paymentMethod || 'OUTROS';
      acc[m] = (acc[m] || 0) + a.service.price;
      return acc;
    }, {});

    return { total, quantidade, ticketMedio, periodo, inicio, fim, porMetodo };
  }

  async relatorio(
    ownerId: string,
    startDate: string,
    endDate: string,
    serviceId?: string,
    paymentMethod?: PaymentMethodFilter,
  ) {
    const inicio = startOfDay(parseISO(startDate));
    const fim = endOfDay(parseISO(endDate));

    const agendamentos = await this.prisma.appointment.findMany({
      where: {
        ownerId,
        startAt: { gte: inicio, lte: fim },
        ...(serviceId ? { serviceId } : {}),
        ...(paymentMethod ? { paymentMethod } : {}),
      },
      include: { client: true, service: true, barber: true },
      orderBy: { startAt: 'asc' },
    });

    const dias = eachDayOfInterval({ start: inicio, end: fim });
    const porDia = dias.map((dia) => {
      const agsDia = agendamentos.filter(
        (a) => startOfDay(a.startAt).getTime() === startOfDay(dia).getTime(),
      );
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

  /** Gera CSV do relatório para download. */
  async exportarCSV(
    ownerId: string,
    startDate: string,
    endDate: string,
    serviceId?: string,
    paymentMethod?: PaymentMethodFilter,
  ): Promise<string> {
    const { agendamentos } = await this.relatorio(ownerId, startDate, endDate, serviceId, paymentMethod);

    const header = 'Data,Horário,Cliente,WhatsApp,Serviço,Barbeiro,Valor (R$),Método,Status,Pagamento';
    const rows = agendamentos.map((a: any) => {
      const data = format(a.startAt, 'dd/MM/yyyy', { locale: ptBR });
      const hora = format(a.startAt, 'HH:mm');
      const cliente = (a.client?.name || '').replace(/"/g, '""');
      const whatsapp = a.client?.whatsapp || '';
      const servico = (a.service?.name || '').replace(/"/g, '""');
      const barbeiro = (a.barber?.name || '').replace(/"/g, '""');
      const valor = a.service?.price?.toFixed(2) || '0.00';
      const metodo = a.paymentMethod || '-';
      const status = a.status;
      const pgto = a.paymentStatus;
      return `${data},${hora},"${cliente}",${whatsapp},"${servico}","${barbeiro}",${valor},${metodo},${status},${pgto}`;
    });

    // Adiciona BOM para Excel reconhecer UTF-8
    return '﻿' + header + '\n' + rows.join('\n');
  }

  private obterIntervalo(periodo: Periodo) {
    const agora = new Date();
    switch (periodo) {
      case 'today':
        return { inicio: startOfDay(agora), fim: endOfDay(agora) };
      case 'week':
        return { inicio: startOfWeek(agora, { locale: ptBR }), fim: endOfWeek(agora, { locale: ptBR }) };
      case 'year':
        return { inicio: startOfYear(agora), fim: endOfYear(agora) };
      case 'month':
      default:
        return { inicio: startOfMonth(agora), fim: endOfMonth(agora) };
    }
  }
}
