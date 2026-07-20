import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Regra de fidelidade: 1 ponto por atendimento concluído+pago; a cada
// LOYALTY_TARGET pontos o cliente ganha um "corte grátis".
const LOYALTY_TARGET = 10;

@Injectable()
export class LoyaltyService {
  constructor(private prisma: PrismaService) {}

  async obterStatus(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Cliente não encontrado');

    const historico = await this.prisma.appointment.count({
      where: { clientId, status: 'COMPLETED', paymentStatus: 'PAID' },
    });

    const restante = Math.max(0, LOYALTY_TARGET - client.loyaltyPoints);
    return {
      pontos: client.loyaltyPoints,
      meta: LOYALTY_TARGET,
      restante,
      atendimentosConcluidos: historico,
      recompensa: restante === 0 ? 'Corte grátis disponível!' : `Faltam ${restante} pts para seu próximo corte grátis`,
    };
  }

  /**
   * Concede pontos por um atendimento (idempotente — usa a flag
   * `loyaltyPointsGiven` no Appointment para não contar duas vezes).
   */
  async concederPontos(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) return;
    if (appointment.loyaltyPointsGiven) return;
    if (appointment.status !== 'COMPLETED' || appointment.paymentStatus !== 'PAID') return;

    await this.prisma.$transaction([
      this.prisma.client.update({
        where: { id: appointment.clientId },
        data: { loyaltyPoints: { increment: 1 } },
      }),
      this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { loyaltyPointsGiven: true },
      }),
    ]);
  }

  /**
   * Resgata a recompensa (zera contador se atingiu a meta).
   */
  async resgatar(clientId: string) {
    const client = await this.prisma.client.findUnique({ where: { id: clientId } });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    if (client.loyaltyPoints < LOYALTY_TARGET) {
      return { resgatado: false, motivo: `Você precisa de ${LOYALTY_TARGET} pontos` };
    }

    await this.prisma.client.update({
      where: { id: clientId },
      data: { loyaltyPoints: client.loyaltyPoints - LOYALTY_TARGET },
    });
    return { resgatado: true, saldoAposResgate: client.loyaltyPoints - LOYALTY_TARGET };
  }
}
