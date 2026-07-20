'use client';

import { ReactNode } from 'react';

interface LuckCTAProps {
  children: ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'navy' | 'outline' | 'whatsapp' | 'ghost';
  onClick?: () => void;
  icon?: ReactNode;
  type?: 'button' | 'submit';
}

export function LuckCTA({ children, disabled, variant = 'primary', onClick, icon, type = 'button' }: LuckCTAProps) {
  const styles: Record<string, { bg: string; fg: string; border?: string }> = {
    primary: { bg: disabled ? 'var(--gray-soft)' : 'var(--red)', fg: disabled ? '#aaa' : 'white' },
    navy: { bg: disabled ? 'var(--gray-soft)' : 'var(--navy)', fg: disabled ? '#aaa' : 'white' },
    outline: { bg: 'transparent', fg: 'var(--red)', border: '1.5px solid var(--red)' },
    whatsapp: { bg: 'var(--whatsapp)', fg: 'white' },
    ghost: { bg: 'transparent', fg: '#888' },
  };
  const s = styles[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="lk-press"
      style={{
        width: '100%', padding: '15px', borderRadius: 12,
        border: s.border || 'none',
        background: s.bg, color: s.fg,
        fontSize: 13.5, fontWeight: 700, letterSpacing: '0.05em',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}{icon}
    </button>
  );
}
