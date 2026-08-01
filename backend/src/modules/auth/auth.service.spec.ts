import { AuthService } from './auth.service';
import { criarPrismaMock, integracoesMock, PrismaMock } from '../../../test/prisma-mock';
import { hashToken, OTP_MAX_ATTEMPTS } from '../../common/security/otp.util';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let prisma: PrismaMock;
  let deps: ReturnType<typeof integracoesMock>;
  let jwt: { sign: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = criarPrismaMock();
    deps = integracoesMock();
    jwt = { sign: jest.fn().mockReturnValue('token-jwt') };
    service = new AuthService(prisma as any, jwt as any, deps.whatsapp as any, deps.email as any);
  });

  const futuro = () => new Date(Date.now() + 5 * 60_000);
  const passado = () => new Date(Date.now() - 60_000);

  describe('registro e login do dono', () => {
    it('recusa e-mail já cadastrado', async () => {
      prisma.owner.findUnique.mockResolvedValue({ id: 'o1' });
      await expect(
        service.registerOwner({ email: 'a@b.com', password: 'Senha123!', name: 'A', whatsapp: '55', barbershopName: 'B' } as any),
      ).rejects.toThrow('já cadastrado');
    });

    it('guarda a senha com hash bcrypt, nunca em texto puro', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);
      prisma.owner.create.mockImplementation(async ({ data }: any) => ({ id: 'o1', ...data }));

      await service.registerOwner({
        email: 'a@b.com', password: 'SenhaForte123!', name: 'Ana Silva', whatsapp: '55', barbershopName: 'B',
      } as any);

      const salvo = prisma.owner.create.mock.calls[0][0].data;
      expect(salvo.passwordHash).not.toBe('SenhaForte123!');
      expect(salvo.passwordHash.startsWith('$2')).toBe(true);
      expect(await bcrypt.compare('SenhaForte123!', salvo.passwordHash)).toBe(true);
    });

    it('a resposta do registro não devolve o hash da senha', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);
      prisma.owner.create.mockImplementation(async ({ data }: any) => ({ id: 'o1', ...data }));

      const r: any = await service.registerOwner({
        email: 'a@b.com', password: 'SenhaForte123!', name: 'Ana', whatsapp: '55', barbershopName: 'B',
      } as any);

      expect(r.owner.passwordHash).toBeUndefined();
      expect(r.owner.otpCode).toBeUndefined();
      expect(r.owner.passwordResetToken).toBeUndefined();
      expect(r.owner.googleAccessToken).toBeUndefined();
    });

    it('senha errada e e-mail inexistente dão a MESMA mensagem', async () => {
      prisma.owner.findUnique.mockResolvedValue(null);
      const semConta = await service.loginOwner({ email: 'x@y.com', password: 'a' } as any).catch((e) => e.message);

      prisma.owner.findUnique.mockResolvedValue({ id: 'o1', passwordHash: await bcrypt.hash('outra', 4) });
      const senhaErrada = await service.loginOwner({ email: 'x@y.com', password: 'a' } as any).catch((e) => e.message);

      // Mensagens diferentes revelariam quais e-mails existem.
      expect(semConta).toBe(senhaErrada);
    });
  });

  describe('OTP do cliente por WhatsApp', () => {
    it('não sobrescreve o nome de uma conta existente', async () => {
      // Regressão: a rota é pública; permitir update de nome deixava qualquer
      // um renomear a conta alheia sabendo só o número.
      await service.enviarOtp({ whatsapp: '5511', name: 'Invasor' } as any);
      const update = prisma.client.upsert.mock.calls[0][0].update;
      expect(update.name).toBeUndefined();
      expect(update.otpAttempts).toBe(0);
    });

    it('usa o nome apenas ao criar conta nova', async () => {
      await service.enviarOtp({ whatsapp: '5511', name: 'Novo' } as any);
      expect(prisma.client.upsert.mock.calls[0][0].create.name).toBe('Novo');
    });

    it('o código enviado tem 6 dígitos', async () => {
      await service.enviarOtp({ whatsapp: '5511', name: 'N' } as any);
      expect(deps.whatsapp.enviarOtp.mock.calls[0][1]).toMatch(/^\d{6}$/);
    });

    it('aceita o código correto e limpa o OTP', async () => {
      prisma.client.findUnique.mockResolvedValue({
        id: 'c1', name: 'N', whatsapp: '5511', otpCode: '123456', otpExpiresAt: futuro(), otpAttempts: 0,
      });
      const r: any = await service.verificarOtp({ whatsapp: '5511', code: '123456' } as any);
      expect(r.token).toBe('token-jwt');
      expect(prisma.client.update.mock.calls[0][0].data).toEqual({
        otpCode: null, otpExpiresAt: null, otpAttempts: 0,
      });
    });

    it('conta a tentativa quando o código está errado', async () => {
      prisma.client.findUnique.mockResolvedValue({
        id: 'c1', otpCode: '123456', otpExpiresAt: futuro(), otpAttempts: 0,
      });
      await expect(service.verificarOtp({ whatsapp: '5511', code: '000000' } as any)).rejects.toThrow();
      expect(prisma.client.update.mock.calls[0][0].data).toEqual({ otpAttempts: { increment: 1 } });
    });

    it('invalida o código ao estourar o limite de tentativas', async () => {
      // Regressão: sem contador, 10^6 combinações caem por força bruta.
      prisma.client.findUnique.mockResolvedValue({
        id: 'c1', otpCode: '123456', otpExpiresAt: futuro(), otpAttempts: OTP_MAX_ATTEMPTS,
      });
      // Mesmo mandando o código CERTO, o OTP já foi queimado.
      await expect(service.verificarOtp({ whatsapp: '5511', code: '123456' } as any)).rejects.toThrow();
      expect(prisma.client.update.mock.calls[0][0].data.otpCode).toBeNull();
    });

    it('código expirado é recusado e apagado', async () => {
      prisma.client.findUnique.mockResolvedValue({
        id: 'c1', otpCode: '123456', otpExpiresAt: passado(), otpAttempts: 0,
      });
      await expect(service.verificarOtp({ whatsapp: '5511', code: '123456' } as any)).rejects.toThrow();
      expect(prisma.client.update.mock.calls[0][0].data.otpCode).toBeNull();
    });

    it('conta inexistente, código errado e expirado dão a MESMA mensagem', async () => {
      const msgs: string[] = [];

      prisma.client.findUnique.mockResolvedValue(null);
      msgs.push(await service.verificarOtp({ whatsapp: '1', code: '1' } as any).catch((e) => e.message));

      prisma.client.findUnique.mockResolvedValue({ id: 'c1', otpCode: '123456', otpExpiresAt: futuro(), otpAttempts: 0 });
      msgs.push(await service.verificarOtp({ whatsapp: '1', code: '999999' } as any).catch((e) => e.message));

      prisma.client.findUnique.mockResolvedValue({ id: 'c1', otpCode: '123456', otpExpiresAt: passado(), otpAttempts: 0 });
      msgs.push(await service.verificarOtp({ whatsapp: '1', code: '123456' } as any).catch((e) => e.message));

      expect(new Set(msgs).size).toBe(1);
    });
  });

  describe('OTP do dono — enumeração de conta', () => {
    it('responde igual exista ou não a conta', async () => {
      prisma.owner.findFirst.mockResolvedValue(null);
      const semConta = await service.enviarOtpOwner({ whatsapp: '5511' } as any);

      prisma.owner.findFirst.mockResolvedValue({ id: 'o1', whatsapp: '5511' });
      const comConta = await service.enviarOtpOwner({ whatsapp: '5511' } as any);

      // Regressão: antes a versão sem conta dizia "Não encontramos uma conta
      // com este WhatsApp", permitindo varrer números até achar donos.
      expect(semConta).toEqual(comConta);
    });

    it('não envia OTP quando a conta não existe', async () => {
      prisma.owner.findFirst.mockResolvedValue(null);
      await service.enviarOtpOwner({ whatsapp: '5511' } as any);
      expect(deps.whatsapp.enviarOtp).not.toHaveBeenCalled();
    });

    it('falha no envio não vira sinal de existência de conta', async () => {
      prisma.owner.findFirst.mockResolvedValue({ id: 'o1', whatsapp: '5511' });
      deps.whatsapp.enviarOtp.mockRejectedValue(new Error('gateway fora'));
      await expect(service.enviarOtpOwner({ whatsapp: '5511' } as any)).resolves.toBeDefined();
    });

    it('limite de tentativas também vale para o dono', async () => {
      prisma.owner.findFirst.mockResolvedValue({
        id: 'o1', otpCode: '123456', otpExpiresAt: futuro(), otpAttempts: OTP_MAX_ATTEMPTS,
      });
      await expect(service.verificarOtpOwner({ whatsapp: '5511', code: '123456' } as any)).rejects.toThrow();
      expect(prisma.owner.update.mock.calls[0][0].data.otpCode).toBeNull();
    });
  });

  describe('reset de senha', () => {
    it('conta inexistente devolve a mesma mensagem genérica', async () => {
      prisma.owner.findFirst.mockResolvedValue(null);
      const r = await service.solicitarResetSenha({ email: 'x@y.com' } as any);
      expect(r.message).toMatch(/Se a conta existir/);
      expect(prisma.owner.update).not.toHaveBeenCalled();
    });

    it('grava o HASH do token, nunca o valor enviado', async () => {
      prisma.owner.findFirst.mockResolvedValue({ id: 'o1', whatsapp: '5511', email: 'a@b.com' });
      await service.solicitarResetSenha({ email: 'a@b.com' } as any);

      const gravado = prisma.owner.update.mock.calls[0][0].data.passwordResetToken;
      const enviado = deps.whatsapp.notificar.mock.calls[0][1].match(/token=([0-9a-f]+)/)[1];

      expect(gravado).not.toBe(enviado);
      expect(gravado).toBe(hashToken(enviado));
    });

    it('a confirmação busca pelo hash do token recebido', async () => {
      prisma.owner.findFirst.mockResolvedValue({ id: 'o1' });
      await service.confirmarResetSenha({ token: 'abc123', newPassword: 'NovaSenha123!' } as any);
      expect(prisma.owner.findFirst.mock.calls[0][0].where.passwordResetToken).toBe(hashToken('abc123'));
    });

    it('token inválido é rejeitado', async () => {
      prisma.owner.findFirst.mockResolvedValue(null);
      await expect(
        service.confirmarResetSenha({ token: 'ruim', newPassword: 'X' } as any),
      ).rejects.toThrow('inválido ou expirado');
    });

    it('a confirmação exige token não expirado', async () => {
      prisma.owner.findFirst.mockResolvedValue({ id: 'o1' });
      await service.confirmarResetSenha({ token: 'abc', newPassword: 'NovaSenha123!' } as any);
      expect(prisma.owner.findFirst.mock.calls[0][0].where.passwordResetExpires).toHaveProperty('gt');
    });

    it('reset limpa o token e invalida OTP pendente', async () => {
      prisma.owner.findFirst.mockResolvedValue({ id: 'o1' });
      await service.confirmarResetSenha({ token: 'abc', newPassword: 'NovaSenha123!' } as any);
      const d = prisma.owner.update.mock.calls[0][0].data;
      expect(d.passwordResetToken).toBeNull();
      expect(d.otpCode).toBeNull();
    });
  });

  describe('login do cliente com senha', () => {
    it('exige email ou whatsapp', async () => {
      await expect(service.loginCliente({ password: 'x' } as any)).rejects.toThrow('Informe email ou whatsapp');
    });

    it('conta sem senha orienta o fluxo de OTP', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'c1', passwordHash: null });
      await expect(
        service.loginCliente({ email: 'a@b.com', password: 'x' } as any),
      ).rejects.toThrow(/código/i);
    });

    it('senha errada é rejeitada', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'c1', passwordHash: await bcrypt.hash('certa', 4) });
      await expect(
        service.loginCliente({ email: 'a@b.com', password: 'errada' } as any),
      ).rejects.toThrow('Credenciais inválidas');
    });

    it('senha correta devolve token', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'c1', name: 'N', passwordHash: await bcrypt.hash('certa', 4) });
      const r: any = await service.loginCliente({ email: 'a@b.com', password: 'certa' } as any);
      expect(r.token).toBe('token-jwt');
    });

    it('a resposta não devolve o hash da senha', async () => {
      prisma.client.findFirst.mockResolvedValue({ id: 'c1', name: 'N', passwordHash: await bcrypt.hash('certa', 4) });
      const r: any = await service.loginCliente({ email: 'a@b.com', password: 'certa' } as any);
      expect(JSON.stringify(r)).not.toMatch(/\$2[aby]\$/);
    });
  });

  describe('token JWT', () => {
    it('carrega o papel para o guard poder decidir', async () => {
      prisma.client.findUnique.mockResolvedValue({ id: 'c1', otpCode: '1', otpExpiresAt: futuro(), otpAttempts: 0 });
      await service.verificarOtp({ whatsapp: '55', code: '1' } as any);
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'c1', role: 'client' });
    });
  });
});
