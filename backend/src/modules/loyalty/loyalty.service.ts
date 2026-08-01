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
    return this.sincronizarPontos(appointmentId);
  }

  /**
   * Alinha o saldo de pontos ao estado atual do agendamento, nos dois sentidos.
   *
   * Ganhou ponto e depois o dono desfez o "concluído"/"pago"? O ponto volta.
   * A versão anterior só concedia, então bastava marcar concluído+pago e
   * cancelar em seguida para acumular fidelidade sem atendimento.
   *
   * A idempotência vem de um `updateMany` condicional em vez de
   * "ler a flag, decidir, gravar": a decisão e a gravação viram uma
   * operação atômica, e duas chamadas simultâneas não contam o ponto duas vezes.
   */
  async sincronizarPontos(appointmentId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });
    if (!appointment) return;

    const merecePonto =
      appointment.status === 'COMPLETED' && appointment.paymentStatus === 'PAID';

    if (merecePonto && !appointment.loyaltyPointsGiven) {
      const marcou = await this.prisma.appointment.updateMany({
        where: { id: appointmentId, loyaltyPointsGiven: false },
        data: { loyaltyPointsGiven: true },
      });
      // Só credita quem efetivamente virou a flag — o perdedor da corrida
      // recebe count 0 e não credita nada.
      if (marcou.count === 1) {
        await this.prisma.client.update({
          where: { id: appointment.clientId },
          data: { loyaltyPoints: { increment: 1 } },
        });
      }
      return;
    }

    if (!merecePonto && appointment.loyaltyPointsGiven) {
      const desmarcou = await this.prisma.appointment.updateMany({
        where: { id: appointmentId, loyaltyPointsGiven: true },
        data: { loyaltyPointsGiven: false },
      });
      if (desmarcou.count === 1) {
        await this.prisma.client.update({
          where: { id: appointment.clientId },
          // Nunca deixa o saldo negativo.
          data: { loyaltyPoints: { decrement: 1 } },
        });
        await this.prisma.client.updateMany({
          where: { id: appointment.clientId, loyaltyPoints: { lt: 0 } },
          data: { loyaltyPoints: 0 },
        });
      }
    }
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

    // Débito condicional e atômico. Escrever o valor calculado em memória
    // (`pontos - META`) permitia dois resgates simultâneos passarem os dois
    // na checagem e gravarem o mesmo saldo final — dois prêmios, um débito.
    const debitado = await this.prisma.client.updateMany({
      where: { id: clientId, loyaltyPoints: { gte: LOYALTY_TARGET } },
      data: { loyaltyPoints: { decrement: LOYALTY_TARGET } },
    });
    if (debitado.count === 0) {
      return { resgatado: false, motivo: `Você precisa de ${LOYALTY_TARGET} pontos` };
    }

    const atualizado = await this.prisma.client.findUnique({ where: { id: clientId } });
    return { resgatado: true, saldoAposResgate: atualizado?.loyaltyPoints ?? 0 };
  }
}
