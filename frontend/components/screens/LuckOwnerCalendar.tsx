'use client';

import { useEffect, useState } from 'react';
import { LuckHeader, LuckProgress, LuckCTA, LuckFooter } from '../luck';
import { LuckLogo } from '../luck/LuckLogo';
import { IconArrow, IconCheck } from '../icons/Icons';
import { ownerService } from '@/lib/services';

interface Props {
  onBack: () => void;
  onNext: () => void;
}

export function LuckOwnerCalendar({ onBack, onNext }: Props) {
  const [conectado, setConectado] = useState<boolean | null>(null);
  const [email, setEmail] = useState<string>('');
  const [conectando, setConectando] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    ownerService.getMe()
      .then((o) => {
        setConectado(!!o.googleConnected);
        setEmail(o.email || '');
      })
      .catch(() => setConectado(false));
  }, []);

  const conectar = async () => {
    setConectando(true);
    setErro('');
    try {
      const url = await ownerService.getGoogleAuthUrl();
      window.location.href = url;
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Não foi possível iniciar o OAuth');
      setConectando(false);
    }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <LuckProgress step={2} total={4} label="CADASTRO · FUNCIONÁRIO" />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 140px' }}>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          Conecte sua <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>agenda</em>
        </div>
        <div style={{ fontSize: 12.5, color: '#888', marginBottom: 18 }}>
          Para gerenciar horários e evitar conflitos automaticamente.
        </div>

        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '22px', textAlign: 'center', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <LuckLogo size={42} />
            <div style={{ display: 'flex', gap: 3 }}>
              {[0, 1, 2].map((i) => <div key={i} style={{ width: 3, height: 3, borderRadius: 2, background: 'var(--navy)' }} />)}
            </div>
            <div style={{
              width: 42, height: 42, borderRadius: 8, background: 'white',
              border: '1px solid var(--gray-soft)',
              position: 'relative', display: 'grid', placeItems: 'center',
            }}>
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 8,
                background: 'var(--navy)', borderRadius: '8px 8px 0 0',
              }} />
              <span style={{ fontWeight: 800, fontSize: 15, color: 'var(--navy)', marginTop: 4 }}>31</span>
            </div>
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Sincronização inteligente</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
            Bloqueamos horários ocupados na sua agenda pessoal automaticamente.
          </div>
        </div>

        {conectado === null ? (
          <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#bbb' }}>Verificando…</div>
        ) : conectado ? (
          <div style={{
            background: '#4caf5012', border: '1px solid #4caf5040', borderRadius: 12,
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 17,
              background: 'linear-gradient(135deg,#4285f4,#ea4335)',
              display: 'grid', placeItems: 'center', color: 'white', fontSize: 12, fontWeight: 700,
            }}>
              {(email[0] || '?').toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10.5, color: '#2e7d32', fontWeight: 700, letterSpacing: '0.06em' }}>● CONECTADO</div>
              <div style={{ fontSize: 12, fontWeight: 500 }}>{email}</div>
            </div>
            <IconCheck size={16} color="#2e7d32" strokeWidth={2.5} />
          </div>
        ) : (
          <>
            <button
              onClick={conectar}
              disabled={conectando}
              className="lk-press"
              style={{
                width: '100%', padding: '13px', borderRadius: 12,
                border: '1.5px solid var(--navy)',
                background: 'white',
                color: 'var(--navy)',
                fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {conectando ? 'REDIRECIONANDO…' : '🔗 CONECTAR GOOGLE CALENDAR'}
            </button>
            {erro && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
                {erro}
              </div>
            )}
            <div style={{ marginTop: 10, fontSize: 10.5, color: '#999', lineHeight: 1.5 }}>
              Sem Google conectado, o app não impede conflitos de agenda automaticamente.
              Você pode conectar depois nas configurações.
            </div>
          </>
        )}
      </div>
      <LuckFooter>
        <LuckCTA variant="navy" onClick={onNext} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          {conectado ? 'CONTINUAR' : 'PULAR POR ENQUANTO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
