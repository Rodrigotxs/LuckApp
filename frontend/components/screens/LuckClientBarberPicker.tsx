'use client';

import { useEffect, useState } from 'react';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCheck } from '../icons/Icons';
import { LUCK_BARBERS, LUCK_UNITS, LuckBarber } from './data';
import { api } from '@/lib/api';

interface Props {
  ownerId?: string;
  onBack: () => void;
  selectedUnitId: string | null;
  selectedBarberId: string | null;
  setSelectedBarberId: (id: string) => void;
  onNext: () => void;
}

export function LuckClientBarberPicker({ ownerId, onBack, selectedUnitId, selectedBarberId, setSelectedBarberId, onNext }: Props) {
  const [barbers, setBarbers] = useState<LuckBarber[]>(LUCK_BARBERS);

  useEffect(() => {
    if (ownerId) {
      const qs = selectedUnitId ? `?unitId=${selectedUnitId}` : '';
      api.get(`/barbers/public/${ownerId}${qs}`)
        .then(({ data }) => {
          if (data.length) {
            setBarbers(
              data.map((b: any) => ({
                id: b.id,
                name: b.name,
                role: b.role,
                rating: b.rating,
                free: 8,
                avatar: b.avatarLabel || b.name.slice(0, 2).toUpperCase(),
                unitId: b.unitId,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [ownerId, selectedUnitId]);

  const unit = LUCK_UNITS.find((u) => u.id === selectedUnitId);
  const filtered = selectedUnitId ? barbers.filter((b) => b.unitId === selectedUnitId) : barbers;

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>QUEM VAI TE ATENDER?</div>
        <div className="lk-serif" style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>
          Escolha o <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>profissional</em>
        </div>
        <div style={{ fontSize: 11.5, color: '#888', marginBottom: 16 }}>
          {unit ? (
            <>Mostrando profissionais da <b style={{ color: 'var(--ink)' }}>{unit.name}</b>.</>
          ) : (
            'Mostramos a agenda de cada um antes de você escolher o horário.'
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filtered.map((b) => {
            const sel = selectedBarberId === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setSelectedBarberId(b.id)}
                className="lk-press"
                style={{
                  background: sel ? 'var(--red-soft)' : 'var(--bg2)',
                  border: sel ? '1.5px solid var(--red)' : 'none',
                  borderRadius: 14, padding: '14px 16px',
                  display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: 23,
                  background: sel ? 'var(--red)' : 'white',
                  border: sel ? 'none' : '1px solid var(--gray-soft)',
                  display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700,
                  color: sel ? 'white' : 'var(--red)', flexShrink: 0,
                }}>
                  {b.avatar}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{b.name}</div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{b.role}</div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 6, fontSize: 10.5 }}>
                    <span style={{ color: 'var(--ink)', fontWeight: 600 }}>★ {b.rating}</span>
                    <span style={{ color: '#2e7d32', fontWeight: 600 }}>{b.free} horários livres hoje</span>
                  </div>
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
          disabled={!selectedBarberId}
          onClick={onNext}
          icon={selectedBarberId ? <IconArrow size={17} color="white" strokeWidth={2} /> : null}
        >
          {selectedBarberId ? 'VER AGENDA' : 'SELECIONE UM PROFISSIONAL'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
