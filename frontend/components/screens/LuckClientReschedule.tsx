'use client';

import { useState } from 'react';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCalendar, IconClock } from '../icons/Icons';

interface Props {
  onBack: () => void;
  onSubmit: () => void;
  hasAppointment: boolean;
  onBookNew: () => void;
}

export function LuckClientReschedule({ onBack, onSubmit, hasAppointment, onBookNew }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!hasAppointment) {
    return (
      <div className="lk-screen">
        <LuckHeader onBack={onBack} />
        <div style={{ flex: 1, padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 90, height: 90, borderRadius: 45, background: 'var(--bg2)',
            display: 'grid', placeItems: 'center', marginBottom: 20,
          }}>
            <IconCalendar size={34} color="#bbb" />
          </div>
          <div className="lk-eyebrow" style={{ marginBottom: 10 }}>NENHUM AGENDAMENTO</div>
          <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
            Sua agenda está <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>vazia</em>
          </div>
          <div style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.5 }}>
            Você ainda não tem nenhum horário marcado para remarcar. Que tal agendar agora?
          </div>
        </div>
        <LuckFooter>
          <LuckCTA onClick={onBookNew} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
            AGENDAR HORÁRIO
          </LuckCTA>
        </LuckFooter>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="lk-screen">
        <LuckHeader onBack={onBack} />
        <div style={{ flex: 1, padding: '30px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: 90, height: 90, borderRadius: 45, background: 'var(--red-soft)',
            display: 'grid', placeItems: 'center', marginBottom: 20,
          }}>
            <IconClock size={34} color="var(--red)" strokeWidth={1.8} />
          </div>
          <div className="lk-eyebrow" style={{ marginBottom: 10 }}>SOLICITAÇÃO ENVIADA</div>
          <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 8 }}>
            Aguardando <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>confirmação</em>
          </div>
          <div style={{ fontSize: 12, color: '#888', textAlign: 'center', lineHeight: 1.5 }}>
            Pedimos ao barbeiro para remarcar seu horário para <b style={{ color: 'var(--ink)' }}>{selectedSlot}</b>.
            Você será avisado por WhatsApp quando ele confirmar.
          </div>
          <div style={{
            marginTop: 20, padding: '5px 12px',
            background: '#f5a62318', color: '#b8860b',
            fontSize: 10.5, fontWeight: 700, borderRadius: 6, letterSpacing: '0.04em',
          }}>● PENDENTE</div>
        </div>
        <LuckFooter>
          <LuckCTA onClick={onSubmit} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
            VOLTAR AO INÍCIO
          </LuckCTA>
        </LuckFooter>
      </div>
    );
  }

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>REMARCAR AGENDAMENTO</div>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>
          Novo <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>horário</em>
        </div>
        <div style={{ fontSize: 11.5, color: '#888', marginBottom: 16 }}>
          Sua solicitação depende da confirmação do barbeiro.
        </div>

        <div style={{
          background: 'var(--bg2)', borderRadius: 10, padding: '10px 14px', marginBottom: 16,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <div style={{ fontSize: 10, color: '#999', fontWeight: 700, letterSpacing: '0.06em' }}>AGENDAMENTO ATUAL</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>Combo Premium · Qua 29/04 · 14:30</div>
          </div>
        </div>

        <div style={{
          background: 'white', border: '1px solid var(--gray-soft)', borderRadius: 14,
          padding: '14px 12px', marginBottom: 18,
        }}>
          <div className="lk-serif" style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
            Abril <em style={{ color: '#999', fontStyle: 'italic' }}>2026</em>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 9.5, color: '#999', fontWeight: 700 }}>{d}</div>
            ))}
            {[null, null, null, null, null].map((_, i) => <div key={i} />)}
            {[26, 27, 28, 29, 30].map((d) => (
              <div key={d} style={{
                aspectRatio: '1', display: 'grid', placeItems: 'center', borderRadius: 8,
                fontSize: 12, fontWeight: d === 30 ? 700 : 500,
                background: d === 30 ? 'var(--red)' : d === 27 ? 'var(--bg2)' : 'transparent',
                color: d === 30 ? 'white' : 'var(--ink)',
              }}>{d}</div>
            ))}
          </div>
        </div>

        <div className="lk-eyebrow" style={{ fontSize: 9.5, marginBottom: 8 }}>QUINTA · 30 ABRIL · HORÁRIOS</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
          {['08:00', '08:30*', '09:00', '09:30', '10:00', '10:30*', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30*', '15:00', '15:30', '16:00', '16:30'].map((raw) => {
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
                  padding: '10px 0', borderRadius: 8, fontSize: 12, fontWeight: 700,
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
          onClick={() => setSent(true)}
          icon={selectedSlot ? <IconArrow size={17} color="white" strokeWidth={2} /> : null}
        >
          {selectedSlot ? 'SOLICITAR ALTERAÇÃO' : 'ESCOLHA UM HORÁRIO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
