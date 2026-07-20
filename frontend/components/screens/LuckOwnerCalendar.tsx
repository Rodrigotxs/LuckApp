'use client';

import { LuckHeader, LuckProgress, LuckCTA, LuckFooter } from '../luck';
import { LuckLogo } from '../luck/LuckLogo';
import { IconArrow, IconCheck } from '../icons/Icons';

interface Props {
  onBack: () => void;
  onNext: () => void;
}

export function LuckOwnerCalendar({ onBack, onNext }: Props) {
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
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ width: 3, height: 3, borderRadius: 2, background: 'var(--navy)' }} />
              ))}
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

        <div style={{
          background: '#4caf5012', border: '1px solid #4caf5040', borderRadius: 12,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 17,
            background: 'linear-gradient(135deg,#4285f4,#ea4335)',
            display: 'grid', placeItems: 'center', color: 'white', fontSize: 12, fontWeight: 700,
          }}>DM</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10.5, color: '#2e7d32', fontWeight: 700, letterSpacing: '0.06em' }}>● CONECTADO</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>diego@gmail.com</div>
          </div>
          <IconCheck size={16} color="#2e7d32" strokeWidth={2.5} />
        </div>
      </div>
      <LuckFooter>
        <LuckCTA variant="navy" onClick={onNext} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          CONTINUAR
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
