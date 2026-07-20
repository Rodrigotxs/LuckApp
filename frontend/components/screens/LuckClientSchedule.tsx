'use client';

import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, iconByName, IconCombo } from '../icons/Icons';
import { LuckService, LuckBarber, LUCK_SLOTS_BY_BARBER } from './data';

interface Props {
  onBack: () => void;
  services: LuckService[];
  barber: LuckBarber | undefined;
  selectedSlot: string | null;
  setSelectedSlot: (slot: string) => void;
  onNext: () => void;
}

export function LuckClientSchedule({ onBack, services, barber, selectedSlot, setSelectedSlot, onNext }: Props) {
  const slots = LUCK_SLOTS_BY_BARBER[barber?.id || 'diego'] || LUCK_SLOTS_BY_BARBER.diego;

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>PASSO 2 DE 3</div>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Quando você <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>vem</em>?
        </div>

        {barber && (
          <div style={{
            background: 'var(--bg2)', borderRadius: 10, padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: 15,
              background: 'white', border: '1px solid var(--gray-soft)',
              display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700, color: 'var(--red)',
            }}>
              {barber.avatar}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>Agenda de {barber.name}</div>
              <div style={{ fontSize: 10.5, color: '#888' }}>★ {barber.rating} · {barber.free} horários livres</div>
            </div>
          </div>
        )}

        {services.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
            {services.map((service) => {
              const Icon = iconByName[service.icon] || IconCombo;
              return (
                <div key={service.id} style={{
                  background: 'var(--bg2)', borderRadius: 10, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'var(--red-soft)', display: 'grid', placeItems: 'center',
                  }}>
                    <Icon size={15} color="var(--red)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{service.name}</div>
                    <div style={{ fontSize: 10.5, color: '#888' }}>{service.duration} min · R$ {service.price}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Mini-calendar */}
        <div style={{
          background: 'white', border: '1px solid var(--gray-soft)', borderRadius: 14,
          padding: '14px 12px', marginBottom: 18,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="lk-serif" style={{ fontWeight: 700, fontSize: 15 }}>
              Abril <em style={{ color: '#999', fontStyle: 'italic' }}>2026</em>
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 9.5, color: '#999', fontWeight: 700 }}>{d}</div>
            ))}
            {[null, null, null, null, null].map((_, i) => <div key={i} />)}
            {[26, 27, 28, 29, 30].map((d) => (
              <div key={d} style={{
                aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 8,
                fontSize: 12, fontWeight: d === 29 ? 700 : 500,
                background: d === 29 ? 'var(--red)' : d === 27 ? 'var(--bg2)' : 'transparent',
                color: d === 29 ? 'white' : 'var(--ink)',
              }}>{d}</div>
            ))}
          </div>
        </div>

        <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 8 }}>QUARTA · 29 ABRIL · HORÁRIOS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
          {slots.map((raw) => {
            const busy = raw.includes('*');
            const time = raw.replace('*', '');
            const sel = selectedSlot === time;
            return (
              <button
                key={raw}
                disabled={busy}
                onClick={() => setSelectedSlot(time)}
                className="lk-mono"
                style={{
                  padding: '10px 0', borderRadius: 8,
                  fontSize: 12, fontWeight: 700,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  background: sel ? 'var(--red)' : busy ? 'transparent' : 'var(--bg2)',
                  color: sel ? 'white' : busy ? '#ccc' : 'var(--ink)',
                  border: busy ? '1px dashed var(--gray-soft)' : sel ? '1px solid var(--red)' : '1px solid transparent',
                  textDecoration: busy ? 'line-through' : 'none',
                }}
              >
                {time}
              </button>
            );
          })}
        </div>
      </div>
      <LuckFooter>
        <LuckCTA
          disabled={!selectedSlot}
          onClick={onNext}
          icon={selectedSlot ? <IconArrow size={17} color="white" strokeWidth={2} /> : null}
        >
          {selectedSlot ? `CONFIRMAR ${selectedSlot}` : 'ESCOLHA UM HORÁRIO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
