'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCalendar, IconPlus, IconStar, IconUser } from '../icons/Icons';
import { appointmentsService, loyaltyService } from '@/lib/services';
import type { Appointment } from '@/lib/services/appointments.service';
import type { LoyaltyStatus } from '@/lib/services/loyalty.service';

interface Props {
  onBookNew: () => void;
  onLogout: () => void;
  onProfile: () => void;
  onReschedule: () => void;
  hasAppointment: boolean;
}

export function LuckClientHome({ onBookNew, onLogout, onProfile, onReschedule, hasAppointment: hasAppointmentFallback }: Props) {
  const [showFidelidade, setShowFidelidade] = useState(false);
  const [proximo, setProximo] = useState<Appointment | null>(null);
  const [historico, setHistorico] = useState<Appointment[]>([]);
  const [loyalty, setLoyalty] = useState<LoyaltyStatus | null>(null);
  const [status, setStatus] = useState<Appointment['status'] | null>(null);
  const [nomeCliente, setNomeCliente] = useState('Cliente');

  const carregar = async () => {
    try {
      const [ags, ly] = await Promise.all([
        appointmentsService.listClient().catch(() => [] as Appointment[]),
        loyaltyService.status().catch(() => null),
      ]);
      const agora = new Date();
      const futuros = ags
        .filter((a) => a.status !== 'CANCELLED' && parseISO(a.startAt) >= agora)
        .sort((a, b) => a.startAt.localeCompare(b.startAt));
      const passados = ags
        .filter((a) => a.status === 'COMPLETED' || parseISO(a.startAt) < agora)
        .sort((a, b) => b.startAt.localeCompare(a.startAt))
        .slice(0, 5);
      setProximo(futuros[0] || null);
      setStatus(futuros[0]?.status || null);
      setHistorico(passados);
      setLoyalty(ly);
    } catch {}
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.name) setNomeCliente(u.name.split(' ')[0]);
    }
    carregar();
  }, []);

  const cancelar = async () => {
    if (!proximo) return;
    const ok = typeof window !== 'undefined'
      ? window.confirm('Tem certeza que deseja cancelar este agendamento?')
      : true;
    if (!ok) return;
    try {
      await appointmentsService.cancel(proximo.id);
      setStatus('CANCELLED');
    } catch {}
  };

  // Se backend disponível, hasAppointment vem do carregar; senão fallback do prop
  const hasAppointment = proximo ? true : hasAppointmentFallback;

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
              {status === 'CANCELLED' ? (
                <div style={{ fontSize: 13, color: '#999', textAlign: 'center', padding: '10px 0' }}>
                  Agendamento cancelado.
                </div>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div className="lk-serif" style={{ fontSize: 17, fontWeight: 800, color: 'var(--ink)' }}>
                      {proximo?.service.name || 'Combo Premium'}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#888', marginTop: 3 }}>
                      {proximo
                        ? format(parseISO(proximo.startAt), "EEEE · dd 'de' MMMM · HH:mm", { locale: ptBR })
                        : 'Quarta · 29 abril · 14:30'}
                    </div>
                  </div>
                  <div style={{
                    padding: '5px 10px',
                    background: status === 'CONFIRMED' ? '#4caf5018' : '#f5a62318',
                    color: status === 'CONFIRMED' ? '#2e7d32' : '#b8860b',
                    fontSize: 9.5, fontWeight: 700, borderRadius: 6,
                  }}>
                    {status === 'CONFIRMED' ? 'CONFIRMADO' : 'AGENDADO'}
                  </div>
                </div>
              )}
              {status !== 'CANCELLED' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button onClick={onReschedule} className="lk-press" style={{
                    flex: 1, textAlign: 'center', padding: '8px 0',
                    border: '1px solid var(--gray-soft)', borderRadius: 8,
                    fontSize: 11, fontWeight: 700, color: '#777', background: 'white',
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}>REMARCAR</button>
                  <button onClick={cancelar} className="lk-press" style={{
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
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>
                  Fidelidade · {loyalty ? `${loyalty.pontos} pts` : '—'}
                </span>
              </button>
            </div>
            {showFidelidade && loyalty && (
              <div style={{
                background: 'var(--navy-soft)', borderRadius: 10, padding: '10px 14px', marginBottom: 18,
                fontSize: 11, color: 'var(--ink)', lineHeight: 1.4,
              }}>
                {loyalty.recompensa}
                {loyalty.restante === 0 && (
                  <button
                    onClick={async () => {
                      try {
                        await loyaltyService.redeem();
                        await carregar();
                      } catch {}
                    }}
                    style={{
                      display: 'block', marginTop: 8, padding: '6px 12px',
                      background: 'var(--navy)', color: 'white', border: 'none',
                      borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    RESGATAR RECOMPENSA
                  </button>
                )}
              </div>
            )}

            <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 10 }}>HISTÓRICO</div>
            <div style={{ background: 'var(--bg2)', borderRadius: 12 }}>
              {historico.length === 0 ? (
                <div style={{ padding: '18px 12px', fontSize: 11, color: '#aaa', textAlign: 'center' }}>
                  Seu histórico de visitas vai aparecer aqui.
                </div>
              ) : (
                historico.map((h, i) => (
                  <div key={h.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '11px 14px', borderTop: i === 0 ? 'none' : '1px solid white', fontSize: 12,
                  }}>
                    <span style={{ color: '#777' }}>
                      <span className="lk-mono" style={{ color: '#999', marginRight: 8 }}>
                        {format(parseISO(h.startAt), 'dd MMM', { locale: ptBR })}
                      </span>
                      {h.service.name}
                    </span>
                    <span className="lk-mono" style={{ fontWeight: 700, color: 'var(--ink)' }}>
                      R$ {h.service.price}
                    </span>
                  </div>
                ))
              )}
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
