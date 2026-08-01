import * as fs from 'fs';
import * as path from 'path';

/**
 * Guarda estrutural.
 *
 * Os guards de autenticação e papel são globais (APP_GUARD no AppModule),
 * então o padrão é "fechado". Este teste garante que ninguém volte ao modelo
 * antigo — em que a proteção dependia de lembrar do @UseGuards em cada rota
 * e uma rota nova nascia pública em silêncio.
 */

const SRC = path.join(__dirname, '..', 'src');

function arquivos(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? arquivos(p) : [p];
  });
}

const controllers = arquivos(SRC).filter((f) => f.endsWith('.controller.ts'));

describe('cobertura de proteção das rotas', () => {
  it('encontra os controllers do projeto', () => {
    expect(controllers.length).toBeGreaterThan(5);
  });

  it('os guards globais estão registrados no AppModule', () => {
    const appModule = fs.readFileSync(path.join(SRC, 'app.module.ts'), 'utf8');
    expect(appModule).toMatch(/APP_GUARD/);
    expect(appModule).toMatch(/ThrottlerGuard/);
    expect(appModule).toMatch(/JwtAuthGuard/);
    expect(appModule).toMatch(/RolesGuard/);
  });

  it.each(controllers.map((f) => [path.relative(SRC, f), f]))(
    '%s — toda rota pública é explícita com @Public()',
    (_nome, arquivo) => {
      const linhas = fs.readFileSync(arquivo as string, 'utf8').split('\n');
      const publicasSemDecorator: string[] = [];

      linhas.forEach((linha, i) => {
        const m = linha.match(/^\s*@(Get|Post|Patch|Put|Delete)\(/);
        if (!m) return;
        const contexto = linhas.slice(Math.max(0, i - 5), i).join('\n');
        // Com guards globais, ausência de @Public() significa protegido.
        // O que não pode existir é rota pública sem declarar isso.
        const declaraPublica = /@Public\(\)/.test(contexto);
        const declaraGuard = /@UseGuards\(/.test(contexto);
        if (declaraPublica && declaraGuard) {
          publicasSemDecorator.push(`L${i + 1}: @Public() e @UseGuards() juntos — contraditório`);
        }
      });

      expect(publicasSemDecorator).toEqual([]);
    },
  );

  it('as rotas públicas conhecidas continuam sendo só as esperadas', () => {
    // Se esta lista crescer sem revisão, algo foi exposto sem querer.
    const publicas: string[] = [];
    for (const arquivo of controllers) {
      const src = fs.readFileSync(arquivo, 'utf8');
      const linhas = src.split('\n');
      const prefixo = (src.match(/@Controller\('([^']*)'\)/) || [, ''])[1];
      linhas.forEach((linha, i) => {
        const m = linha.match(/^\s*@(Get|Post|Patch|Put|Delete)\('?([^')]*)'?\)/);
        if (!m) return;
        const contexto = linhas.slice(Math.max(0, i - 5), i).join('\n');
        if (/@Public\(\)/.test(contexto)) {
          publicas.push(`${m[1].toUpperCase()} /${prefixo}/${m[2] || ''}`.replace(/\/+$/, ''));
        }
      });
    }

    expect(publicas.sort()).toEqual(
      [
        'GET /appointments/available-slots',
        'GET /auth/google/callback',
        'GET /barbers/public/:ownerId',
        'GET /owners/public/default',
        'GET /services/public/:ownerId',
        'GET /units/public/:ownerId',
        'POST /auth/client/login',
        'POST /auth/client/password-reset/confirm',
        'POST /auth/client/password-reset/request',
        'POST /auth/client/send-email-otp',
        'POST /auth/client/send-otp',
        'POST /auth/client/verify-email-otp',
        'POST /auth/client/verify-otp',
        'POST /auth/owner/login',
        'POST /auth/owner/password-reset/confirm',
        'POST /auth/owner/password-reset/request',
        'POST /auth/owner/register',
        'POST /auth/owner/send-otp',
        'POST /auth/owner/verify-otp',
      ].sort(),
    );
  });

  it('toda rota pública de autenticação tem rate limit declarado', () => {
    // Login, OTP e reset sem limite são convite a força bruta.
    const src = fs.readFileSync(path.join(SRC, 'modules/auth/auth.controller.ts'), 'utf8');
    const linhas = src.split('\n');
    const semLimite: string[] = [];

    linhas.forEach((linha, i) => {
      const m = linha.match(/^\s*@Post\('([^']+)'\)/);
      if (!m) return;
      const contexto = linhas.slice(Math.max(0, i - 5), i).join('\n');
      if (/@Public\(\)/.test(contexto) && !/@Throttle\(/.test(contexto)) {
        semLimite.push(m[1]);
      }
    });

    expect(semLimite).toEqual([]);
  });
});
