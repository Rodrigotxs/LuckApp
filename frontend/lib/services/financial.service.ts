import { api } from '../api';

export type Periodo = 'today' | 'week' | 'month' | 'year';
export type PaymentMethod = 'CASH' | 'PIX' | 'CARD';

export interface Summary {
  total: number;
  quantidade: number;
  ticketMedio: number;
  periodo: Periodo;
  inicio: string;
  fim: string;
  porMetodo: Record<string, number>;
}

export interface DailyPoint {
  data: string;
  faturamento: number;
  agendamentos: number;
}

export interface Report {
  agendamentos: any[];
  porDia: DailyPoint[];
}

export interface Goal {
  metaMensal: number;
  faturamentoAtual: number;
  progresso: number;
}

export async function summary(period: Periodo, serviceId?: string, paymentMethod?: PaymentMethod): Promise<Summary> {
  return (await api.get('/financial/summary', { params: { period, serviceId, paymentMethod } })).data;
}

export async function report(
  startDate: string,
  endDate: string,
  serviceId?: string,
  paymentMethod?: PaymentMethod,
): Promise<Report> {
  return (await api.get('/financial/report', { params: { startDate, endDate, serviceId, paymentMethod } })).data;
}

export async function goals(): Promise<Goal> {
  return (await api.get('/financial/goals')).data;
}

export async function updateGoal(monthlyGoal: number): Promise<any> {
  return (await api.patch('/financial/goals', { monthlyGoal })).data;
}

/**
 * Baixa CSV via anchor link (respeita token do Authorization).
 * Retorna blob URL — o consumidor cria um <a> e clica.
 */
export async function exportCsv(
  startDate: string,
  endDate: string,
  serviceId?: string,
  paymentMethod?: PaymentMethod,
): Promise<Blob> {
  const res = await api.get('/financial/export.csv', {
    params: { startDate, endDate, serviceId, paymentMethod },
    responseType: 'blob',
  });
  return res.data;
}
