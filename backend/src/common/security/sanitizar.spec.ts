import * as fs from 'fs';
import * as path from 'path';
import { CAMPOS_SENSIVEIS, sanitizar, sanitizarOwner, sanitizarLista } from './sanitizar';

describe('sanitizar', () => {
  const OWNER = {
    id: 'o1',
    name: 'Ana',
    email: 'ana@x.com',
    barbershopName: 'Luck',
    passwordHash: '$2a$12$abc',
    otpCode: '123456',
    otpExpiresAt: new Date(),
    otpAttempts: 2,
    passwordResetToken: 'tok-reset',
    passwordResetExpires: new Date(),
    googleAccessToken: 'ya29.xxx',
    googleRefreshToken: '1//refresh',
    googleTokenExpiresAt: new Date(),
    googleId: 'g-1',
  };

  it('remove todo campo sensível', () => {
    const limpo = sanitizar(OWNER) as Record<string, any>;
    for (const campo of CAMPOS_SENSIVEIS) {
      expect(limpo[campo]).toBeUndefined();
    }
  });

  it('preserva o que é legítimo', () => {
    const limpo = sanitizar(OWNER) as Record<string, any>;
    expect(limpo.id).toBe('o1');
    expect(limpo.name).toBe('Ana');
    expect(limpo.barbershopName).toBe('Luck');
  });

  it('nenhum valor de segredo sobrevive à serialização', () => {
    // A checagem que importa: não é o nome do campo, é o VALOR não aparecer.
    const texto = JSON.stringify(sanitizar(OWNER));
    expect(texto).not.toContain('$2a$12$abc');
    expect(texto).not.toContain('123456');
    expect(texto).not.toContain('tok-reset');
    expect(texto).not.toContain('ya29.xxx');
    expect(texto).not.toContain('1//refresh');
  });

  it('não estoura com nulo', () => {
    expect(sanitizar(null as any)).toBeNull();
    expect(sanitizarOwner(undefined as any)).toBeUndefined();
  });

  describe('sanitizarOwner', () => {
    it('expõe o sinal, não o segredo', () => {
      const r = sanitizarOwner(OWNER) as Record<string, any>;
      expect(r.googleConnected).toBe(true);
      expect(r.temSenha).toBe(true);
      expect(r.googleAccessToken).toBeUndefined();
      expect(r.passwordHash).toBeUndefined();
    });

    it('googleConnected exige os DOIS tokens', () => {
      // Só o access token não sustenta a integração: sem o refresh, ela morre
      // na primeira expiração. Dizer "conectado" ali seria mentira.
      const r = sanitizarOwner({ ...OWNER, googleRefreshToken: null }) as Record<string, any>;
      expect(r.googleConnected).toBe(false);
    });

    it('dono de login social aparece sem senha', () => {
      const r = sanitizarOwner({ ...OWNER, passwordHash: null }) as Record<string, any>;
      expect(r.temSenha).toBe(false);
    });
  });

  it('sanitizarLista limpa todos os itens', () => {
    const texto = JSON.stringify(sanitizarLista([OWNER, OWNER]));
    expect(texto).not.toContain('$2a$12$abc');
  });
});

/**
 * Trava estrutural.
 *
 * O risco real não é o sanitizador errar — é alguém acrescentar um campo
 * secreto ao schema e esquecer de listá-lo aqui. Isso já aconteceu: a migration
 * do login social criou campos novos e as três cópias da lista continuaram
 * como estavam. Nada quebra quando um segredo vaza, então ninguém percebe.
 *
 * Este teste lê o schema.prisma e falha se aparecer campo com cara de segredo
 * fora da lista. É o que transforma "lembrar" em "não dá para esquecer".
 */
describe('trava: todo campo com cara de segredo está na lista', () => {
  const PADROES_DE_SEGREDO = [
    /password/i,
    /secret/i,
    /(^|[a-z])token([A-Z]|$)/,
    /otpCode/i,
    /refreshToken/i,
    /accessToken/i,
    /apiKey/i,
  ];

  /** Campos que casam com o padrão mas são inofensivos, com o motivo. */
  const LIBERADOS: Record<string, string> = {
    googleId: 'identificador público do provedor, não é credencial',
    facebookId: 'identificador público do provedor, não é credencial',
  };

  it('nenhum campo suspeito ficou de fora', () => {
    const schema = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'prisma', 'schema.prisma'),
      'utf8',
    );

    const suspeitos = new Set<string>();
    for (const modelo of schema.matchAll(/model\s+\w+\s*\{([\s\S]*?)\n\}/g)) {
      for (const linha of modelo[1].split('\n')) {
        const t = linha.trim();
        if (!t || t.startsWith('//') || t.startsWith('@@')) continue;
        const campo = t.split(/\s+/)[0];
        if (LIBERADOS[campo]) continue;
        if (PADROES_DE_SEGREDO.some((p) => p.test(campo))) suspeitos.add(campo);
      }
    }

    const semProtecao = [...suspeitos].filter(
      (c) => !(CAMPOS_SENSIVEIS as readonly string[]).includes(c),
    );

    expect(semProtecao).toEqual([]);
  });

  it('a lista não tem campo que não existe mais no schema', () => {
    // Lista inchada com campo morto dá falsa sensação de cobertura.
    const schema = fs.readFileSync(
      path.join(__dirname, '..', '..', '..', 'prisma', 'schema.prisma'),
      'utf8',
    );
    const orfaos = (CAMPOS_SENSIVEIS as readonly string[]).filter(
      (c) => !new RegExp(`^\\s*${c}\\s`, 'm').test(schema),
    );
    expect(orfaos).toEqual([]);
  });
});
