'use client';

import { ReactNode } from 'react';
import { LuckLogo } from '../luck/LuckLogo';
import { IconChevron, IconScissors } from '../icons/Icons';

type Role = 'client' | 'owner' | 'login';

interface Props {
  onPick: (role: Role) => void;
}

interface RoleCardProps {
  title: string;
  desc: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
}

const RoleCard = ({ title, desc, icon, color, onClick }: RoleCardProps) => (
  <button
    onClick={onClick}
    className="lk-press"
    style={{
      background: 'white', border: 'none', borderRadius: 14, padding: '16px',
      display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer', textAlign: 'left',
      fontFamily: 'inherit',
      boxShadow: 'inset 0 0 0 1px rgba(44,44,44,0.08), 0 4px 14px rgba(0,0,0,0.05)',
    }}
  >
    <div style={{
      width: 46, height: 46, borderRadius: 12, background: 'var(--bg2)',
      display: 'grid', placeItems: 'center', flexShrink: 0,
    }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{title}</div>
      <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{desc}</div>
    </div>
    <IconChevron size={18} color={color} />
  </button>
);

export function LuckRolePicker({ onPick }: Props) {
  return (
    <div className="lk-screen" style={{ background: 'linear-gradient(180deg, white 0%, var(--bg2) 100%)' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '70px 24px 40px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 30 }}>
          <LuckLogo size={100} />
          <div className="lk-brand-name">BARBEARIA <em>Luck</em></div>
        </div>
        <div style={{ fontSize: 13, color: '#777', marginBottom: 30, lineHeight: 1.5 }}>Escolha como você quer entrar.</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <RoleCard
            title="Sou cliente"
            desc="Quero agendar meu horário"
            color="var(--red)"
            onClick={() => onPick('client')}
            icon={
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="7" r="4"/>
                <path d="M5 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2"/>
              </svg>
            }
          />
          <RoleCard
            title="Sou funcionário"
            desc="Quero gerenciar a barbearia"
            color="var(--navy)"
            onClick={() => onPick('owner')}
            icon={<IconScissors size={22} color="var(--navy)" />}
          />
        </div>
        <button
          onClick={() => onPick('login')}
          className="lk-press"
          style={{
            width: '100%', marginTop: 14, padding: '16px', borderRadius: 14,
            border: 'none', background: 'var(--red)',
            cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: 'white',
            textAlign: 'center',
          }}
        >
          Já tem conta? <span style={{ color: 'white' }}>Entrar</span>
        </button>
      </div>
    </div>
  );
}
