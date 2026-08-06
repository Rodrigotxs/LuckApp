import { AgendaRulesService } from './agenda-rules.service';
import { criarPrismaMock, PrismaMock } from '../../../test/prisma-mock';

/**
 * Estes testes existem porque a extração criou um buraco.
 *
 * Enquanto a regra morava dentro do AppointmentsService, os testes daquele
 * serviço a exercitavam de verdade, pelos mocks do Prisma. Ao virar serviço
 * próprio, os dois consumidores passaram a mocká-la — e a lógica real (a
 * aritmética do expediente, o formato da consulta de sobreposição) ficou sem
 * ninguém verificando. Refatoração que aumenta cobertura aparente e diminui
 * cobertura real é o pior tipo.
 */
describe('AgendaRulesService', () => {
  let prisma: PrismaMock;
  let service: AgendaRulesService;

  const OWNER = 'owner-1';
  const em = (hhmm: string) => new Date(`2030-06-04T${hhmm}:00`);

  beforeEach(() => {
    prisma = criarPrismaMock();
    service = new AgendaRulesService(prisma as any);
    prisma.workingHours.findFirst.mockResolvedValue({
      ownerId: OWNER, dayOfWeek: 2, active: true, startTime: '09:00', endTime: '18:00',
    });
    prisma.availabilityBlock.findFirst.mockResolvedValue(null);
  });

  describe('validarJanela — expediente', () => {
    it('aceita horário dentro do expediente', async () => {
      await expect(service.validarJanela(OWNER, em('10:00'), em('10:30'))).resolves.toBeUndefined();
    });

    it('aceita horário colado no início do expediente', async () => {
      await expect(service.validarJanela(OWNER, em('09:00'), em('09:30'))).resolves.toBeUndefined();
    });

    it('aceita horário que termina exatamente no fim do expediente', async () => {
      await expect(service.validarJanela(OWNER, em('17:30'), em('18:00'))).resolves.toBeUndefined();
    });

    it('recusa começar antes da abertura', async () => {
      await expect(service.validarJanela(OWNER, em('08:59'), em('09:29')))
        .rejects.toThrow('fora do expediente');
    });

    it('recusa terminar depois do fechamento', async () => {
      await expect(service.validarJanela(OWNER, em('17:45'), em('18:15')))
        .rejects.toThrow('fora do expediente');
    });

    it('recusa dia sem horário cadastrado', async () => {
      prisma.workingHours.findFirst.mockResolvedValue(null);
      await expect(service.validarJanela(OWNER, em('10:00'), em('10:30')))
        .rejects.toThrow('não atende neste dia');
    });

    it('recusa dia marcado como inativo', async () => {
      prisma.workingHours.findFirst.mockResolvedValue({ active: false, startTime: '09:00', endTime: '18:00' });
      await expect(service.validarJanela(OWNER, em('10:00'), em('10:30')))
        .rejects.toThrow('não atende neste dia');
    });

    it('recusa atendimento que atravessa a meia-noite', async () => {
      // Sem esta checagem, comparar só "minutos do dia" faria 23:30–00:30
      // parecer válido: o fim (30) é menor que o início (1410).
      prisma.workingHours.findFirst.mockResolvedValue({ active: true, startTime: '00:00', endTime: '23:59' });
      const inicio = new Date('2030-06-04T23:30:00');
      const fim = new Date('2030-06-05T00:30:00');
      await expect(service.validarJanela(OWNER, inicio, fim)).rejects.toThrow('fora do expediente');
    });

    it('consulta o expediente do dia da semana correto', async () => {
      // 2030-06-04 é uma terça (dia 2).
      await service.validarJanela(OWNER, em('10:00'), em('10:30'));
      expect(prisma.workingHours.findFirst.mock.calls[0][0].where).toEqual({
        ownerId: OWNER, dayOfWeek: 2,
      });
    });
  });

  describe('validarJanela — bloqueios', () => {
    it('recusa horário sobre um bloqueio', async () => {
      prisma.availabilityBlock.findFirst.mockResolvedValue({ id: 'bl1' });
      await expect(service.validarJanela(OWNER, em('10:00'), em('10:30')))
        .rejects.toThrow('bloqueado');
    });

    it('sem barbeiro, considera apenas bloqueio geral', async () => {
      await service.validarJanela(OWNER, em('10:00'), em('10:30'));
      expect(prisma.availabilityBlock.findFirst.mock.calls[0][0].where.OR)
        .toEqual([{ barberId: null }]);
    });

    it('com barbeiro, considera bloqueio geral E o do barbeiro', async () => {
      await service.validarJanela(OWNER, em('10:00'), em('10:30'), 'b1');
      expect(prisma.availabilityBlock.findFirst.mock.calls[0][0].where.OR)
        .toEqual([{ barberId: null }, { barberId: 'b1' }]);
    });

    it('a busca de bloqueio usa sobreposição real', async () => {
      await service.validarJanela(OWNER, em('10:00'), em('10:30'));
      const w = prisma.availabilityBlock.findFirst.mock.calls[0][0].where;
      expect(w.startAt).toHaveProperty('lt');
      expect(w.endAt).toHaveProperty('gt');
    });
  });

  describe('encontrarConflito', () => {
    it('escopa por dono e ignora cancelados', async () => {
      await service.encontrarConflito(OWNER, em('10:00'), em('10:30'));
      const w = prisma.appointment.findFirst.mock.calls[0][0].where;
      expect(w.ownerId).toBe(OWNER);
      expect(w.status).toEqual({ notIn: ['CANCELLED'] });
    });

    it('usa sobreposição real: início < fim && fim > início', async () => {
      await service.encontrarConflito(OWNER, em('10:00'), em('10:30'));
      const w = prisma.appointment.findFirst.mock.calls[0][0].where;
      expect(w.startAt).toEqual({ lt: em('10:30') });
      expect(w.endAt).toEqual({ gt: em('10:00') });
    });

    it('inclui o barbeiro no escopo quando informado', async () => {
      // Dois barbeiros atendem em paralelo: horário ocupado com o A não
      // impede o mesmo horário com o B.
      await service.encontrarConflito(OWNER, em('10:00'), em('10:30'), 'b1');
      expect(prisma.appointment.findFirst.mock.calls[0][0].where.barberId).toBe('b1');
    });

    it('sem barbeiro, não filtra por barbeiro', async () => {
      await service.encontrarConflito(OWNER, em('10:00'), em('10:30'));
      expect(prisma.appointment.findFirst.mock.calls[0][0].where.barberId).toBeUndefined();
    });

    it('ignora o próprio agendamento ao remarcar', async () => {
      await service.encontrarConflito(OWNER, em('10:00'), em('10:30'), 'b1', 'a1');
      expect(prisma.appointment.findFirst.mock.calls[0][0].where.id).toEqual({ not: 'a1' });
    });

    it('sem ignorarId, não adiciona o filtro', async () => {
      await service.encontrarConflito(OWNER, em('10:00'), em('10:30'));
      expect(prisma.appointment.findFirst.mock.calls[0][0].where.id).toBeUndefined();
    });
  });

  describe('ehConflitoDeBanco', () => {
    it('reconhece o código do Prisma', () => {
      expect(service.ehConflitoDeBanco({ code: 'P2010' })).toBe(true);
    });

    it('reconhece o SQLSTATE da constraint EXCLUDE', () => {
      expect(service.ehConflitoDeBanco({ meta: { code: '23P01' } })).toBe(true);
    });

    it('reconhece pela mensagem', () => {
      expect(service.ehConflitoDeBanco({ message: 'exclusion_violation on Appointment' })).toBe(true);
      expect(service.ehConflitoDeBanco({ message: 'ERROR: 23P01' })).toBe(true);
    });

    it('NÃO confunde erro comum com conflito', () => {
      // Tratar qualquer erro como "horário ocupado" esconderia falha de banco
      // atrás de uma mensagem tranquilizadora.
      expect(service.ehConflitoDeBanco(new Error('conexão perdida'))).toBe(false);
      expect(service.ehConflitoDeBanco({ code: 'P2002' })).toBe(false);
      expect(service.ehConflitoDeBanco(null)).toBe(false);
      expect(service.ehConflitoDeBanco(undefined)).toBe(false);
    });
  });
});
