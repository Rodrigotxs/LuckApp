'use client';

import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCalendar, IconPlus, IconUser } from '../icons/Icons';

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
  const items = [
    { time: '08:30', name: 'Lucas P.', svc: 'Combo', status: 'done' as const },
    { time: '10:30', name: 'Marcos D.', svc: 'Barba', status: 'done' as const },
    { time: '13:30', name: 'André S.', svc: 'Combo', status: 'live' as const },
    { time: '15:30', name: 'Bruno H.', svc: 'Corte', status: 'next' as const },
    { time: '17:30', name: 'Felipe T.', svc: 'Combo', status: 'next' as const },
  ];

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
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>SEGUNDA · 27 ABR</div>
        <div className="lk-serif" style={{ fontSize: 24, fontWeight: 800, marginBottom: 14 }}>
          Sua <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>agenda</em>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
          <MiniKpi label="HOJE" value="5" />
          <MiniKpi label="LIVRES" value="9" navy />
          <MiniKpi label="R$" value="305" />
        </div>

        <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '4px 14px' }}>
          {items.map((a, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
              borderTop: i === 0 ? 'none' : '1px solid var(--gray-soft)',
            }}>
              <div className="lk-mono" style={{ width: 40, fontSize: 10.5, color: '#999' }}>{a.time}</div>
              <div style={{
                flex: 1, padding: '8px 10px', borderRadius: 8,
                background:
                  a.status === 'live' ? 'var(--red-soft)' :
                  a.status === 'done' ? 'transparent' : 'white',
                borderLeft: `2.5px solid ${
                  a.status === 'live' ? 'var(--red)' :
                  a.status === 'next' ? 'var(--navy)' : 'var(--gray)'
                }`,
                opacity: a.status === 'done' ? 0.5 : 1,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 700, textDecoration: a.status === 'done' ? 'line-through' : 'none' }}>
                  {a.name} · {a.svc}
                </span>
                {a.status === 'live' && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--red)' }}>AGORA</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <LuckFooter>
        <LuckCTA variant="navy" onClick={onGoFinance} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          VER RELATÓRIO FINANCEIRO
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
