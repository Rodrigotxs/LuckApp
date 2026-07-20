import { api } from '../api';

export interface LoyaltyStatus {
  pontos: number;
  meta: number;
  restante: number;
  atendimentosConcluidos: number;
  recompensa: string;
}

export async function status(): Promise<LoyaltyStatus> {
  return (await api.get('/loyalty/me')).data;
}

export async function redeem(): Promise<{ resgatado: boolean; motivo?: string; saldoAposResgate?: number }> {
  return (await api.post('/loyalty/me/redeem')).data;
}
