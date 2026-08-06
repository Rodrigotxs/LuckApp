'use client';

import { useEffect, useState } from 'react';
import { salvarSessao } from '../../../lib/auth';

/**
 * Retorno do login social.
 *
 * O backend redireciona para cá com o resultado no FRAGMENTO da URL
 * (`#token=...`), não na query string. O fragmento nunca é enviado ao
 * servidor: não aparece em log de acesso, nem em cabeçalho Referer quando a
 * página carrega um recurso externo. Token de sessão em query string vaza
 * pelos dois caminhos, e é um vazamento silencioso — ninguém percebe até
 * alguém ler os logs.
 *
 * A primeira coisa que a página faz depois de ler o fragmento é apagá-lo do
 * histórico, para que o token não fique num "voltar" ou num favorito.
 */
export default function AuthCallbackPage() {
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const dados = new URLSearchParams(window.location.hash.replace(/^#/, ''));

    const mensagemErro = dados.get('erro');
    if (mensagemErro) {
      setErro(mensagemErro);
      history.replaceState(null, '', '/auth/callback');
      return;
    }

    const token = dados.get('token');
    if (!token) {
      setErro('Não recebemos os dados de login. Tente novamente.');
      return;
    }

    const papel = dados.get('papel') || 'client';
    const precisaCompletar = dados.get('completar') === 'true';

    salvarSessao(token, { role: papel });

    // Remove o token da URL antes de qualquer navegação.
    history.replaceState(null, '', '/auth/callback');

    // A aplicação é uma SPA controlada por estado na raiz; o destino vai por
    // sessionStorage e a raiz decide qual tela abrir.
    sessionStorage.setItem('social:papel', papel);
    sessionStorage.setItem('social:completar', String(precisaCompletar));
    window.location.replace('/');
  }, []);

  return (
    <div
      className="lk-screen"
      style={{ alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}
    >
      {erro ? (
        <>
          <h1 style={{ fontSize: 18, marginBottom: 8, color: 'var(--red)' }}>Não foi possível entrar</h1>
          <p style={{ fontSize: 14, color: '#666', maxWidth: 320, marginBottom: 20 }}>{erro}</p>
          <a
            href="/"
            className="lk-press"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minHeight: 44, padding: '12px 24px', borderRadius: 10,
              background: 'var(--red)', color: 'white', fontWeight: 600,
              fontSize: 14, textDecoration: 'none',
            }}
          >
            Voltar ao início
          </a>
        </>
      ) : (
        <p style={{ fontSize: 14, color: '#666' }}>Entrando...</p>
      )}
    </div>
  );
}
