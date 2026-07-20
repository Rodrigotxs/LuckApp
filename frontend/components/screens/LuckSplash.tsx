'use client';

import { useEffect } from 'react';
import { LuckLogo } from '../luck/LuckLogo';

interface Props { onDone: () => void; }

export function LuckSplash({ onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 1400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="lk-screen" style={{
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, white 0%, var(--bg2) 100%)',
      minHeight: '100vh',
    }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <LuckLogo size={120} />
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginTop: 18, textAlign: 'center' }}>BARBEARIA</div>
        <div className="lk-script" style={{ fontSize: 38, color: 'var(--red)', fontWeight: 700, marginTop: -4 }}>Luck</div>
        <div style={{ fontSize: 10.5, letterSpacing: '0.3em', color: '#999', fontWeight: 700, marginTop: 8 }}>TRADIÇÃO · ESTILO · PRECISÃO</div>
        <div style={{ width: 90, height: 3, background: 'var(--gray-soft)', borderRadius: 2, marginTop: 26, overflow: 'hidden' }}>
          <div style={{ width: '55%', height: '100%', background: 'var(--red)', borderRadius: 2 }} />
        </div>
      </div>
    </div>
  );
}
