'use client';

import { useState } from 'react';
import { LuckHeader, LuckField, LuckCTA, LuckFooter } from '../luck';
import { IconCalendar, IconCheck } from '../icons/Icons';
import { availabilityService } from '@/lib/services';

interface Props {
  onBack: () => void;
  onConfirm: () => void;
}

export function LuckOwnerBlockForm({ onBack, onConfirm }: Props) {
  const [motivo, setMotivo] = useState('Consulta médica');
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [inicio, setInicio] = useState('12:00');
  const [fim, setFim] = useState('13:30');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const bloquear = async () => {
    setErro('');
    setLoading(true);
    try {
      const [hi, mi] = inicio.split(':').map(Number);
      const [hf, mf] = fim.split(':').map(Number);
      const start = new Date(`${data}T00:00:00`);
      start.setHours(hi, mi, 0, 0);
      const end = new Date(`${data}T00:00:00`);
      end.setHours(hf, mf, 0, 0);
      await availabilityService.blockSlot(start.toISOString(), end.toISOString(), undefined, motivo);
      onConfirm();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao criar bloqueio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8, color: 'var(--navy)' }}>BLOQUEIO DE AGENDA</div>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
          Reservar um <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>compromisso</em>
        </div>

        <LuckField label="Motivo" value={motivo} editable onChange={setMotivo} state="focus" />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LuckField label="Data" value={data} editable onChange={setData} mono state="filled" />
          <LuckField label="Dia inteiro?" value="Não" state="filled" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LuckField label="Início" value={inicio} editable onChange={setInicio} mono state="focus" />
          <LuckField label="Fim" value={fim} editable onChange={setFim} mono state="filled" />
        </div>

        <div style={{
          marginTop: 4, padding: '12px 14px', background: 'var(--bg2)', borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: 8,
            background: 'white', border: '1px solid var(--gray-soft)',
            display: 'grid', placeItems: 'center', flexShrink: 0,
          }}>
            <IconCalendar size={16} color="var(--navy)" strokeWidth={1.6} />
          </div>
          <div style={{ fontSize: 11, color: '#777', lineHeight: 1.4 }}>
            Este período ficará indisponível para agendamentos de clientes e sincroniza com o Google Calendar.
          </div>
        </div>

        {erro && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
            {erro}
          </div>
        )}
      </div>
      <LuckFooter>
        <LuckCTA variant="navy" onClick={bloquear} disabled={loading} icon={<IconCheck size={17} color="white" strokeWidth={2.5} />}>
          {loading ? 'CRIANDO…' : 'BLOQUEAR HORÁRIO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
