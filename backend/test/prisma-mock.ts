/**
 * Duplo de teste do PrismaService.
 *
 * Deliberadamente sem tipagem do client gerado: assim os testes rodam sem
 * depender de `prisma generate`, que exige baixar o engine nativo.
 */
export type MockFn = jest.Mock;

const MODELOS = [
  'owner',
  'client',
  'unit',
  'barber',
  'service',
  'workingHours',
  'appointment',
  'availabilityBlock',
  'rescheduleRequest',
] as const;

const METODOS = [
  'findUnique',
  'findFirst',
  'findMany',
  'create',
  'update',
  'updateMany',
  'upsert',
  'delete',
  'deleteMany',
  'count',
  'aggregate',
] as const;

export type PrismaMock = Record<string, any>;

export function criarPrismaMock(): PrismaMock {
  const mock: PrismaMock = {};
  for (const modelo of MODELOS) {
    mock[modelo] = {};
    for (const metodo of METODOS) {
      mock[modelo][metodo] = jest.fn();
    }
  }
  mock.$transaction = jest.fn(async (arg: any) =>
    typeof arg === 'function' ? arg(mock) : Promise.all(arg),
  );
  mock.$queryRaw = jest.fn();
  mock.$executeRaw = jest.fn();
  return mock;
}

/** Serviços de integração que não devem disparar nada durante teste. */
export const integracoesMock = () => ({
  googleCalendar: { criarEvento: jest.fn(), deletarEvento: jest.fn(), obterEventosOcupados: jest.fn().mockResolvedValue([]) },
  whatsapp: { enviarOtp: jest.fn(), enviarConfirmacao: jest.fn(), notificar: jest.fn() },
  email: { enviarOtp: jest.fn(), enviarResetSenha: jest.fn() },
  loyalty: { concederPontos: jest.fn(), sincronizarPontos: jest.fn(), obterStatus: jest.fn(), resgatar: jest.fn() },
});
