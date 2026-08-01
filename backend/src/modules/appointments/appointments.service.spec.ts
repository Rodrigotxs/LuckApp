import { AppointmentsService } from './appointments.service';
import { criarPrismaMock, integracoesMock, PrismaMock } from '../../../test/prisma-mock';

describe('AppointmentsService', () => {
  let prisma: PrismaMock;
  let deps: ReturnType<typeof integracoesMock>;
  let service: AppointmentsService;

  const OWNER = 'owner-1';
  const CLIENT = 'client-1';
  // Uma terça-feira, bem no futuro, para não esbarrar na regra de passado.
  const FUTURO = '2030-06-04T10:00:00.000Z';

  beforeEach(() => {
    prisma = criarPrismaMock();
    deps = integracoesMock();
    service = new AppointmentsService(
      prisma as any,
      deps.googleCalendar as any,
      deps.whatsapp as any,
      deps.loyalty as any,
    );

    // Caminho feliz por padrão; cada teste sobrescreve o que precisa.
    prisma.service.findFirst.mockResolvedValue({ id: 's1', ownerId: OWNER, durationMin: 30, name: 'Corte', active: true });
    prisma.workingHours.findFirst.mockResolvedValue({ ownerId: OWNER, dayOfWeek: new Date(FUTURO).getDay(), active: true, startTime: '00:00', endTime: '23:59' });
    prisma.availabilityBlock.findFirst.mockResolvedValue(null);
    prisma.appointment.findFirst.mockResolvedValue(null);
    prisma.appointment.create.mockImplementation(async ({ data }: any) => ({
      id: 'novo', ...data,
      client: { id: CLIENT, name: 'Zé', whatsapp: '5511', email: null },
      service: { name: 'Corte', durationMin: 30 },
      owner: { id: OWNER, barbershopName: 'Luck', barbershopAddress: 'Rua X' },
      unit: null, barber: null,
    }));
  });

  const dto = (over: Record<string, any> = {}) => ({
    ownerId: OWNER, serviceId: 's1', startAt: FUTURO, ...over,
  }) as any;

  describe('criar — autorização e escopo', () => {
    it('cliente consegue agendar para si', async () => {
      const r = await service.criar(CLIENT, dto(), 'client');
      expect(r.clientId).toBe(CLIENT);
    });

    it('dono não agenda em barbearia de outro dono', async () => {
      await expect(
        service.criar(OWNER, dto({ ownerId: 'outro-owner' }), 'owner'),
      ).rejects.toThrow('Não é possível agendar em outra barbearia');
    });

    it('cliente não consegue se passar por outro cliente via clientId', async () => {
      // Só o dono pode agendar em nome de terceiro; para o cliente o campo
      // é ignorado e vale sempre o id do token.
      const r = await service.criar(CLIENT, dto({ clientId: 'vitima' }), 'client');
      expect(r.clientId).toBe(CLIENT);
    });

    it('dono agendando para cliente inexistente é rejeitado', async () => {
      prisma.client.findUnique.mockResolvedValue(null);
      await expect(service.criar(OWNER, dto({ clientId: 'fantasma' }), 'owner')).rejects.toThrow(
        'Cliente não encontrado',
      );
    });

    it('serviço de outra barbearia não é aceito', async () => {
      prisma.service.findFirst.mockResolvedValue(null);
      await expect(service.criar(CLIENT, dto(), 'client')).rejects.toThrow('Serviço não encontrado');
    });

    it('barbeiro precisa pertencer à mesma barbearia', async () => {
      prisma.barber.findFirst.mockResolvedValue(null);
      await expect(service.criar(CLIENT, dto({ barberId: 'b-de-outro' }), 'client')).rejects.toThrow(
        'Barbeiro não encontrado nesta barbearia',
      );
    });

    it('unidade precisa pertencer à mesma barbearia', async () => {
      prisma.unit.findFirst.mockResolvedValue(null);
      await expect(service.criar(CLIENT, dto({ unitId: 'u-de-outro' }), 'client')).rejects.toThrow(
        'Unidade não encontrada nesta barbearia',
      );
    });
  });

  describe('criar — regras de horário', () => {
    it('recusa agendamento no passado', async () => {
      await expect(
        service.criar(CLIENT, dto({ startAt: '2020-01-01T10:00:00.000Z' }), 'client'),
      ).rejects.toThrow('Horário no passado');
    });

    it('recusa dia em que a barbearia não atende', async () => {
      prisma.workingHours.findFirst.mockResolvedValue(null);
      await expect(service.criar(CLIENT, dto(), 'client')).rejects.toThrow(
        'não atende neste dia',
      );
    });

    it('recusa dia marcado como inativo', async () => {
      prisma.workingHours.findFirst.mockResolvedValue({ active: false, startTime: '09:00', endTime: '18:00' });
      await expect(service.criar(CLIENT, dto(), 'client')).rejects.toThrow('não atende neste dia');
    });

    it('recusa horário fora do expediente mesmo chamando a API direto', async () => {
      // Regressão: a validação de expediente só existia no cálculo de slots,
      // então um POST direto marcava de madrugada sem passar pela tela.
      const inicio = new Date(FUTURO);
      prisma.workingHours.findFirst.mockResolvedValue({
        active: true,
        // expediente termina 1 minuto antes do agendamento começar
        startTime: '00:00',
        endTime: `${String(inicio.getHours()).padStart(2, '0')}:${String(inicio.getMinutes()).padStart(2, '0')}`,
      });
      await expect(service.criar(CLIENT, dto(), 'client')).rejects.toThrow('fora do expediente');
    });

    it('recusa horário em cima de um bloqueio de agenda', async () => {
      prisma.availabilityBlock.findFirst.mockResolvedValue({ id: 'bl1' });
      await expect(service.criar(CLIENT, dto(), 'client')).rejects.toThrow('bloqueado');
    });

    it('calcula o fim a partir da duração do serviço', async () => {
      prisma.service.findFirst.mockResolvedValue({ id: 's1', ownerId: OWNER, durationMin: 45, name: 'Barba', active: true });
      const r = await service.criar(CLIENT, dto(), 'client');
      const dur = (new Date(r.endAt).getTime() - new Date(r.startAt).getTime()) / 60000;
      expect(dur).toBe(45);
    });
  });

  describe('criar — conflito de horário', () => {
    it('rejeita quando já existe agendamento sobreposto', async () => {
      prisma.appointment.findFirst.mockResolvedValue({ id: 'existente' });
      await expect(service.criar(CLIENT, dto(), 'client')).rejects.toThrow('Horário já ocupado');
    });

    it('consulta de conflito usa sobreposição real (início < fim && fim > início)', async () => {
      await service.criar(CLIENT, dto(), 'client');
      const where = prisma.appointment.findFirst.mock.calls[0][0].where;
      expect(where.startAt).toHaveProperty('lt');
      expect(where.endAt).toHaveProperty('gt');
      expect(where.status).toEqual({ notIn: ['CANCELLED'] });
    });

    it('traduz violação da constraint do banco em 409, não em 500', async () => {
      // Regressão: entre o SELECT de conflito e o INSERT existe janela de
      // corrida. O banco barra com 23P01 e o usuário precisa ver "ocupado".
      const erro: any = new Error('exclusion_violation');
      erro.code = 'P2010';
      erro.meta = { code: '23P01' };
      prisma.appointment.create.mockRejectedValue(erro);

      await expect(service.criar(CLIENT, dto(), 'client')).rejects.toThrow('Horário já ocupado');
    });

    it('erro de banco não relacionado continua propagando', async () => {
      prisma.appointment.create.mockRejectedValue(new Error('conexão perdida'));
      await expect(service.criar(CLIENT, dto(), 'client')).rejects.toThrow('conexão perdida');
    });
  });

  describe('criar — integrações não podem derrubar o agendamento', () => {
    it('agendamento sobrevive a falha do WhatsApp', async () => {
      deps.whatsapp.enviarConfirmacao.mockRejectedValue(new Error('API fora'));
      await expect(service.criar(CLIENT, dto(), 'client')).resolves.toBeDefined();
    });

    it('agendamento sobrevive a falha do Google Calendar', async () => {
      prisma.appointment.create.mockImplementation(async ({ data }: any) => ({
        id: 'novo', ...data,
        client: { name: 'Zé', whatsapp: '5511', email: 'z@x.com' },
        service: { name: 'Corte' },
        owner: { id: OWNER, barbershopName: 'Luck', googleAccessToken: 'tk', googleRefreshToken: 'rf' },
      }));
      deps.googleCalendar.criarEvento.mockRejectedValue(new Error('oauth expirado'));
      await expect(service.criar(CLIENT, dto(), 'client')).resolves.toBeDefined();
    });
  });

  describe('listarDoOwner', () => {
    it('escopo sempre limitado ao dono do token', async () => {
      await service.listarDoOwner(OWNER, {});
      expect(prisma.appointment.findMany.mock.calls[0][0].where.ownerId).toBe(OWNER);
    });

    it('recusa status inválido com 400 em vez de estourar 500', async () => {
      // Regressão: o valor da query ia cru para o Prisma e virava erro interno.
      await expect(service.listarDoOwner(OWNER, { status: 'DROP TABLE' })).rejects.toThrow(
        'Status inválido',
      );
    });

    it('aceita status válido', async () => {
      await service.listarDoOwner(OWNER, { status: 'COMPLETED' });
      expect(prisma.appointment.findMany.mock.calls[0][0].where.status).toBe('COMPLETED');
    });
  });

  describe('cancelar', () => {
    const existente = { id: 'a1', ownerId: OWNER, clientId: CLIENT, owner: {}, client: {}, service: {} };

    beforeEach(() => {
      prisma.appointment.findUnique.mockResolvedValue(existente);
      prisma.appointment.update.mockResolvedValue({ ...existente, status: 'CANCELLED' });
    });

    it('o dono do agendamento pode cancelar', async () => {
      await expect(service.cancelar('a1', OWNER, 'owner')).resolves.toBeDefined();
    });

    it('o cliente do agendamento pode cancelar', async () => {
      await expect(service.cancelar('a1', CLIENT, 'client')).resolves.toBeDefined();
    });

    it('outro cliente NÃO pode cancelar (IDOR)', async () => {
      await expect(service.cancelar('a1', 'intruso', 'client')).rejects.toThrow('Sem permissão');
    });

    it('outro dono NÃO pode cancelar (IDOR)', async () => {
      await expect(service.cancelar('a1', 'outro-dono', 'owner')).rejects.toThrow('Sem permissão');
    });

    it('agendamento inexistente dá 404', async () => {
      prisma.appointment.findUnique.mockResolvedValue(null);
      await expect(service.cancelar('x', OWNER, 'owner')).rejects.toThrow('não encontrado');
    });

    it('cancelar reverte o ponto de fidelidade', async () => {
      await service.cancelar('a1', OWNER, 'owner');
      expect(deps.loyalty.sincronizarPontos).toHaveBeenCalledWith('a1');
    });
  });

  describe('atualizarStatus / atualizarPagamento — isolamento multi-tenant', () => {
    it('dono não altera agendamento de outra barbearia', async () => {
      prisma.appointment.findUnique.mockResolvedValue({ id: 'a1', ownerId: 'outro' });
      await expect(
        service.atualizarStatus(OWNER, 'a1', { status: 'COMPLETED' } as any),
      ).rejects.toThrow('Sem permissão');
      expect(prisma.appointment.update).not.toHaveBeenCalled();
    });

    it('pagamento também é protegido por dono', async () => {
      prisma.appointment.findUnique.mockResolvedValue({ id: 'a1', ownerId: 'outro' });
      await expect(
        service.atualizarPagamento(OWNER, 'a1', { paymentStatus: 'PAID' } as any),
      ).rejects.toThrow('Sem permissão');
    });

    it('mudança de status sincroniza fidelidade', async () => {
      prisma.appointment.findUnique.mockResolvedValue({ id: 'a1', ownerId: OWNER });
      prisma.appointment.update.mockResolvedValue({ id: 'a1' });
      await service.atualizarStatus(OWNER, 'a1', { status: 'COMPLETED' } as any);
      expect(deps.loyalty.sincronizarPontos).toHaveBeenCalledWith('a1');
    });
  });
});
