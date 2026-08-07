import { validarEnv } from './env.validation';

const base = {
  DATABASE_URL: 'postgresql://u:p@localhost:5432/db',
  JWT_SECRET: 'um-segredo-suficientemente-longo-para-producao-ok',
} as NodeJS.ProcessEnv;

describe('validarEnv', () => {
  it('aceita uma configuração mínima válida', () => {
    const env = validarEnv({ ...base });
    expect(env.PORT).toBe(3001);
    expect(env.JWT_EXPIRES_IN).toBe('7d');
    expect(env.isProducao).toBe(false);
  });

  it('exige DATABASE_URL', () => {
    expect(() => validarEnv({ ...base, DATABASE_URL: undefined })).toThrow(/DATABASE_URL/);
  });

  it('exige JWT_SECRET', () => {
    expect(() => validarEnv({ ...base, JWT_SECRET: undefined })).toThrow(/JWT_SECRET/);
  });

  it('recusa o segredo de exemplo do .env.example', () => {
    // Regressão: "seu-secret-aqui" copiado do exemplo é um segredo público.
    expect(() => validarEnv({ ...base, JWT_SECRET: 'seu-secret-aqui' })).toThrow(/exemplo/);
    expect(() => validarEnv({ ...base, JWT_SECRET: 'CHANGEME' })).toThrow(/exemplo/);
  });

  it('exige segredo longo em produção', () => {
    expect(() =>
      validarEnv({ ...base, NODE_ENV: 'production', JWT_SECRET: 'curto', CORS_ORIGINS: 'https://a.com', SMTP_HOST: 's' }),
    ).toThrow(/32 caracteres/);
  });

  it('exige CORS_ORIGINS explícita em produção', () => {
    expect(() => validarEnv({ ...base, NODE_ENV: 'production', SMTP_HOST: 's' })).toThrow(/CORS_ORIGINS/);
  });

  it('não deixa produção herdar localhost no CORS', () => {
    const env = validarEnv({
      ...base,
      NODE_ENV: 'production',
      CORS_ORIGINS: 'https://luck.com.br, https://www.luck.com.br',
      SMTP_HOST: 'smtp.luck.com.br',
    });
    expect(env.CORS_ORIGINS).toEqual(['https://luck.com.br', 'https://www.luck.com.br']);
    expect(env.CORS_ORIGINS.some((o) => o.includes('localhost'))).toBe(false);
  });

  it('em desenvolvimento o CORS cai no padrão local', () => {
    expect(validarEnv({ ...base }).CORS_ORIGINS).toContain('http://localhost:3000');
  });

  it('exige SMTP_HOST em produção', () => {
    // Sem SMTP em produção, o reset de senha e o OTP por e-mail nao saem e o
    // usuario fica sem caminho para recuperar a conta. Antes isso passava
    // despercebido porque o servico fingia que tinha enviado.
    expect(() =>
      validarEnv({ ...base, NODE_ENV: 'production', CORS_ORIGINS: 'https://a.com' }),
    ).toThrow(/SMTP_HOST/);
  });

  it('em desenvolvimento SMTP continua opcional', () => {
    expect(validarEnv({ ...base }).SMTP_HOST).toBe('');
  });

  it('recusa PORT inválida', () => {
    expect(() => validarEnv({ ...base, PORT: '0' })).toThrow(/PORT/);
    expect(() => validarEnv({ ...base, PORT: 'abc' })).toThrow(/PORT/);
    expect(() => validarEnv({ ...base, PORT: '70000' })).toThrow(/PORT/);
  });

  it('acumula todos os erros numa mensagem só', () => {
    try {
      validarEnv({ NODE_ENV: 'production' } as NodeJS.ProcessEnv);
      fail('deveria ter lançado');
    } catch (e: any) {
      expect(e.message).toMatch(/DATABASE_URL/);
      expect(e.message).toMatch(/JWT_SECRET/);
      expect(e.message).toMatch(/CORS_ORIGINS/);
      expect(e.message).toMatch(/SMTP_HOST/);
    }
  });
});
