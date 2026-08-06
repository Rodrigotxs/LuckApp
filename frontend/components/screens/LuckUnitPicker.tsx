'use client';

import { useEffect, useState } from 'react';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCheck, IconLocation } from '../icons/Icons';
import { LUCK_UNITS, LuckUnit } from './data';
import { api } from '@/lib/api';

interface Props {
  ownerId?: string;
  onBack: () => void;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string) => void;
  onNext: () => void;
}

export function LuckUnitPicker({ ownerId, onBack, selectedUnitId, setSelectedUnitId, onNext }: Props) {
  const [units, setUnits] = useState<LuckUnit[]>(LUCK_UNITS);

  useEffect(() => {
    if (ownerId) {
      api.get(`/units/public/${ownerId}`)
        .then(({ data }) => { if (data.length) setUnits(data); })
        .catch(() => {});
    }
  }, [ownerId]);

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>ONDE VOCÊ QUER IR?</div>
        <div className="lk-serif" style={{ fontSize: 26, fontWeight: 800, marginBottom: 16 }}>
          Escolha a <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>unidade</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {units.map((u) => {
            const sel = selectedUnitId === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUnitId(u.id)}
                className="lk-press"
                style={{
                  background: sel ? 'var(--red-soft)' : 'var(--bg2)',
                  border: sel ? '1.5px solid var(--red)' : '1.5px solid transparent',
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10,
                  background: sel ? 'var(--red)' : 'white',
                  border: sel ? 'none' : '1px solid var(--gray-soft)',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  <IconLocation size={20} color={sel ? 'white' : 'var(--red)'} strokeWidth={1.6} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{u.name}</div>
                  <div style={{ fontSize: 11.5, color: '#888', marginTop: 2 }}>{u.address}</div>
                  {u.neighborhood && <div style={{ fontSize: 10.5, color: '#aaa' }}>{u.neighborhood}</div>}
                </div>
                <div style={{
                  width: 20, height: 20, borderRadius: 10,
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
          disabled={!selectedUnitId}
          onClick={onNext}
          icon={selectedUnitId ? <IconArrow size={17} color="white" strokeWidth={2} /> : null}
        >
          {selectedUnitId ? 'CONTINUAR' : 'SELECIONE UMA UNIDADE'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
