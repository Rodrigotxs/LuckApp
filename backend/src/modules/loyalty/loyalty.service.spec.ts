import { LoyaltyService } from './loyalty.service';
import { criarPrismaMock, PrismaMock } from '../../../test/prisma-mock';

const META = 10;

describe('LoyaltyService', () => {
  let prisma: PrismaMock;
  let service: LoyaltyService;

  beforeEach(() => {
    prisma = criarPrismaMock();
    service = new LoyaltyService(prisma as any);
  });

  const agendamento = (over: Record<string, any> = {}) => ({
    id: 'a1',
    clientId: 'c1',
    status: 'COMPLETED',
    paymentStatus: 'PAID',
    loyaltyPointsGiven: false,
    ...over,
  });

  describe('sincronizarPontos — concessão', () => {
    it('credita 1 ponto em atendimento concluído e pago', async () => {
      prisma.appointment.findUnique.mockResolvedValue(agendamento());
      prisma.appointment.updateMany.mockResolvedValue({ count: 1 });

      await service.sincronizarPontos('a1');

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { loyaltyPoints: { increment: 1 } },
      });
    });

    it('não credita se o atendimento não foi concluído', async () => {
      prisma.appointment.findUnique.mockResolvedValue(agendamento({ status: 'SCHEDULED' }));
      await service.sincronizarPontos('a1');
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('não credita se o pagamento está pendente', async () => {
      prisma.appointment.findUnique.mockResolvedValue(agendamento({ paymentStatus: 'PENDING' }));
      await service.sincronizarPontos('a1');
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('é idempotente: chamar duas vezes credita uma vez só', async () => {
      prisma.appointment.findUnique.mockResolvedValue(agendamento());
      // Primeira chamada vira a flag; a segunda não encontra mais o registro
      // com loyaltyPointsGiven=false.
      prisma.appointment.updateMany
        .mockResolvedValueOnce({ count: 1 })
        .mockResolvedValueOnce({ count: 0 });

      await service.sincronizarPontos('a1');
      await service.sincronizarPontos('a1');

      expect(prisma.client.update).toHaveBeenCalledTimes(1);
    });

    it('perdedor da corrida não credita (updateMany count=0)', async () => {
      // Regressão: "ler a flag, decidir, gravar" deixava duas chamadas
      // simultâneas creditarem o mesmo ponto duas vezes.
      prisma.appointment.findUnique.mockResolvedValue(agendamento());
      prisma.appointment.updateMany.mockResolvedValue({ count: 0 });

      await service.sincronizarPontos('a1');

      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('ignora agendamento inexistente sem estourar', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);
      await expect(service.sincronizarPontos('nao-existe')).resolves.toBeUndefined();
    });
  });

  describe('sincronizarPontos — reversão', () => {
    it('devolve o ponto quando o atendimento deixa de ser concluído', async () => {
      // Regressão: marcar concluído+pago (ganha ponto) e cancelar em seguida
      // permitia acumular fidelidade sem atendimento nenhum.
      prisma.appointment.findUnique.mockResolvedValue(
        agendamento({ status: 'CANCELLED', loyaltyPointsGiven: true }),
      );
      prisma.appointment.updateMany.mockResolvedValue({ count: 1 });

      await service.sincronizarPontos('a1');

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { loyaltyPoints: { decrement: 1 } },
      });
    });

    it('nunca deixa o saldo ficar negativo', async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        agendamento({ status: 'NO_SHOW', loyaltyPointsGiven: true }),
      );
      prisma.appointment.updateMany.mockResolvedValue({ count: 1 });

      await service.sincronizarPontos('a1');

      expect(prisma.client.updateMany).toHaveBeenCalledWith({
        where: { id: 'c1', loyaltyPoints: { lt: 0 } },
        data: { loyaltyPoints: 0 },
      });
    });

    it('não reverte duas vezes', async () => {
      prisma.appointment.findUnique.mockResolvedValue(
        agendamento({ status: 'CANCELLED', loyaltyPointsGiven: true }),
      );
      prisma.appointment.updateMany.mockResolvedValue({ count: 0 });

      await service.sincronizarPontos('a1');

      expect(prisma.client.update).not.toHaveBeenCalled();
    });
  });

  describe('resgatar', () => {
    it('recusa abaixo da meta', async () => {
      prisma.client.findUnique.mockResolvedValue({ id: 'c1', loyaltyPoints: META - 1 });
      const r = await service.resgatar('c1');
      expect(r.resgatado).toBe(false);
      expect(prisma.client.updateMany).not.toHaveBeenCalled();
    });

    it('debita exatamente a meta de forma atômica', async () => {
      prisma.client.findUnique
        .mockResolvedValueOnce({ id: 'c1', loyaltyPoints: 12 })
        .mockResolvedValueOnce({ id: 'c1', loyaltyPoints: 2 });
      prisma.client.updateMany.mockResolvedValue({ count: 1 });

      const r = await service.resgatar('c1');

      expect(prisma.client.updateMany).toHaveBeenCalledWith({
        where: { id: 'c1', loyaltyPoints: { gte: META } },
        data: { loyaltyPoints: { decrement: META } },
      });
      expect(r).toEqual({ resgatado: true, saldoAposResgate: 2 });
    });

    it('resgate simultâneo: só um passa', async () => {
      // Regressão: gravar o valor calculado em memória permitia dois
      // resgates concorrentes entregarem dois prêmios com um débito só.
      prisma.client.findUnique.mockResolvedValue({ id: 'c1', loyaltyPoints: META });
      prisma.client.updateMany.mockResolvedValue({ count: 0 }); // perdeu a corrida

      const r = await service.resgatar('c1');

      expect(r.resgatado).toBe(false);
    });

    it('rejeita cliente inexistente', async () => {
      prisma.client.findUnique.mockResolvedValue(null);
      await expect(service.resgatar('x')).rejects.toThrow('Cliente não encontrado');
    });
  });

  describe('obterStatus', () => {
    it('calcula quanto falta para a recompensa', async () => {
      prisma.client.findUnique.mockResolvedValue({ id: 'c1', loyaltyPoints: 7 });
      prisma.appointment.count.mockResolvedValue(7);

      const s = await service.obterStatus('c1');

      expect(s.pontos).toBe(7);
      expect(s.meta).toBe(META);
      expect(s.restante).toBe(3);
    });

    it('nunca reporta restante negativo com saldo acima da meta', async () => {
      prisma.client.findUnique.mockResolvedValue({ id: 'c1', loyaltyPoints: 15 });
      prisma.appointment.count.mockResolvedValue(15);

      const s = await service.obterStatus('c1');

      expect(s.restante).toBe(0);
      expect(s.recompensa).toMatch(/grátis/i);
    });
  });
});
