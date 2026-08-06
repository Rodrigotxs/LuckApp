import { RescheduleService } from './reschedule.service';
import { criarPrismaMock, integracoesMock, PrismaMock } from '../../../test/prisma-mock';

describe('RescheduleService', () => {
  let prisma: PrismaMock;
  let whatsapp: any;
  let agenda: any;
  let service: RescheduleService;

  const OWNER = 'owner-1';
  const CLIENTE = 'client-1';
  const FUTURO = '2030-06-04T10:00:00.000Z';
  const PASSADO = '2020-01-01T10:00:00.000Z';

  beforeEach(() => {
    prisma = criarPrismaMock();
    whatsapp = integracoesMock().whatsapp;
    agenda = {
      validarJanela: jest.fn().mockResolvedValue(undefined),
      encontrarConflito: jest.fn().mockResolvedValue(null),
      ehConflitoDeBanco: jest.fn().mockReturnValue(false),
    };
    service = new RescheduleService(prisma as any, whatsapp as any, agenda as any);
  });

  const agendamento = (over: Record<string, any> = {}) => ({
    id: 'a1',
    ownerId: OWNER,
    clientId: CLIENTE,
    barberId: 'b1',
    status: 'SCHEDULED',
    owner: { whatsapp: '5511' },
    service: { name: 'Corte', durationMin: 30 },
    ...over,
  });

  const pedido = (over: Record<string, any> = {}) => ({
    id: 'r1',
    ownerId: OWNER,
    clientId: CLIENTE,
    appointmentId: 'a1',
    status: 'PENDING',
    requestedStart: new Date(FUTURO),
    appointment: agendamento(),
    client: { whatsapp: '5599' },
    ...over,
  });

  describe('solicitar', () => {
    beforeEach(() => {
      prisma.appointment.findUnique.mockResolvedValue(agendamento());
      prisma.rescheduleRequest.create.mockImplementation(async ({ data }: any) => ({ id: 'r1', ...data }));
    });

    it('cria o pedido para o próprio agendamento', async () => {
      const r: any = await service.solicitar(CLIENTE, { appointmentId: 'a1', requestedStart: FUTURO } as any);
      expect(r.clientId).toBe(CLIENTE);
      expect(r.ownerId).toBe(OWNER);
    });

    it('cliente NÃO remarca agendamento de outro cliente (IDOR)', async () => {
      await expect(
        service.solicitar('intruso', { appointmentId: 'a1', requestedStart: FUTURO } as any),
      ).rejects.toThrow('Sem permissão');
      expect(prisma.rescheduleRequest.create).not.toHaveBeenCalled();
    });

    it('recusa agendamento inexistente', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);
      await expect(
        service.solicitar(CLIENTE, { appointmentId: 'x', requestedStart: FUTURO } as any),
      ).rejects.toThrow('não encontrado');
    });

    it.each(['CANCELLED', 'COMPLETED', 'NO_SHOW'])(
      'recusa remarcar agendamento %s',
      async (status) => {
        prisma.appointment.findUnique.mockResolvedValue(agendamento({ status }));
        await expect(
          service.solicitar(CLIENTE, { appointmentId: 'a1', requestedStart: FUTURO } as any),
        ).rejects.toThrow('Não é possível remarcar');
      },
    );

    it('recusa horário no passado já na criação', async () => {
      // Regressão: só a aprovação verificava, então o pedido ficava pendente
      // na fila do dono para morrer no clique.
      await expect(
        service.solicitar(CLIENTE, { appointmentId: 'a1', requestedStart: PASSADO } as any),
      ).rejects.toThrow('no passado');
      expect(prisma.rescheduleRequest.create).not.toHaveBeenCalled();
    });

    it('cancela pedidos pendentes anteriores do mesmo agendamento', async () => {
      await service.solicitar(CLIENTE, { appointmentId: 'a1', requestedStart: FUTURO } as any);
      expect(prisma.rescheduleRequest.updateMany).toHaveBeenCalledWith({
        where: { appointmentId: 'a1', status: 'PENDING' },
        data: expect.objectContaining({ status: 'CANCELLED_BY_CLIENT' }),
      });
    });

    it('falha do WhatsApp não derruba o pedido', async () => {
      whatsapp.notificar.mockRejectedValue(new Error('gateway fora'));
      await expect(
        service.solicitar(CLIENTE, { appointmentId: 'a1', requestedStart: FUTURO } as any),
      ).resolves.toBeDefined();
    });
  });

  describe('responder', () => {
    beforeEach(() => {
      prisma.rescheduleRequest.findUnique.mockResolvedValue(pedido());
      prisma.rescheduleRequest.update.mockImplementation(async ({ data }: any) => ({ id: 'r1', ...data }));
      prisma.appointment.update.mockResolvedValue({ id: 'a1' });
    });

    it('dono de outra barbearia NÃO responde (IDOR)', async () => {
      await expect(
        service.responder('outro-dono', 'r1', { status: 'APPROVED' } as any),
      ).rejects.toThrow('Sem permissão');
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it('recusa responder pedido já respondido', async () => {
      prisma.rescheduleRequest.findUnique.mockResolvedValue(pedido({ status: 'APPROVED' }));
      await expect(
        service.responder(OWNER, 'r1', { status: 'REJECTED' } as any),
      ).rejects.toThrow('já respondido');
    });

    it('aprovar move o agendamento para o novo horário', async () => {
      await service.responder(OWNER, 'r1', { status: 'APPROVED' } as any);
      const dados = prisma.appointment.update.mock.calls[0][0].data;
      expect(dados.startAt).toEqual(new Date(FUTURO));
      // fim = início + duração do serviço (30 min)
      expect((dados.endAt.getTime() - dados.startAt.getTime()) / 60000).toBe(30);
    });

    it('APROVAR valida expediente e bloqueio, como a criação', async () => {
      // Regressão: enquanto essa regra morava só no AppointmentsService,
      // aprovar um reagendamento movia o atendimento para fora do expediente
      // ou para cima de um bloqueio do dono.
      await service.responder(OWNER, 'r1', { status: 'APPROVED' } as any);
      expect(agenda.validarJanela).toHaveBeenCalledWith(
        OWNER, new Date(FUTURO), expect.any(Date), 'b1',
      );
    });

    it('não aprova se o horário estiver fora do expediente', async () => {
      agenda.validarJanela.mockRejectedValue(new Error('fora do expediente'));
      await expect(
        service.responder(OWNER, 'r1', { status: 'APPROVED' } as any),
      ).rejects.toThrow('fora do expediente');
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it('o conflito considera o BARBEIRO e ignora o próprio agendamento', async () => {
      // Regressão: filtrava só por dono, então horário ocupado com outro
      // barbeiro barrava a remarcação sem motivo.
      await service.responder(OWNER, 'r1', { status: 'APPROVED' } as any);
      expect(agenda.encontrarConflito).toHaveBeenCalledWith(
        OWNER, new Date(FUTURO), expect.any(Date), 'b1', 'a1',
      );
    });

    it('recusa aprovar quando há conflito', async () => {
      agenda.encontrarConflito.mockResolvedValue({ id: 'outro' });
      await expect(
        service.responder(OWNER, 'r1', { status: 'APPROVED' } as any),
      ).rejects.toThrow('indisponível');
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it('violação da constraint vira 409, não 500', async () => {
      // Regressão: a constraint EXCLUDE foi adicionada ao banco, mas só o
      // caminho de criação a tratava. Aqui o erro de Prisma vazava como 500.
      const erro: any = new Error('exclusion_violation');
      agenda.ehConflitoDeBanco.mockReturnValue(true);
      prisma.appointment.update.mockRejectedValue(erro);
      await expect(
        service.responder(OWNER, 'r1', { status: 'APPROVED' } as any),
      ).rejects.toThrow('indisponível');
    });

    it('erro de banco não relacionado continua propagando', async () => {
      prisma.appointment.update.mockRejectedValue(new Error('conexão perdida'));
      await expect(
        service.responder(OWNER, 'r1', { status: 'APPROVED' } as any),
      ).rejects.toThrow('conexão perdida');
    });

    it('recusa aprovar remarcação para o passado', async () => {
      prisma.rescheduleRequest.findUnique.mockResolvedValue(
        pedido({ requestedStart: new Date(PASSADO) }),
      );
      await expect(
        service.responder(OWNER, 'r1', { status: 'APPROVED' } as any),
      ).rejects.toThrow('passado');
    });

    it('rejeitar NÃO mexe no agendamento', async () => {
      await service.responder(OWNER, 'r1', { status: 'REJECTED' } as any);
      expect(prisma.appointment.update).not.toHaveBeenCalled();
      expect(agenda.validarJanela).not.toHaveBeenCalled();
    });
  });

  describe('cancelar', () => {
    beforeEach(() => {
      prisma.rescheduleRequest.findUnique.mockResolvedValue(pedido());
      prisma.rescheduleRequest.update.mockResolvedValue({ id: 'r1' });
    });

    it('o cliente cancela o próprio pedido', async () => {
      await expect(service.cancelar(CLIENTE, 'r1')).resolves.toBeDefined();
    });

    it('outro cliente NÃO cancela (IDOR)', async () => {
      await expect(service.cancelar('intruso', 'r1')).rejects.toThrow('Sem permissão');
      expect(prisma.rescheduleRequest.update).not.toHaveBeenCalled();
    });

    it('não cancela pedido já respondido', async () => {
      prisma.rescheduleRequest.findUnique.mockResolvedValue(pedido({ status: 'APPROVED' }));
      await expect(service.cancelar(CLIENTE, 'r1')).rejects.toThrow('já respondido');
    });
  });

  describe('listagens — escopo', () => {
    it('a listagem do cliente é limitada a ele', async () => {
      await service.listarDoCliente(CLIENTE);
      expect(prisma.rescheduleRequest.findMany.mock.calls[0][0].where.clientId).toBe(CLIENTE);
    });

    it('a listagem do dono é limitada à barbearia dele', async () => {
      await service.listarDoDono(OWNER);
      expect(prisma.rescheduleRequest.findMany.mock.calls[0][0].where.ownerId).toBe(OWNER);
    });
  });
});
