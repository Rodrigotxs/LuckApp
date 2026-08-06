'use client';

import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCheck } from '../icons/Icons';

interface Props { onNext: () => void; }

export function LuckClientDone({ onNext }: Props) {
  const nome = typeof window !== 'undefined'
    ? (JSON.parse(localStorage.getItem('user') || '{}').name || 'Cliente').split(' ')[0]
    : 'Cliente';

  return (
    <div className="lk-screen">
      <LuckHeader />
      <div style={{ flex: 1, padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 100, height: 100, borderRadius: 50, background: 'var(--red-soft)',
          display: 'grid', placeItems: 'center', marginBottom: 22,
        }}>
          <div style={{ width: 60, height: 60, borderRadius: 30, background: 'var(--red)', display: 'grid', placeItems: 'center' }}>
            <IconCheck size={30} color="white" strokeWidth={3} />
          </div>
        </div>
        <div className="lk-eyebrow" style={{ marginBottom: 10 }}>BEM-VINDO, {nome.toUpperCase()}</div>
        <div className="lk-serif" style={{ fontSize: 26, fontWeight: 800, textAlign: 'center', lineHeight: 1.1 }}>
          Pronto! Já pode<br />
          <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>agendar</em>.
        </div>
      </div>
      <LuckFooter>
        <LuckCTA onClick={onNext} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          VER SERVIÇOS
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
