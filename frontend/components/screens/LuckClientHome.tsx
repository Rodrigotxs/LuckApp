'use client';

import { useState } from 'react';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCalendar, IconPlus, IconStar, IconUser } from '../icons/Icons';

interface Props {
  onBookNew: () => void;
  onLogout: () => void;
  onProfile: () => void;
  onReschedule: () => void;
  hasAppointment: boolean;
}

export function LuckClientHome({ onBookNew, onLogout, onProfile, onReschedule, hasAppointment }: Props) {
  const [status, setStatus] = useState<'confirmed' | 'cancelled'>('confirmed');
  const [showFidelidade, setShowFidelidade] = useState(false);

  const nomeCliente = typeof window !== 'undefined'
    ? (JSON.parse(localStorage.getItem('user') || '{}').name || 'Cliente').split(' ')[0]
    : 'Cliente';

  return (
    <div className="lk-screen">
      <LuckHeader
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onReschedule} style={{
              width: 32, height: 32, borderRadius: 16, background: 'var(--bg2)', border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
              <IconCalendar size={15} color="#888" />
            </button>
            <button onClick={onProfile} style={{
              width: 32, height: 32, borderRadius: 16, background: 'var(--bg2)', border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
              <IconUser size={15} color="#888" />
            </button>
          </div>
        }
      />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 130px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 4 }}>OLÁ, {nomeCliente.toUpperCase()}</div>
        <div style={{ height: 16 }} />

        {!hasAppointment ? (
          <div style={{ background: 'var(--bg2)', borderRadius: 14, padding: '28px 20px', textAlign: 'center', marginBottom: 18 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 26, background: 'white',
              border: '1.5px solid var(--gray-soft)',
              display: 'grid', placeItems: 'center', margin: '0 auto 14px',
            }}>
              <IconCalendar size={22} color="#bbb" />
            </div>
            <div className="lk-serif" style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--ink)', marginBottom: 6 }}>
              Você ainda não tem <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>agendamentos</em>
            </div>
            <div style={{ fontSize: 11.5, color: '#888', lineHeight: 1.5, marginBottom: 16 }}>
              Marque seu primeiro horário e acompanhe tudo por aqui.
            </div>
            <button onClick={onBookNew} className="lk-press" style={{
              background: 'var(--red)', border: 'none', borderRadius: 10, padding: '11px 20px',
              fontSize: 12, fontWeight: 700, color: 'white', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + Agendar horário
            </button>
          </div>
        ) : (
          <>
            <div style={{
              background: 'white',
              border: '1.5px solid var(--gray-soft)',
              borderTop: '3px solid var(--red)',
              borderRadius: 14, padding: '16px 18px', marginBottom: 16,
            }}>
              <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 6 }}>PRÓXIMO AGENDAMENTO</div>
              {status === 'cancelled' ? (
                <div style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '10px 0' }}>
                  Agendamento cancelado.
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="lk-serif" style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>Combo Premium</div>
                    <div style={{ fontSize: 11.5, color: '#888', marginTop: 3 }}>Quarta · 29 abril · 14:30</div>
                  </div>
                  <div style={{
                    padding: '5px 10px', background: '#4caf5018', color: '#2e7d32',
                    fontSize: 9.5, fontWeight: 700, borderRadius: 6,
                  }}>
                    CONFIRMADO
                  </div>
                </div>
              )}
              {status !== 'cancelled' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={onReschedule} className="lk-press" style={{
                    flex: 1, textAlign: 'center', padding: '8px 0',
                    border: '1px solid var(--gray-soft)', borderRadius: 8,
                    fontSize: 11, fontWeight: 700, color: '#777', background: 'white',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>REMARCAR</button>
                  <button onClick={() => setStatus('cancelled')} className="lk-press" style={{
                    flex: 1, textAlign: 'center', padding: '8px 0',
                    border: '1px solid var(--red)', borderRadius: 8,
                    fontSize: 11, fontWeight: 700, color: 'var(--red)', background: 'white',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>CANCELAR</button>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: showFidelidade ? 10 : 18 }}>
              <button onClick={onBookNew} className="lk-press" style={{
                background: 'var(--red)', border: 'none', borderRadius: 12, padding: '14px',
                display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
              }}>
                <IconPlus size={18} color="white" strokeWidth={2.5} />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'white' }}>Novo agendamento</span>
              </button>
              <button onClick={() => setShowFidelidade((v) => !v)} className="lk-press" style={{
                background: 'var(--bg2)', border: 'none', borderRadius: 12, padding: '14px',
                display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer',
                fontFamily: 'inherit', textAlign: 'left',
              }}>
                <IconStar size={18} color="var(--navy)" />
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>Fidelidade · 14 pts</span>
              </button>
            </div>
            {showFidelidade && (
              <div style={{
                background: 'var(--navy-soft)', borderRadius: 10, padding: '10px 14px', marginBottom: 18,
                fontSize: 11, color: 'var(--ink)', lineHeight: 1.4,
              }}>
                Faltam <b>6 pts</b> para seu próximo corte grátis. Cada atendimento vale 1 ponto.
              </div>
            )}

            <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 10 }}>HISTÓRICO</div>
            <div style={{ background: 'var(--bg2)', borderRadius: 12 }}>
              {[
                { d: '20 abr', s: 'Combo Premium', v: 75 },
                { d: '06 abr', s: 'Corte Masculino', v: 45 },
                { d: '23 mar', s: 'Combo Premium', v: 75 },
              ].map((h, i) => (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: '11px 14px', borderTop: i === 0 ? 'none' : '1px solid white', fontSize: 12,
                }}>
                  <span style={{ color: '#777' }}>
                    <span className="lk-mono" style={{ color: '#999', marginRight: 8 }}>{h.d}</span>
                    {h.s}
                  </span>
                  <span className="lk-mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>R$ {h.v}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
      <LuckFooter>
        <LuckCTA onClick={onBookNew} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          {hasAppointment ? 'AGENDAR NOVO HORÁRIO' : 'AGENDAR MEU PRIMEIRO HORÁRIO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
