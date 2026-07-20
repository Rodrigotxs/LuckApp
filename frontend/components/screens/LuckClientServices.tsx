'use client';

import { useEffect, useState } from 'react';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCheck, iconByName, IconCombo } from '../icons/Icons';
import { LUCK_SERVICES } from './data';
import { api } from '@/lib/api';

interface Servico {
  id: string;
  name: string;
  desc?: string;
  duration: number;
  price: number;
  icon?: string;
  top?: boolean;
}

interface Props {
  ownerId?: string;
  onBack: () => void;
  selectedIds: string[];
  toggleSelected: (id: string) => void;
  onNext: () => void;
}

export function LuckClientServices({ ownerId, onBack, selectedIds, toggleSelected, onNext }: Props) {
  const [servicos, setServicos] = useState<Servico[]>(LUCK_SERVICES);

  useEffect(() => {
    if (ownerId) {
      api.get(`/services/public/${ownerId}`)
        .then(({ data }) => {
          if (data.length) {
            setServicos(
              data.map((s: any) => ({
                id: s.id,
                name: s.name,
                desc: s.description || '',
                duration: s.durationMin,
                price: s.price,
                icon: 'IconScissors',
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [ownerId]);

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>ESCOLHA SEUS SERVIÇOS</div>
        <div className="lk-serif" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Nossos <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>serviços</em>
        </div>
        <div style={{ fontSize: 11.5, color: '#888', marginBottom: 16 }}>Você pode escolher mais de um.</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {servicos.map((svc) => {
            const Icon = svc.icon ? iconByName[svc.icon] : IconCombo;
            const sel = selectedIds.includes(svc.id);
            return (
              <button
                key={svc.id}
                onClick={() => toggleSelected(svc.id)}
                className="lk-press"
                style={{
                  background: sel ? 'var(--red-soft)' : 'var(--bg2)',
                  border: sel ? '1.5px solid var(--red)' : '1.5px solid transparent',
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit', position: 'relative',
                }}
              >
                {svc.top && (
                  <div style={{
                    position: 'absolute', top: -1, right: 12,
                    background: 'var(--red)', color: 'white',
                    fontSize: 8.5, fontWeight: 700, padding: '3px 8px',
                    borderRadius: '0 0 6px 6px', letterSpacing: '0.08em',
                  }}>TOP</div>
                )}
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: sel ? 'var(--red)' : 'white',
                  border: sel ? 'none' : '1px solid var(--gray-soft)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <Icon size={20} color={sel ? 'white' : 'var(--red)'} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{svc.name}</div>
                  {svc.desc && <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>{svc.desc}</div>}
                  <div style={{ display: 'flex', gap: 10, fontSize: 11, color: '#777' }}>
                    <span>{svc.duration} min</span>
                    <span>·</span>
                    <span className="lk-mono" style={{ color: sel ? 'var(--red)' : 'var(--ink)', fontWeight: 700 }}>R$ {svc.price}</span>
                  </div>
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 6,
                  border: sel ? 'none' : '1.5px solid var(--gray)',
                  background: sel ? 'var(--red)' : 'transparent',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  {sel && <IconCheck size={11} color="white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      <LuckFooter>
        <LuckCTA
          disabled={selectedIds.length === 0}
          onClick={onNext}
          icon={selectedIds.length > 0 ? <IconArrow size={17} color="white" strokeWidth={2} /> : null}
        >
          {selectedIds.length > 0
            ? `ESCOLHER HORÁRIO · ${selectedIds.length} SERVIÇO${selectedIds.length > 1 ? 'S' : ''}`
            : 'SELECIONE UM SERVIÇO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
