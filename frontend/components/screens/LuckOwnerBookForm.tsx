'use client';

import { useState } from 'react';
import { LuckHeader, LuckField, LuckCTA, LuckFooter } from '../luck';
import { IconCheck } from '../icons/Icons';

interface Props {
  onBack: () => void;
  onConfirm: () => void;
}

export function LuckOwnerBookForm({ onBack, onConfirm }: Props) {
  const [nome, setNome] = useState('Rafael Costa');
  const [whatsapp, setWhatsapp] = useState('(11) 91234-5678');
  const [serviceIdx, setServiceIdx] = useState(1);
  const [data, setData] = useState('29/04');
  const [horario, setHorario] = useState('16:30');

  const services = [
    { n: 'Corte Masculino', p: 45 },
    { n: 'Combo Premium', p: 75 },
  ];

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8, color: 'var(--red)' }}>NOVO ATENDIMENTO</div>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
          Agendar para um <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>cliente</em>
        </div>

        <LuckField label="Nome do cliente" value={nome} editable onChange={setNome} state="focus" />
        <LuckField label="WhatsApp" value={whatsapp} editable onChange={setWhatsapp} mono state="filled" />

        <label style={{
          fontSize: 10.5, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase',
          fontWeight: 700, display: 'block', marginBottom: 6,
        }}>Serviço</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {services.map((s, i) => (
            <button
              key={i}
              onClick={() => setServiceIdx(i)}
              className="lk-press"
              style={{
                background: i === serviceIdx ? 'var(--red-soft)' : 'var(--bg2)',
                border: i === serviceIdx ? '1.5px solid var(--red)' : '1.5px solid transparent',
                borderRadius: 10, padding: '10px 14px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{s.n}</span>
              <span className="lk-mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>R$ {s.p}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LuckField label="Data" value={data} editable onChange={setData} mono state="filled" />
          <LuckField label="Horário" value={horario} editable onChange={setHorario} mono state="focus" />
        </div>
      </div>
      <LuckFooter>
        <LuckCTA onClick={onConfirm} icon={<IconCheck size={17} color="white" strokeWidth={2.5} />}>
          CONFIRMAR ATENDIMENTO
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
