'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

type Papel = 'client' | 'owner';
type Provider = { id: 'google' | 'facebook'; nome: string };
type Pendente = { id: string; nome: string; faltando: string[] };

/** Por que os botões não estão na tela. */
type Diagnostico =
  | { tipo: 'carregando' }
  | { tipo: 'ok'; providers: Provider[] }
  | { tipo: 'sem-credencial'; pendentes: Pendente[] }
  | { tipo: 'falha-rede'; causa: string; comoResolver: string };

interface Props {
  /** Papel que a tela está cadastrando/autenticando. */
  papel: Papel;
}

/**
 * Botões de login social.
 *
 * Só renderiza o provedor que o backend confirma estar configurado. A versão
 * original desenhava Google e Facebook sempre e apenas simulava — mostrava
 * "Conectando com Google..." por 1,8 s e não fazia nada. Botão que promete e
 * não entrega custa mais confiança do que a ausência dele.
 *
 * Fora de produção, quando não há botão, a tela diz por quê. Duas causas são
 * distinguidas de propósito: credencial ausente e falha de rede. Antes as
 * duas caíam no mesmo `catch` e viravam silêncio idêntico — o que fazia
 * "API fora do ar" parecer "não configurado", e mandava quem estava
 * depurando procurar no lugar errado.
 */
export function LuckSocialButtons({ papel }: Props) {
  const [estado, setEstado] = useState<Diagnostico>({ tipo: 'carregando' });
  const [indo, setIndo] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;

    api
      .get('/auth/social/providers', { timeout: 8000 })
      .then((r) => {
        if (!ativo) return;
        const providers: Provider[] = r.data?.providers ?? [];
        setEstado(
          providers.length > 0
            ? { tipo: 'ok', providers }
            : { tipo: 'sem-credencial', pendentes: r.data?.pendentes ?? [] },
        );
      })
      .catch((e) => {
        if (!ativo) return;
        setEstado({ tipo: 'falha-rede', ...diagnosticarRede(e) });
      });

    return () => { ativo = false; };
  }, []);

  if (estado.tipo === 'carregando') return null;

  if (estado.tipo === 'sem-credencial') {
    if (estado.pendentes.length === 0) return null; // produção: some por inteiro
    return (
      <NotaDev titulo="Login social desligado">
        Defina em <Mono>backend/.env</Mono> e reinicie a API:
        <ul style={estilos.lista}>
          {estado.pendentes.map((p) => (
            <li key={p.id} style={estilos.itemLista}>
              <span style={estilos.rotuloProvedor}>{p.nome}</span>
              {/*
                Cada variável é um elemento próprio.
                Já esteve como `faltando.join('</code>, <code>')`, que monta uma
                string com HTML dentro — e o React escapa isso por segurança,
                então as tags apareciam literais na tela.
              */}
              {p.faltando.map((v, i) => (
                <span key={v}>
                  {i > 0 && <span style={{ color: 'var(--gray)' }}>, </span>}
                  <Mono>{v}</Mono>
                </span>
              ))}
            </li>
          ))}
        </ul>
        <span style={estilos.rodape}>Passo a passo em LOGIN-SOCIAL.md</span>
      </NotaDev>
    );
  }

  if (estado.tipo === 'falha-rede') {
    // Em produção o usuário não tem o que fazer com isso — some, e o detalhe
    // fica só no console para quem estiver investigando.
    if (process.env.NODE_ENV === 'production') return null;
    return (
      <NotaDev titulo="Não consegui falar com a API" tom="alerta">
        {estado.causa}
        <span style={estilos.rodape}>{estado.comoResolver}</span>
      </NotaDev>
    );
  }

  const entrar = (id: string) => {
    setIndo(id);
    // Navegação de página inteira, não fetch: o fluxo OAuth precisa que o
    // usuário veja o domínio do provedor na barra de endereço para julgar se
    // é legítimo. Esconder isso num iframe ou popup opaco é exatamente o que
    // golpe de phishing imita.
    window.location.href = `${API_URL}/auth/social/${id}?papel=${papel}`;
  };

  const cores: Record<string, React.CSSProperties> = {
    google: { border: '1.5px solid var(--gray-soft)', background: 'white', color: 'var(--ink)' },
    facebook: { border: 'none', background: '#1877F2', color: 'white' },
  };

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {estado.providers.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => entrar(p.id)}
            disabled={indo !== null}
            className="lk-press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              padding: '12px', borderRadius: 10, minHeight: 44,
              cursor: indo ? 'wait' : 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 600,
              opacity: indo && indo !== p.id ? 0.5 : 1,
              ...cores[p.id],
            }}
          >
            {p.id === 'google' ? <IconeGoogle /> : <IconeFacebook />}
            {indo === p.id ? `Abrindo ${p.nome}...` : `Continuar com ${p.nome}`}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--gray-soft)' }} />
        <span style={{ fontSize: 10.5, color: '#6A6A6A', fontWeight: 700, letterSpacing: '0.06em' }}>OU</span>
        <div style={{ flex: 1, height: 1, background: 'var(--gray-soft)' }} />
      </div>
    </div>
  );
}

