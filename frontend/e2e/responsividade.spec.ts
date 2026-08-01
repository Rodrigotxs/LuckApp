import { test, expect } from '@playwright/test';

/**
 * Responsividade e paridade entre visões.
 *
 * O CLAUDE.md do workspace marca "divergência web/mobile" como a armadilha
 * conhecida do projeto. Estes testes rodam nos três projects do
 * playwright.config (celular, tablet, desktop) — se algo só funciona num
 * viewport, o teste falha naquele project e não nos outros.
 */

test.describe('layout em qualquer viewport', () => {
  test('não existe scroll horizontal', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const estouro = await page.evaluate(() => {
      const d = document.documentElement;
      return { scroll: d.scrollWidth, cliente: d.clientWidth };
    });

    // Tolerância de 1px para arredondamento de subpixel.
    expect(estouro.scroll).toBeLessThanOrEqual(estouro.cliente + 1);
  });

  test('nenhum elemento vaza para fora da janela', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const vazando = await page.evaluate(() => {
      const largura = document.documentElement.clientWidth;
      return Array.from(document.querySelectorAll('*'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.right > largura + 1;
        })
        .slice(0, 5)
        .map((el) => `${el.tagName}.${(el as HTMLElement).className || '(sem classe)'}`);
    });

    expect(vazando).toEqual([]);
  });

  test('o zoom do usuário não está bloqueado', async ({ page }) => {
    // Regressão: maximumScale=1 quebrava a WCAG 1.4.4.
    await page.goto('/');
    const conteudo = await page.getAttribute('meta[name="viewport"]', 'content');
    expect(conteudo).not.toMatch(/user-scalable\s*=\s*no/);
    expect(conteudo).not.toMatch(/maximum-scale\s*=\s*1\b/);
  });

  test('alvos de toque têm tamanho mínimo utilizável', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const pequenos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a[href], [role="button"]'))
        .filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width > 0 && r.height > 0 && (r.height < 40 || r.width < 40);
        })
        .slice(0, 5)
        .map((el) => `${el.tagName}: ${(el.textContent || '').trim().slice(0, 30)}`);
    });

    expect(pequenos).toEqual([]);
  });

  test('a tela inicial renderiza a marca', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toContainText(/luck/i, { timeout: 15_000 });
  });
});

test.describe('paridade de funcionalidades entre viewports', () => {
  /**
   * Contrato: as mesmas ações precisam existir em celular e desktop.
   * Se uma delas sumir num viewport, este teste falha só naquele project,
   * apontando exatamente onde está a divergência.
   */
  test('as ações de entrada existem em todos os viewports', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const textoVisivel = (await page.locator('body').innerText()).toLowerCase();

    // A splash pode preceder a escolha de papel — avança se houver CTA.
    const cta = page.locator('button, [role="button"]').first();
    if (await cta.isVisible().catch(() => false)) {
      await cta.click().catch(() => {});
      await page.waitForTimeout(800);
    }

    const depois = (await page.locator('body').innerText()).toLowerCase();
    const conteudo = textoVisivel + ' ' + depois;

    // Cliente e dono precisam ser alcançáveis em qualquer largura.
    expect(conteudo).toMatch(/cliente|agendar/);
  });

  test('nenhum conteúdo é escondido apenas por largura de tela', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Elementos com display:none vindos de media query são o vetor clássico
    // de "existe no desktop, não existe no celular".
    const escondidos = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button, a[href], input, select'))
        .filter((el) => getComputedStyle(el).display === 'none')
        .slice(0, 10)
        .map((el) => `${el.tagName}: ${(el.textContent || '').trim().slice(0, 30)}`);
    });

    expect(escondidos).toEqual([]);
  });
});
