'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Papel = 'client' | 'owner';
type Provider = { id: 'google' | 'facebook'; nome: string };

interface Props {
  /** Papel que a tela está cadastrando/autenticando. */
  papel: Papel;
}

/**
 * Botões de login social.
 *
 * Só renderiza o provedor que o backend confirma estar configurado. A versão
 * anterior desenhava Google e Facebook sempre e apenas simulava — mostrava
 * "Conectando com Google..." por 1,8 s e não fazia nada. Botão que promete e
 * não entrega custa mais confiança do que a ausência dele.
 */
export function LuckSocialButtons({ papel }: Props) {
  const [providers, setProviders] = useState<Provider[] | null>(null);
  const [indo, setIndo] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    api
      .get('/auth/social/providers')
      .then((r) => { if (ativo) setProviders(r.data?.providers ?? []); })
      .catch(() => { if (ativo) setProviders([]); });
    return () => { ativo = false; };
  }, []);

  // Enquanto consulta, não ocupa espaço — evita o layout pular.
  if (providers === null || providers.length === 0) return null;

  const entrar = (id: string) => {
    setIndo(id);
    // Navegação de página inteira, não fetch: o fluxo OAuth precisa que o
    // usuário veja o domínio do provedor na barra de endereço para julgar se
    // é legítimo. Esconder isso num iframe ou popup opaco é exatamente o que
    // golpe de phishing imita.
    window.location.href = `${API_URL}/auth/social/${id}?papel=${papel}`;
  };

  const estilos: Record<string, React.CSSProperties> = {
    google: { border: '1.5px solid var(--gray-soft)', background: 'white', color: 'var(--ink)' },
    facebook: { border: 'none', background: '#1877F2', color: 'white' },
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => entrar(p.id)}
            disabled={indo !== null}
            className="lk-press"
            aria-label={`Continuar com ${p.nome}`}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px', borderRadius: 10, minHeight: 44,
              cursor: indo ? 'wait' : 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 600,
              opacity: indo && indo !== p.id ? 0.5 : 1,
              ...estilos[p.id],
            }}
          >
            {p.id === 'google' ? <IconeGoogle /> : <IconeFacebook />}
            {indo === p.id ? `Abrindo ${p.nome}...` : `Continuar com ${p.nome}`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--gray-soft)' }} />
        <span style={{ fontSize: 10.5, color: '#999', fontWeight: 700, letterSpacing: '0.06em' }}>OU</span>
        <div style={{ flex: 1, height: 1, background: 'var(--gray-soft)' }} />
      </div>
    </div>
  );
}

function IconeGoogle() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.47a5.53 5.53 0 01-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.66z"/>
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.07 7.93-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.05 1.15-3.11 0-5.75-2.1-6.69-4.92H1.3v3.09A12 12 0 0012 24z"/>
      <path fill="#FBBC05" d="M5.31 14.31A7.2 7.2 0 014.9 12c0-.8.14-1.58.38-2.31V6.6H1.3A12 12 0 000 12c0 1.94.46 3.77 1.3 5.4l4.01-3.09z"/>
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0 7.31 0 3.26 2.69 1.3 6.6l4.01 3.09C6.25 6.87 8.89 4.77 12 4.77z"/>
    </svg>
  );
}

function IconeFacebook() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34V22c4.78-.79 8.44-4.94 8.44-9.94z"/>
    </svg>
  );
}
