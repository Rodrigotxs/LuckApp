'use client';

import { useState } from 'react';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconWhatsapp } from '../icons/Icons';
import { LuckService, LuckBarber } from './data';
import { appointmentsService } from '@/lib/services';
import { addMinutes, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  onBack: () => void;
  services: LuckService[];
  slot: string | null;
  barber?: LuckBarber;
  confirmed: boolean;
  onConfirm: () => void;
}

interface RowProps { label: string; value: string; accent?: boolean; }

const Row = ({ label, value, accent }: RowProps) => (
  <div style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
    <div style={{ width: 90, fontSize: 9.5, color: '#999', fontWeight: 700, letterSpacing: '0.06em' }}>{label}</div>
    <div style={{ fontSize: 13, fontWeight: 700, color: accent ? 'var(--red)' : 'var(--ink)' }}>{value}</div>
  </div>
);

export function LuckClientConfirm({ onBack, services, slot, barber, confirmed, onConfirm }: Props) {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);

  const dataSelecionada =
    typeof window !== 'undefined'
      ? sessionStorage.getItem('agendar_data') || format(new Date(), 'yyyy-MM-dd')
      : format(new Date(), 'yyyy-MM-dd');
  const dataFmt = dataSelecionada && slot
    ? format(parseISO(`${dataSelecionada}T00:00:00`), "EEEE · dd 'de' MMMM", { locale: ptBR })
    : '—';

  const confirmar = async () => {
    if (!slot || services.length === 0) return;
    setLoading(true);
    setErro('');
    try {
      const ownerId = sessionStorage.getItem('agendar_ownerId') || '';
      if (!ownerId) throw new Error('Selecione uma unidade primeiro');

      // Cria N agendamentos consecutivos (um por serviço). Se só 1 serviço, cria 1.
      const [h, m] = slot.split(':').map(Number);
      let start = new Date(`${dataSelecionada}T00:00:00`);
      start.setHours(h, m, 0, 0);
      for (const svc of services) {
        await appointmentsService.create({
          ownerId,
          serviceId: svc.id,
          startAt: start.toISOString(),
          barberId: barber?.id,
        });
        start = addMinutes(start, svc.duration);
      }
      onConfirm();
    } catch (err: any) {
      setErro(err.response?.data?.message || err.message || 'Erro ao confirmar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 170px' }}>
        {confirmed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 30 }}>
            <div style={{
              width: 74, height: 74, borderRadius: 37, background: '#25D36618',
              display: 'grid', placeItems: 'center', marginBottom: 18,
            }}>
              <IconWhatsapp size={32} color="var(--whatsapp)" />
            </div>
            <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, textAlign: 'center' }}>
              Agendamento<br />enviado!
            </div>
            <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginTop: 8 }}>
              Aguarde a confirmação da barbearia pelo WhatsApp.
            </div>
          </div>
        ) : (
          <>
            <div className="lk-eyebrow" style={{ marginTop: 8 }}>PASSO 3 DE 3</div>
            <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
              Revisar e <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>confirmar</em>
            </div>
            <div style={{
              background: 'white',
              border: '1.5px solid var(--gray-soft)',
              borderTop: '3px solid var(--red)',
              borderRadius: 14, padding: '18px',
            }}>
              <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 4 }}>AGENDAMENTO</div>
              {services.map((s) => (
                <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span className="lk-serif" style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{s.name}</span>
                  <span className="lk-mono" style={{ fontSize: 12.5, color: '#888' }}>R$ {s.price}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--gray-soft)', margin: '10px 0' }} />
              <Row label="DATA" value={dataFmt} />
              <Row label="HORÁRIO" value={slot ?? '—'} accent />
              <Row label="DURAÇÃO" value={`${totalDuration} min`} />
              <Row label="PROFISSIONAL" value={barber?.name || '—'} />
              <div style={{ height: 1, background: 'var(--gray-soft)', margin: '10px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>Total a pagar no local</span>
                <span className="lk-mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--red)' }}>R$ {totalPrice},00</span>
              </div>
            </div>
            {erro && (
              <div style={{ marginTop: 10, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
                {erro}
              </div>
            )}
          </>
        )}
      </div>
      {!confirmed && (
        <LuckFooter>
          <LuckCTA variant="whatsapp" onClick={confirmar} disabled={loading} icon={<IconWhatsapp size={18} color="white" />}>
            {loading ? 'ENVIANDO…' : 'CONFIRMAR VIA WHATSAPP'}
          </LuckCTA>
        </LuckFooter>
      )}
    </div>
  );
}
