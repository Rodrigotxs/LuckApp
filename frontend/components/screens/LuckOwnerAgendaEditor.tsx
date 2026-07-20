'use client';

import { useState } from 'react';
import { LuckHeader } from '../luck';
import { LUCK_AGENDA_HOURS } from './data';

interface Props { onBack: () => void; }

export function LuckOwnerAgendaEditor({ onBack }: Props) {
  const [selectedDay, setSelectedDay] = useState(29);
  const [blockedDays, setBlockedDays] = useState<number[]>([1, 12]);
  const [blockedSlots, setBlockedSlots] = useState<string[]>(['08:30', '09:00', '13:30', '14:00']);

  const today = 27;
  const days: (number | null)[] = [];
  for (let i = 0; i < 3; i++) days.push(null);
  for (let d = 1; d <= 30; d++) days.push(d);

  const toggleDay = (d: number) =>
    setBlockedDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  const toggleSlot = (t: string) =>
    setBlockedSlots((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const dayIsBlocked = blockedDays.includes(selectedDay);

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 40px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8, color: 'var(--navy)' }}>EDITAR AGENDA</div>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Gerencie sua <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>disponibilidade</em>
        </div>

        <div style={{
          background: 'white', border: '1px solid var(--gray-soft)', borderRadius: 14,
          padding: '14px 12px', marginBottom: 16,
        }}>
          <div className="lk-serif" style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
            Abril <em style={{ color: '#999', fontStyle: 'italic' }}>2026</em>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={`h${i}`} style={{ textAlign: 'center', fontSize: 9.5, color: '#999', fontWeight: 700 }}>{d}</div>
            ))}
            {days.map((d, i) => {
              if (!d) return <div key={`e${i}`} />;
              const isPast = d < today;
              const isBlocked = blockedDays.includes(d);
              const isSel = d === selectedDay;
              return (
                <button
                  key={d}
                  disabled={isPast}
                  onClick={() => setSelectedDay(d)}
                  style={{
                    aspectRatio: '1', border: 'none', borderRadius: 8,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    fontSize: 12, fontWeight: isSel ? 700 : 500, fontFamily: 'inherit',
                    background:
                      isSel ? 'var(--navy)' :
                      isBlocked ? 'var(--red-soft)' :
                      d === today ? 'var(--bg2)' : 'transparent',
                    color:
                      isSel ? 'white' :
                      isBlocked ? 'var(--red)' :
                      isPast ? '#ccc' : 'var(--ink)',
                    opacity: isPast ? 0.4 : 1,
                  }}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div style={{
            display: 'flex', gap: 14, marginTop: 12, paddingTop: 10,
            borderTop: '1px solid var(--gray-soft)', fontSize: 9.5, color: '#999',
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--navy)' }} />
              Selecionado
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--red-soft)' }} />
              Dia bloqueado
            </span>
          </div>
        </div>

        <button
          onClick={() => toggleDay(selectedDay)}
          className="lk-press"
          style={{
            width: '100%', padding: '13px', borderRadius: 12, marginBottom: 16,
            border: dayIsBlocked ? '1.5px solid #2e7d32' : '1.5px solid var(--red)',
            background: dayIsBlocked ? '#2e7d3210' : 'var(--red-soft)',
            color: dayIsBlocked ? '#2e7d32' : 'var(--red)',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          {dayIsBlocked ? 'REABRIR ESTE DIA' : 'BLOQUEAR DIA INTEIRO'}
        </button>

        <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 8, color: '#999' }}>
          HORÁRIOS DO DIA {String(selectedDay).padStart(2, '0')}/04
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7,
          opacity: dayIsBlocked ? 0.4 : 1,
          pointerEvents: dayIsBlocked ? 'none' : 'auto',
        }}>
          {LUCK_AGENDA_HOURS.map((t) => {
            const blocked = blockedSlots.includes(t);
            return (
              <button
                key={t}
                onClick={() => toggleSlot(t)}
                className="lk-mono"
                style={{
                  padding: '10px 0', borderRadius: 8,
                  fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                  border: blocked ? '1px dashed var(--gray)' : '1px solid transparent',
                  background: blocked ? 'transparent' : 'var(--bg2)',
                  color: blocked ? '#ccc' : 'var(--ink)',
                  textDecoration: blocked ? 'line-through' : 'none',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div style={{ marginTop: 14, fontSize: 10.5, color: '#999', lineHeight: 1.4 }}>
          Toque em um horário para bloquear ou liberar. Alterações sincronizam com o Google Calendar.
        </div>
      </div>
    </div>
  );
}
