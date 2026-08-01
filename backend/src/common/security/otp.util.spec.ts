import {
  gerarCodigoOtp,
  compararSegredo,
  gerarTokenReset,
  hashToken,
  expiracaoOtp,
  OTP_LENGTH,
  OTP_TTL_MIN,
} from './otp.util';

describe('otp.util', () => {
  describe('gerarCodigoOtp', () => {
    it('gera sempre o número correto de dígitos', () => {
      for (let i = 0; i < 500; i++) {
        const c = gerarCodigoOtp();
        expect(c).toHaveLength(OTP_LENGTH);
        expect(c).toMatch(/^\d+$/);
      }
    });

    it('preserva zeros à esquerda (000042 não vira 42)', () => {
      // Regressão: um gerador que fizesse Math.floor(100000 + rand*900000)
      // nunca produziria código começando em zero, reduzindo o espaço de
      // busca em 10%. Aqui todo código tem o tamanho cheio.
      const codigos = Array.from({ length: 5000 }, gerarCodigoOtp);
      expect(codigos.every((c) => c.length === OTP_LENGTH)).toBe(true);
      expect(codigos.some((c) => c.startsWith('0'))).toBe(true);
    });

    it('não repete de forma detectável em amostra grande', () => {
      const amostra = new Set(Array.from({ length: 2000 }, gerarCodigoOtp));
      // Com 10^6 possibilidades, 2000 sorteios devem gerar quase tudo distinto.
      expect(amostra.size).toBeGreaterThan(1900);
    });
  });

  describe('compararSegredo', () => {
    it('aceita valores iguais', () => {
      expect(compararSegredo('123456', '123456')).toBe(true);
    });

    it('rejeita valores diferentes', () => {
      expect(compararSegredo('123456', '123457')).toBe(false);
    });

    it('rejeita nulo, indefinido e vazio dos dois lados', () => {
      expect(compararSegredo(null, '123456')).toBe(false);
      expect(compararSegredo('123456', null)).toBe(false);
      expect(compararSegredo(undefined, undefined)).toBe(false);
      expect(compararSegredo('', '')).toBe(false);
      // Caso crítico: código nulo no banco não pode casar com string vazia.
      expect(compararSegredo(null, '')).toBe(false);
    });

    it('rejeita valores de tamanhos diferentes sem estourar', () => {
      expect(compararSegredo('1', '1234567890')).toBe(false);
    });
  });

  describe('token de reset', () => {
    it('gera token longo e imprevisível', () => {
      const { token } = gerarTokenReset();
      expect(token).toMatch(/^[0-9a-f]{64}$/);
    });

    it('o hash guardado difere do token enviado', () => {
      const { token, tokenHash } = gerarTokenReset();
      expect(tokenHash).not.toBe(token);
      expect(hashToken(token)).toBe(tokenHash);
    });

    it('hash é determinístico — permite buscar pelo token recebido', () => {
      expect(hashToken('abc')).toBe(hashToken('abc'));
      expect(hashToken('abc')).not.toBe(hashToken('abd'));
    });

    it('tokens sucessivos são distintos', () => {
      const tokens = new Set(Array.from({ length: 200 }, () => gerarTokenReset().token));
      expect(tokens.size).toBe(200);
    });
  });

  describe('expiracaoOtp', () => {
    it('expira no TTL configurado', () => {
      const agora = new Date('2026-01-01T10:00:00Z');
      expect(expiracaoOtp(agora).toISOString()).toBe(
        new Date(agora.getTime() + OTP_TTL_MIN * 60_000).toISOString(),
      );
    });

    it('sempre no futuro em relação à referência', () => {
      const agora = new Date();
      expect(expiracaoOtp(agora).getTime()).toBeGreaterThan(agora.getTime());
    });
  });
});
