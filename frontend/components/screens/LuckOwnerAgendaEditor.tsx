'use client';

import { useEffect, useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LuckHeader } from '../luck';
import { LUCK_AGENDA_HOURS } from './data';
import { availabilityService } from '@/lib/services';
import type { AvailabilityBlock } from '@/lib/services/availability.service';

interface Props { onBack: () => void; }

export function LuckOwnerAgendaEditor({ onBack }: Props) {
  const now = useMemo(() => new Date(), []);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const [selectedDay, setSelectedDay] = useState<Date>(now);
  const [blocks, setBlocks] = useState<AvailabilityBlock[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const carregar = async () => {
    try {
      const data = await availabilityService.list({
        from: monthStart.toISOString(),
        to: monthEnd.toISOString(),
      });
      setBlocks(data);
    } catch { /* backend offline: usa vazio */ }
  };

  useEffect(() => { carregar(); }, []);

  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const firstDow = monthStart.getDay();

  const isDayBlocked = (day: Date) =>
    blocks.some((b) => b.fullDay && isSameDay(parseISO(b.startAt), day));

  const isSlotBlocked = (day: Date, time: string) =>
    blocks.some((b) => {
      if (b.fullDay) return isSameDay(parseISO(b.startAt), day);
      const start = parseISO(b.startAt);
      return isSameDay(start, day) && format(start, 'HH:mm') === time;
    });

  const feedback = (msg: string) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(''), 2500);
  };

  const toggleDay = async () => {
    setSalvando(true);
    try {
      const existente = blocks.find((b) => b.fullDay && isSameDay(parseISO(b.startAt), selectedDay));
      if (existente) {
        await availabilityService.removeBlock(existente.id);
        feedback('Dia reaberto');
      } else {
        await availabilityService.blockDay(format(selectedDay, 'yyyy-MM-dd'));
        feedback('Dia bloqueado');
      }
      await carregar();
    } catch { feedback('Erro ao atualizar'); }
    finally { setSalvando(false); }
  };

  const toggleSlot = async (time: string) => {
    setSalvando(true);
    try {
      const [h, m] = time.split(':').map(Number);
      const start = new Date(selectedDay);
      start.setHours(h, m, 0, 0);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const existente = blocks.find((b) => !b.fullDay && parseISO(b.startAt).getTime() === start.getTime());
      if (existente) {
        await availabilityService.removeBlock(existente.id);
      } else {
        await availabilityService.blockSlot(start.toISOString(), end.toISOString());
      }
      await carregar();
    } catch { feedback('Erro ao atualizar'); }
    finally { setSalvando(false); }
  };

  const dayIsBlocked = isDayBlocked(selectedDay);

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 40px' }}>
        {mensagem && (
          <div style={{
            position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--navy)', color: 'white', padding: '6px 14px',
            borderRadius: 20, fontSize: 11, fontWeight: 700, zIndex: 60,
          }}>{mensagem}</div>
        )}

        <div className="lk-eyebrow" style={{ marginTop: 8, color: 'var(--navy)' }}>EDITAR AGENDA</div>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Gerencie sua <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>disponibilidade</em>
        </div>

        <div style={{
          background: 'white', border: '1px solid var(--gray-soft)', borderRadius: 14,
          padding: '14px 12px', marginBottom: 16,
        }}>
          <div className="lk-serif" style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, textTransform: 'capitalize' }}>
            {format(now, "MMMM 'de' yyyy", { locale: ptBR })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={`h${i}`} style={{ textAlign: 'center', fontSize: 9.5, color: '#999', fontWeight: 700 }}>{d}</div>
            ))}
            {Array(firstDow).fill(null).map((_, i) => <div key={`e${i}`} />)}
            {days.map((day) => {
              const d = day.getDate();
              const isPast = day < now && !isSameDay(day, now);
              const blocked = isDayBlocked(day);
              const isSel = isSameDay(day, selectedDay);
              const isToday = isSameDay(day, now);
              return (
                <button
                  key={day.toISOString()}
                  disabled={isPast}
                  onClick={() => setSelectedDay(day)}
                  style={{
                    aspectRatio: '1', border: 'none', borderRadius: 8,
                    cursor: isPast ? 'not-allowed' : 'pointer',
                    fontSize: 12, fontWeight: isSel ? 700 : 500, fontFamily: 'inherit',
                    background:
                      isSel ? 'var(--navy)' :
                      blocked ? 'var(--red-soft)' :
                      isToday ? 'var(--bg2)' : 'transparent',
                    color: isSel ? 'white' : blocked ? 'var(--red)' : isPast ? '#ccc' : 'var(--ink)',
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
          disabled={salvando}
          onClick={toggleDay}
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
          HORÁRIOS DO DIA {format(selectedDay, 'dd/MM')}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7,
          opacity: dayIsBlocked ? 0.4 : 1,
          pointerEvents: dayIsBlocked ? 'none' : 'auto',
        }}>
          {LUCK_AGENDA_HOURS.map((t) => {
            const blocked = isSlotBlocked(selectedDay, t);
            return (
              <button
                key={t}
                disabled={salvando}
                onClick={() => toggleSlot(t)}
                className="lk-mono"
                style={{
                  padding: '10px 0', borderRadius: 8, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
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
