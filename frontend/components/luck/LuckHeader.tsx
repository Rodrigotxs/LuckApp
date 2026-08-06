'use client';

import { ReactNode } from 'react';
import { LuckLogo } from './LuckLogo';
import { IconChevronLeft } from '../icons/Icons';

interface LuckHeaderProps {
  onBack?: () => void;
  right?: ReactNode;
  sub?: string;
}

export function LuckHeader({ onBack, right, sub }: LuckHeaderProps) {
  return (
    <div className="lk-header">
      {onBack && (
        <button
          onClick={onBack}
          style={{
            width: 32, height: 32, borderRadius: 16, background: 'var(--bg2)', border: 'none',
            display: 'grid', placeItems: 'center', cursor: 'pointer', marginRight: 2,
          }}
        >
          <IconChevronLeft size={16} color="var(--ink)" />
        </button>
      )}
      <LuckLogo size={50} />
      <div style={{ flex: 1 }}>
        <div className="lk-brand-name">BARBEARIA <em>Luck</em></div>
        <div className="lk-brand-sub">{sub || 'EST. 2019 · SP'}</div>
      </div>
      {right}
    </div>
  );
}
