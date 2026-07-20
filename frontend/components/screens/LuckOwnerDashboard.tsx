'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCalendar, IconPlus, IconUser } from '../icons/Icons';
import { appointmentsService, financialService } from '@/lib/services';
import type { Appointment } from '@/lib/services/appointments.service';

interface Props {
  onGoFinance: () => void;
  onNew: () => void;
  onProfile: () => void;
  onCalendar: () => void;
}

interface MiniKpiProps { label: string; value: string; navy?: boolean; }

const MiniKpi = ({ label, value, navy }: MiniKpiProps) => (
  <div style={{ background: 'var(--bg2)', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
    <div style={{ fontSize: 9, color: '#999', fontWeight: 700, letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
    <div className="lk-serif" style={{ fontSize: 20, fontWeight: 800, color: navy ? 'var(--navy)' : 'var(--ink)' }}>{value}</div>
  </div>
);

export function LuckOwnerDashboard({ onGoFinance, onNew, onProfile, onCalendar }: Props) {
  const [items, setItems] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [livres, setLivres] = useState('—');
  const [loaded, setLoaded] = useState(false);

  const carregar = async () => {
    try {
      const data = format(new Date(), 'yyyy-MM-dd');
      const [ags, sum] = await Promise.all([
        appointmentsService.listOwner({ data }),
        financialService.summary('today').catch(() => null),
      ]);
      setItems(ags);
      setTotal(sum?.total || 0);
      // "Livres" — 24 slots/dia menos os agendamentos (heurística)
      setLivres(String(Math.max(0, 24 - ags.length)));
      setLoaded(true);
    } catch {
      setLoaded(true);
    }
  };

  useEffect(() => { carregar(); }, []);

  const contarNaoCancelados = items.filter((a) => a.status !== 'CANCELLED').length;
  const agora = new Date();

  return (
    <div className="lk-screen">
      <LuckHeader
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onProfile} style={{
              width: 34, height: 34, borderRadius: 17, background: 'var(--bg2)', border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
              <IconUser size={15} color="#888" />
            </button>
            <button onClick={onCalendar} style={{
              width: 34, height: 34, borderRadius: 17, background: 'var(--bg2)', border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
              <IconCalendar size={15} color="var(--navy)" />
            </button>
            <button onClick={onNew} style={{
              width: 34, height: 34, borderRadius: 17, background: 'var(--red)', border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
              <IconPlus size={16} color="white" strokeWidth={2.5} />
            </button>
          </div>
        }
      />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 120px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>
          {format(new Date(), "EEEE · dd MMM", { locale: ptBR }).toUpperCase()}
        </div>
        <div className="lk-serif" style={{ fontSize: 24, fontWeight: 800, marginBottom: 14 }}>
          Sua <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>agenda</em>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <MiniKpi label="HOJE" value={String(contarNaoCancelados)} />
          <MiniKpi label="LIVRES" value={livres} navy />
          <MiniKpi label="R$" value={String(Math.round(total))} />
        </div>

        {!loaded ? (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#bbb', fontSize: 12 }}>Carregando…</div>
        ) : items.length === 0 ? (
          <div style={{
            background: 'var(--bg2)', borderRadius: 14, padding: '28px 18px',
            textAlign: 'center', color: '#888', fontSize: 12,
          }}>
            Nenhum agendamento para hoje. Bora aproveitar para descansar? 🧉
          </div>
        ) : (
          <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '4px 14px' }}>
            {items.map((a, i) => {
              const start = parseISO(a.startAt);
              const end = parseISO(a.endAt);
              const isDone = a.status === 'COMPLETED';
              const isCancelled = a.status === 'CANCELLED';
              const isLive = start <= agora && end > agora && !isDone && !isCancelled;
              const barColor = isLive ? 'var(--red)' : isCancelled ? 'var(--gray)' : 'var(--navy)';
              return (
                <div key={a.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                  borderTop: i === 0 ? 'none' : '1px solid var(--gray-soft)',
                }}>
                  <div className="lk-mono" style={{ width: 40, fontSize: 10.5, color: '#999' }}>{format(start, 'HH:mm')}</div>
                  <div style={{
                    flex: 1, padding: '8px 10px', borderRadius: 8,
                    background: isLive ? 'var(--red-soft)' : isDone ? 'transparent' : 'white',
                    borderLeft: `2.5px solid ${barColor}`,
                    opacity: isDone || isCancelled ? 0.5 : 1,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textDecoration: isDone || isCancelled ? 'line-through' : 'none' }}>
                      {a.client?.name || 'Cliente'} · {a.service.name}
                    </span>
                    {isLive && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)' }}>AGORA</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <LuckFooter>
        <LuckCTA variant="navy" onClick={onGoFinance} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          VER RELATÓRIO FINANCEIRO
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
