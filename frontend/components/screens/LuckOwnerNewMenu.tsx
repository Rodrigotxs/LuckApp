'use client';

import { IconBlock, IconChevron, IconPlus } from '../icons/Icons';

interface Props {
  onClose: () => void;
  onBook: () => void;
  onBlock: () => void;
}

export function LuckOwnerNewMenu({ onClose, onBook, onBlock }: Props) {
  return (
    <div className="lk-screen" style={{ background: 'rgba(44,44,44,0.5)' }}>
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        maxWidth: 430, margin: '0 auto',
        background: 'white', borderRadius: '20px 20px 0 0',
        padding: '12px 20px 30px', zIndex: 40,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--gray-soft)', margin: '0 auto 18px' }} />
        <div className="lk-eyebrow" style={{ marginBottom: 4 }}>SEGUNDA · 27 ABR</div>
        <div className="lk-serif" style={{ fontSize: 20, fontWeight: 800, marginBottom: 18 }}>
          O que você quer fazer?
        </div>

        <button onClick={onBook} className="lk-press" style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px', borderRadius: 14,
          border: '1.5px solid var(--red)', background: 'var(--red-soft)',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 10,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'var(--red)', display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <IconPlus size={20} color="white" strokeWidth={2.5} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Agendar atendimento</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Reservar um horário para um cliente</div>
          </div>
          <IconChevron size={18} color="var(--red)" />
        </button>

        <button onClick={onBlock} className="lk-press" style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14,
          padding: '16px', borderRadius: 14,
          border: '1.5px solid var(--navy)', background: 'var(--navy-soft)',
          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', marginBottom: 12,
        }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'var(--navy)', display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <IconBlock size={20} color="white" strokeWidth={1.8} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>Bloquear horário</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Reservar um compromisso pessoal</div>
          </div>
          <IconChevron size={18} color="var(--navy)" />
        </button>

        <button
          onClick={onClose}
          style={{
            width: '100%', padding: '12px', background: 'transparent',
            border: 'none', color: '#999', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
}
