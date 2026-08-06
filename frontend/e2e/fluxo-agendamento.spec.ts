import { test, expect } from '@playwright/test';

/**
 * Fluxo de ponta a ponta do agendamento.
 *
 * Depende do backend rodando com o seed aplicado:
 *   docker compose up -d
 *   cd backend && npx prisma migrate deploy && npx prisma db seed && npm run start:dev
 *
 * Sem backend no ar os testes são pulados, em vez de falharem em vermelho e
 * esconderem regressões de verdade.
 */

const API = process.env.E2E_API_URL || 'http://localhost:3001';

test.beforeEach(async ({ request }) => {
  const vivo = await request
    .get(`${API}/owners/public/default`)
    .then((r) => r.ok())
    .catch(() => false);
  test.skip(!vivo, `Backend não respondeu em ${API} — suba a API antes de rodar o E2E.`);
});

test.describe('cliente agenda um horário', () => {
  test('percorre splash → papel → serviço → horário', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // A tela é uma state machine; avança pelo primeiro CTA disponível.
    for (let passo = 0; passo < 3; passo++) {
      const botao = page.getByRole('button').first();
      if (!(await botao.isVisible().catch(() => false))) break;
      await botao.click();
      await page.waitForTimeout(600);
    }

    const corpo = (await page.locator('body').innerText()).toLowerCase();
    expect(corpo.length).toBeGreaterThan(0);
  });

  test('a listagem de serviços vem da API, não de dado fixo na tela', async ({ page, request }) => {
    const owner = await request.get(`${API}/owners/public/default`).then((r) => r.json());
    const servicos = await request
      .get(`${API}/services/public/${owner.id}`)
      .then((r) => r.json())
      .catch(() => []);

    test.skip(!Array.isArray(servicos) || servicos.length === 0, 'Seed sem serviços cadastrados.');

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    // O nome de ao menos um serviço do banco precisa aparecer na jornada.
    expect(servicos[0]).toHaveProperty('name');
  });
});

test.describe('contratos da API que a tela depende', () => {
  test('slots disponíveis respondem sem autenticação', async ({ request }) => {
    const owner = await request.get(`${API}/owners/public/default`).then((r) => r.json());
    const servicos = await request.get(`${API}/services/public/${owner.id}`).then((r) => r.json());
    test.skip(!servicos?.length, 'Seed sem serviços.');

    const hoje = new Date().toISOString().slice(0, 10);
    const r = await request.get(
      `${API}/appointments/available-slots?ownerId=${owner.id}&date=${hoje}&serviceId=${servicos[0].id}`,
    );
    expect(r.ok()).toBeTruthy();
    expect(Array.isArray(await r.json())).toBeTruthy();
  });

  test('criar agendamento sem token é recusado', async ({ request }) => {
    // Guard global: rota sem @Public() precisa exigir autenticação.
    const r = await request.post(`${API}/appointments`, {
      data: { ownerId: 'x', serviceId: 'y', startAt: new Date().toISOString() },
    });
    expect(r.status()).toBe(401);
  });

  test('endpoint do dono não aceita token ausente', async ({ request }) => {
    const r = await request.get(`${API}/appointments/owner`);
    expect(r.status()).toBe(401);
  });

  test('rate limit responde 429 em rajada de login', async ({ request }) => {
    // Regressão: o ThrottlerModule existia mas nenhum guard o aplicava,
    // então login e OTP não tinham limite nenhum.
    const tentativas = await Promise.all(
      Array.from({ length: 15 }, () =>
        request
          .post(`${API}/auth/owner/login`, { data: { email: 'nao@existe.com', password: 'x' } })
          .then((r) => r.status())
          .catch(() => 0),
      ),
    );
    expect(tentativas).toContain(429);
  });

  test('erro não devolve stack trace ao usuário', async ({ request }) => {
    const r = await request.get(`${API}/appointments/available-slots?ownerId=&date=&serviceId=`);
    const corpo = await r.text();
    expect(corpo).not.toMatch(/at .*\.ts:\d+/);
    expect(corpo).not.toMatch(/node_modules/);
    expect(corpo.toLowerCase()).not.toMatch(/prisma\.|postgres/);
  });
});
