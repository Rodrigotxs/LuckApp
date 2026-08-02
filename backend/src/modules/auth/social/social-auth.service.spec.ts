import axios from 'axios';
import { SocialAuthService } from './social-auth.service';
import { criarPrismaMock, PrismaMock } from '../../../../test/prisma-mock';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('SocialAuthService', () => {
  let prisma: PrismaMock;
  let config: { get: jest.Mock };
  let jwt: { sign: jest.Mock; verify: jest.Mock };
  let service: SocialAuthService;

  const ENV: Record<string, string> = {
    GOOGLE_CLIENT_ID: 'gid',
    GOOGLE_CLIENT_SECRET: 'gsecret',
    FACEBOOK_CLIENT_ID: 'fid',
    FACEBOOK_CLIENT_SECRET: 'fsecret',
    FRONTEND_URL: 'https://app.luck.com.br',
    API_PUBLIC_URL: 'https://api.luck.com.br',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma = criarPrismaMock();
    config = { get: jest.fn((k: string) => ENV[k]) };
    jwt = {
      sign: jest.fn().mockReturnValue('jwt-assinado'),
      verify: jest.fn().mockReturnValue({ provider: 'google', papel: 'client', nonce: 'n' }),
    };
    service = new SocialAuthService(prisma as any, config as any, jwt as any);
  });

  /** Encena a ida ao provedor: troca de código e leitura de perfil. */
  const perfilDoProvedor = (perfil: Record<string, any>) => {
    // Valor distintivo de proposito: 'tok' daria falso positivo por ser
    // substring de "token", o campo legitimo da nossa resposta.
    axiosMock.post.mockResolvedValue({ data: { access_token: 'ACCESS-TOKEN-DO-PROVEDOR' } } as any);
    axiosMock.get.mockResolvedValue({ data: perfil } as any);
  };

  const GOOGLE_VERIFICADO = {
    sub: 'g-123', email: 'ana@x.com', email_verified: true,
    name: 'Ana Silva', picture: 'http://img/a.png',
  };
  const GOOGLE_NAO_VERIFICADO = { ...GOOGLE_VERIFICADO, email_verified: false };

  describe('providers disponiveis', () => {
    it('lista apenas o que esta configurado', () => {
      expect(service.providersDisponiveis().map((p) => p.id)).toEqual(['google', 'facebook']);
    });

    it('omite provedor sem credencial - a tela nao mostra botao morto', () => {
      config.get.mockImplementation((k: string) => (k.startsWith('FACEBOOK') ? undefined : ENV[k]));
      expect(service.providersDisponiveis().map((p) => p.id)).toEqual(['google']);
      expect(service.estaConfigurado('facebook')).toBe(false);
    });

    it('fora de producao, diz QUAIS variaveis faltam', () => {
      // Regressao: a secao inteira sumia sem explicacao, e quem estava
      // montando o ambiente achava que tinha quebrado alguma coisa.
      config.get.mockImplementation((k: string) => (k.startsWith('GOOGLE') ? undefined : ENV[k]));
      expect(service.providersPendentes()).toEqual([
        { id: 'google', nome: 'Google', faltando: ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET'] },
      ]);
    });

    it('em producao NAO expoe o que falta configurar', () => {
      // Detalhe de infraestrutura nao interessa ao usuario final, e provedor
      // nao configurado simplesmente nao existe para ele.
      config.get.mockImplementation((k: string) =>
        k === 'NODE_ENV' ? 'production' : k.startsWith('GOOGLE') ? undefined : ENV[k],
      );
      expect(service.providersPendentes()).toEqual([]);
    });

    it('recusa iniciar login em provedor nao configurado', () => {
      config.get.mockImplementation((k: string) => (k.startsWith('GOOGLE') ? undefined : ENV[k]));
      expect(() => service.gerarUrlAutorizacao('google', 'client')).toThrow(/não está configurado/);
    });
  });

  describe('URL de autorizacao', () => {
    it('aponta para o provedor com os parametros obrigatorios', () => {
      const url = new URL(service.gerarUrlAutorizacao('google', 'client'));
      expect(url.origin + url.pathname).toBe('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url.searchParams.get('client_id')).toBe('gid');
      expect(url.searchParams.get('response_type')).toBe('code');
      expect(url.searchParams.get('redirect_uri')).toBe('https://api.luck.com.br/auth/social/google/callback');
      expect(url.searchParams.get('scope')).toContain('email');
    });

    it('nunca coloca o client_secret na URL que vai para o navegador', () => {
      const url = service.gerarUrlAutorizacao('google', 'client');
      expect(url).not.toContain('gsecret');
    });

    it('o state e assinado e carrega o papel', () => {
      service.gerarUrlAutorizacao('facebook', 'owner');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'facebook', papel: 'owner' }),
        expect.objectContaining({ expiresIn: '10m' }),
      );
    });

    it('o state tem nonce diferente a cada chamada', () => {
      service.gerarUrlAutorizacao('google', 'client');
      service.gerarUrlAutorizacao('google', 'client');
      const [a] = jwt.sign.mock.calls[0];
      const [b] = jwt.sign.mock.calls[1];
      expect(a.nonce).not.toBe(b.nonce);
    });
  });

  describe('validacao do callback', () => {
    it('recusa state forjado ou expirado', async () => {
      jwt.verify.mockImplementation(() => { throw new Error('invalid signature'); });
      await expect(service.concluirLogin('forjado', 'code')).rejects.toThrow(/inválido ou expirado/);
    });

    it('recusa callback sem codigo', async () => {
      await expect(service.concluirLogin('state', '')).rejects.toThrow(/Código de autorização ausente/);
    });

    it('o papel vem do state assinado, nao de parametro solto', async () => {
      // Se o papel viajasse na query, bastaria trocar client por owner.
      jwt.verify.mockReturnValue({ provider: 'google', papel: 'owner', nonce: 'n' });
      perfilDoProvedor(GOOGLE_VERIFICADO);
      prisma.owner.findFirst.mockResolvedValue(null);
      prisma.owner.findUnique.mockResolvedValue(null);
      prisma.owner.create.mockImplementation(async ({ data }: any) => ({ id: 'o1', ...data }));

      const r: any = await service.concluirLogin('state', 'code');

      expect(r.papel).toBe('owner');
      expect(prisma.client.create).not.toHaveBeenCalled();
    });

    it('nao vaza detalhe do provedor quando a troca de codigo falha', async () => {
      axiosMock.post.mockRejectedValue({ message: 'client_secret=gsecret invalido' });
      await expect(service.concluirLogin('state', 'code')).rejects.toThrow(/Não foi possível concluir o login/);
      await expect(service.concluirLogin('state', 'code')).rejects.not.toThrow(/gsecret/);
    });
  });

  describe('cliente — vinculo de conta', () => {
    it('entra na conta ja vinculada aquele id de provedor', async () => {
      perfilDoProvedor(GOOGLE_VERIFICADO);
      prisma.client.findFirst.mockResolvedValue({ id: 'c1', name: 'Ana', whatsapp: '5511999' });

      const r: any = await service.concluirLogin('state', 'code');

      expect(r.user.id).toBe('c1');
      expect(r.novo).toBe(false);
      expect(prisma.client.create).not.toHaveBeenCalled();
    });

    it('vincula a conta existente quando o provedor CONFIRMOU o e-mail', async () => {
      perfilDoProvedor(GOOGLE_VERIFICADO);
      prisma.client.findFirst
        .mockResolvedValueOnce(null)                                       // por providerId
        .mockResolvedValueOnce({ id: 'c1', email: 'ana@x.com', avatarUrl: null }); // por email
      prisma.client.update.mockImplementation(async ({ data }: any) => ({ id: 'c1', ...data }));

      await service.concluirLogin('state', 'code');

      expect(prisma.client.update.mock.calls[0][0].data).toMatchObject({
        googleId: 'g-123',
        emailVerificado: true,
      });
    });

    it('RECUSA vincular quando o e-mail NAO foi confirmado (tomada de conta)', async () => {
      // Sem esta regra, basta criar conta no provedor com o e-mail da vitima
      // para entrar na conta dela.
      perfilDoProvedor(GOOGLE_NAO_VERIFICADO);
      prisma.client.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: 'vitima', email: 'ana@x.com' });

      await expect(service.concluirLogin('state', 'code')).rejects.toThrow(/Já existe uma conta com este e-mail/);
      expect(prisma.client.update).not.toHaveBeenCalled();
    });

    it('cria conta nova quando nao ha nada com aquele e-mail', async () => {
      perfilDoProvedor(GOOGLE_VERIFICADO);
      prisma.client.findFirst.mockResolvedValue(null);
      prisma.client.create.mockImplementation(async ({ data }: any) => ({ id: 'novo', ...data }));

      const r: any = await service.concluirLogin('state', 'code');

      expect(r.novo).toBe(true);
      expect(prisma.client.create.mock.calls[0][0].data).toMatchObject({
        name: 'Ana Silva',
        email: 'ana@x.com',
        googleId: 'g-123',
        emailVerificado: true,
      });
    });

    it('sinaliza cadastro incompleto — o WhatsApp ainda e placeholder', async () => {
      // Sem WhatsApp real o cliente nao recebe confirmacao nem lembrete,
      // entao a tela precisa saber que falta pedir.
      perfilDoProvedor(GOOGLE_VERIFICADO);
      prisma.client.findFirst.mockResolvedValue(null);
      prisma.client.create.mockImplementation(async ({ data }: any) => ({ id: 'novo', ...data }));

      const r: any = await service.concluirLogin('state', 'code');

      expect(r.user.whatsapp).toBe('email:ana@x.com');
      expect(r.cadastroIncompleto).toBe(true);
    });

    it('cliente sem e-mail no provedor ainda consegue entrar', async () => {
      perfilDoProvedor({ sub: 'g-999', name: 'Sem Email' });
      prisma.client.findFirst.mockResolvedValue(null);
      prisma.client.create.mockImplementation(async ({ data }: any) => ({ id: 'novo', ...data }));

      const r: any = await service.concluirLogin('state', 'code');

      expect(r.user.whatsapp).toBe('google:g-999');
      expect(prisma.client.create.mock.calls[0][0].data.emailVerificado).toBe(false);
    });
  });

  describe('dono — regras mais duras', () => {
    beforeEach(() => jwt.verify.mockReturnValue({ provider: 'google', papel: 'owner', nonce: 'n' }));

    it('entra na conta ja vinculada', async () => {
      perfilDoProvedor(GOOGLE_VERIFICADO);
      prisma.owner.findFirst.mockResolvedValue({ id: 'o1', name: 'Ana', passwordHash: 'h', barbershopAddress: 'R X', whatsapp: '55' });

      const r: any = await service.concluirLogin('state', 'code');

      expect(r.user.id).toBe('o1');
      expect(r.user.temSenha).toBe(true);
    });

    it('RECUSA vincular barbearia existente sem e-mail confirmado', async () => {
      perfilDoProvedor(GOOGLE_NAO_VERIFICADO);
      prisma.owner.findFirst.mockResolvedValue(null);
      prisma.owner.findUnique.mockResolvedValue({ id: 'vitima', email: 'ana@x.com' });

      await expect(service.concluirLogin('state', 'code')).rejects.toThrow(/Já existe uma barbearia/);
      expect(prisma.owner.update).not.toHaveBeenCalled();
    });

    it('RECUSA criar barbearia com e-mail nao confirmado', async () => {
      // Conta de dono controla agenda, dados de clientes e faturamento.
      perfilDoProvedor(GOOGLE_NAO_VERIFICADO);
      prisma.owner.findFirst.mockResolvedValue(null);
      prisma.owner.findUnique.mockResolvedValue(null);

      await expect(service.concluirLogin('state', 'code')).rejects.toThrow(/não está confirmado/);
      expect(prisma.owner.create).not.toHaveBeenCalled();
    });

    it('RECUSA criar barbearia sem e-mail nenhum', async () => {
      perfilDoProvedor({ sub: 'g-777', name: 'Sem Email' });
      prisma.owner.findFirst.mockResolvedValue(null);

      await expect(service.concluirLogin('state', 'code')).rejects.toThrow(/precisa de um/);
    });

    it('cria dono sem senha, e nao com hash aleatorio', async () => {
      // Hash de string aleatoria seria uma senha que ninguem conhece mas que
      // existe — alvo sem dono. Melhor a coluna nula.
      perfilDoProvedor(GOOGLE_VERIFICADO);
      prisma.owner.findFirst.mockResolvedValue(null);
      prisma.owner.findUnique.mockResolvedValue(null);
      prisma.owner.create.mockImplementation(async ({ data }: any) => ({ id: 'o1', ...data }));

      const r: any = await service.concluirLogin('state', 'code');

      expect(prisma.owner.create.mock.calls[0][0].data.passwordHash).toBeNull();
      expect(r.user.temSenha).toBe(false);
      expect(r.cadastroIncompleto).toBe(true);
    });
  });

  describe('resposta e redirecionamento', () => {
    it('a sessao nao devolve hash de senha nem token do provedor', async () => {
      perfilDoProvedor(GOOGLE_VERIFICADO);
      prisma.client.findFirst.mockResolvedValue({
        id: 'c1', name: 'Ana', whatsapp: '5511', passwordHash: '$2a$12$abc', otpCode: '123456',
      });

      const r: any = await service.concluirLogin('state', 'code');
      const serializado = JSON.stringify(r);

      expect(serializado).not.toContain('$2a$');
      expect(serializado).not.toContain('123456');
      expect(serializado).not.toContain('ACCESS-TOKEN-DO-PROVEDOR');
    });

    it('o token volta no FRAGMENTO da URL, nao na query', () => {
      // Query string vaza em log de acesso e no cabecalho Referer.
      const url = service.urlRetorno({ token: 'jwt-x', papel: 'client', novo: true, cadastroIncompleto: false });
      expect(url).toContain('#');
      expect(url.split('#')[0]).not.toContain('jwt-x');
      expect(url.split('#')[1]).toContain('token=jwt-x');
    });

    it('o erro volta para o frontend, nao vira JSON cru no navegador', () => {
      const url = service.urlErro('Login cancelado.');
      expect(url.startsWith('https://app.luck.com.br/auth/callback#')).toBe(true);
      expect(url).toContain('erro=');
    });
  });
});
