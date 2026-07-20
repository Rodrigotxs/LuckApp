'use client';

import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCheck } from '../icons/Icons';

interface Props { onNext: () => void; }

export function LuckOwnerDone({ onNext }: Props) {
  const nome = typeof window !== 'undefined'
    ? (JSON.parse(localStorage.getItem('user') || '{}').name || 'Diego').split(' ')[0]
    : 'Diego';

  return (
    <div className="lk-screen">
      <LuckHeader />
      <div style={{ flex: 1, padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          width: 90, height: 90, borderRadius: 45,
          background: 'var(--navy-soft)', display: 'grid', placeItems: 'center', marginBottom: 20,
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 28,
            background: 'var(--navy)', display: 'grid', placeItems: 'center',
          }}>
            <IconCheck size={28} color="white" strokeWidth={3} />
          </div>
        </div>
        <div className="lk-eyebrow" style={{ color: 'var(--navy)', marginBottom: 10 }}>TUDO PRONTO, {nome.toUpperCase()}</div>
        <div className="lk-serif" style={{ fontSize: 24, fontWeight: 800, textAlign: 'center' }}>
          Sua barbearia<br />
          está no <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>ar</em>.
        </div>
      </div>
      <LuckFooter>
        <LuckCTA variant="navy" onClick={onNext} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          IR PARA O PAINEL
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