/**
 * Traduz a falha do axios em causa e conserto.
 *
 * "Erro ao carregar" não ajuda ninguém. Um erro útil diz o que aconteceu, por
 * que, e o que fazer agora.
 */
function diagnosticarRede(e: any): { causa: string; comoResolver: string } {
  const paginaSegura = typeof window !== 'undefined' && window.location.protocol === 'https:';

  // Conteúdo misto: página em HTTPS chamando API em HTTP. O navegador bloqueia
  // antes de sair da máquina, e a falha não aparece na aba de rede como erro
  // de servidor — some sem explicação.
  if (paginaSegura && API_URL.startsWith('http://')) {
    return {
      causa: `A página está em HTTPS e a API em HTTP (${API_URL}).`,
      comoResolver: 'O navegador bloqueia conteúdo misto. Aponte NEXT_PUBLIC_API_URL para uma URL https.',
    };
  }

  if (e?.code === 'ECONNABORTED') {
    return {
      causa: `A API em ${API_URL} não respondeu em 8 s.`,
      comoResolver: 'Veja a janela "Luck API". Se estiver subindo ainda, recarregue em instantes.',
    };
  }

  // Houve resposta HTTP: a rede está boa, o problema é a rota.
  if (e?.response) {
    const s = e.response.status;
    if (s === 404) {
      return {
        causa: 'A API respondeu 404 em /auth/social/providers.',
        comoResolver: 'A rota é nova — reinicie a API para carregá-la.',
      };
    }
    return {
      causa: `A API respondeu ${s} em /auth/social/providers.`,
      comoResolver: 'Veja o log do backend para o erro completo.',
    };
  }

  // Sem resposta nenhuma: ou não há ninguém escutando, ou o CORS barrou a
  // resposta antes de o JavaScript conseguir lê-la. Do lado do navegador as
  // duas são indistinguíveis — por isso a mensagem cobre as duas.
  return {
    causa: `Nenhuma resposta de ${API_URL}.`,
    comoResolver: 'A API está no ar? Se estiver, confira CORS_ORIGINS no backend/.env — precisa incluir a origem desta página.',
  };
}

const estilos: Record<string, React.CSSProperties> = {
  lista: { listStyle: 'none', margin: '6px 0 0', padding: 0 },
  itemLista: { marginTop: 3, wordBreak: 'break-word' },
  rotuloProvedor: { fontWeight: 600, color: 'var(--ink)', marginRight: 6 },
  rodape: { display: 'block', marginTop: 8, color: '#6A6A6A' },
};

/**
 * Aviso destinado a quem desenvolve, não a quem usa.
 *
 * Fica visualmente rebaixado de propósito: sem preenchimento de cor forte e
 * com uma faixa lateral discreta, para não competir com o formulário de login,
 * que é a tarefa principal da tela. Contraste do texto mantido acima de 4.5:1
 * mesmo sendo secundário — nota ilegível não é discreta, é inútil.
 */
function NotaDev({
  titulo,
  tom = 'neutro',
  children,
}: {
  titulo: string;
  tom?: 'neutro' | 'alerta';
  children: React.ReactNode;
}) {
  const cor = tom === 'alerta' ? 'var(--red)' : 'var(--navy)';
  return (
    <div
      role="note"
      style={{
        marginBottom: 16,
        padding: '10px 12px',
        borderLeft: `3px solid ${cor}`,
        background: 'var(--bg2)',
        borderRadius: '0 6px 6px 0',
        fontSize: 12.5,
        lineHeight: 1.55,
        color: '#5A5A5A',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 2 }}>
        <strong style={{ color: cor, fontSize: 12.5 }}>{titulo}</strong>
        <span style={{ fontSize: 10, color: '#6A6A6A', letterSpacing: '0.04em' }}>
          SÓ EM DESENVOLVIMENTO
        </span>
      </div>
      {children}
    </div>
  );
}

function Mono({ children }: { children: React.ReactNode }) {
  return (
    <code
      style={{
        fontFamily: 'var(--font-mono, ui-monospace, Menlo, monospace)',
        fontSize: 11.5,
        background: 'rgba(0,0,0,0.05)',
        padding: '1px 5px',
        borderRadius: 4,
        color: 'var(--ink)',
      }}
    >
      {children}
    </code>
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
