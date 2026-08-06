'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { LuckHeader } from '../luck';
import { IconCheck } from '../icons/Icons';
import { rescheduleService } from '@/lib/services';
import type { RescheduleRequest } from '@/lib/services/reschedule.service';

interface Props { onBack: () => void; }

export function LuckOwnerRescheduleRequests({ onBack }: Props) {
  const [requests, setRequests] = useState<RescheduleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [aplicando, setAplicando] = useState<string | null>(null);

  const carregar = async () => {
    setLoading(true);
    try {
      const data = await rescheduleService.listOwner('PENDING');
      setRequests(data);
    } catch {}
    finally { setLoading(false); }
  };

  useEffect(() => { carregar(); }, []);

  const responder = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setAplicando(id);
    try {
      await rescheduleService.respond(id, status);
      await carregar();
    } catch {
      /* ignore */
    } finally {
      setAplicando(null);
    }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 40px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8, color: 'var(--navy)' }}>PEDIDOS DE REAGENDAMENTO</div>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Aguardando <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>resposta</em>
        </div>

        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: '#bbb', fontSize: 12 }}>Carregando…</div>
        ) : requests.length === 0 ? (
          <div style={{
            background: 'var(--bg2)', borderRadius: 14,
            padding: '32px 18px', textAlign: 'center', color: '#888', fontSize: 12, lineHeight: 1.5,
          }}>
            Nenhum pedido pendente no momento.<br />
            Você será notificado por WhatsApp quando um cliente solicitar reagendamento.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {requests.map((r) => (
              <div key={r.id} style={{
                background: 'white',
                border: '1.5px solid var(--gray-soft)',
                borderTop: '3px solid var(--navy)',
                borderRadius: 14, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div className="lk-serif" style={{ fontSize: 15.5, fontWeight: 800, color: 'var(--ink)' }}>
                      {r.client?.name || 'Cliente'}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>{r.client?.whatsapp}</div>
                  </div>
                  <div style={{
                    padding: '3px 8px', background: '#f5a62318', color: '#b8860b',
                    fontSize: 9.5, fontWeight: 700, borderRadius: 5, letterSpacing: '0.06em',
                  }}>
                    ● PENDENTE
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: '#555', marginBottom: 10 }}>
                  <div>
                    <b style={{ color: 'var(--ink)' }}>Serviço:</b>{' '}
                    {r.appointment?.service.name}
                  </div>
                  <div>
                    <b style={{ color: 'var(--ink)' }}>Data atual:</b>{' '}
                    {r.appointment && format(parseISO(r.appointment.startAt), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </div>
                  <div style={{ color: 'var(--navy)', fontWeight: 700 }}>
                    → Cliente propôs:{' '}
                    {format(parseISO(r.requestedStart), "dd/MM 'às' HH:mm", { locale: ptBR })}
                  </div>
                  {r.message && (
                    <div style={{ fontSize: 11, fontStyle: 'italic', color: '#888', marginTop: 2 }}>
                      "{r.message}"
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => responder(r.id, 'REJECTED')}
                    disabled={aplicando === r.id}
                    className="lk-press"
                    style={{
                      flex: 1, padding: '10px 0', borderRadius: 8,
                      border: '1px solid var(--red)', background: 'white',
                      fontSize: 11.5, fontWeight: 700, color: 'var(--red)',
                      cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    RECUSAR
                  </button>
                  <button
                    onClick={() => responder(r.id, 'APPROVED')}
                    disabled={aplicando === r.id}
                    className="lk-press"
                    style={{
                      flex: 2, padding: '10px 0', borderRadius: 8,
                      border: 'none', background: 'var(--navy)',
                      fontSize: 11.5, fontWeight: 700, color: 'white',
                      cursor: 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <IconCheck size={13} color="white" strokeWidth={3} /> APROVAR E REMARCAR
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
