'use client';

import { useEffect, useState } from 'react';
import { LuckHeader, LuckField, LuckCTA, LuckFooter } from '../luck';
import { IconCheck } from '../icons/Icons';
import { appointmentsService, clientService, servicesService } from '@/lib/services';
import type { Service } from '@/lib/services/services.service';

interface Props {
  onBack: () => void;
  onConfirm: () => void;
}

export function LuckOwnerBookForm({ onBack, onConfirm }: Props) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [servicos, setServicos] = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>('');
  const [data, setData] = useState('');
  const [horario, setHorario] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    servicesService.list()
      .then((s) => { setServicos(s); if (s[0]) setServiceId(s[0].id); })
      .catch(() => {});

    const hoje = new Date();
    setData(hoje.toISOString().slice(0, 10));
    setHorario('16:30');
  }, []);

  const confirmar = async () => {
    setErro('');
    if (!nome.trim() || !whatsapp.trim() || !serviceId || !data || !horario) {
      setErro('Preencha todos os campos');
      return;
    }
    setLoading(true);
    try {
      const wa = whatsapp.replace(/\D/g, '');
      const client = await clientService.findOrCreate({ name: nome, whatsapp: wa });

      // Precisa do ownerId — vem do localStorage.user
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const [h, m] = horario.split(':').map(Number);
      const startAt = new Date(`${data}T00:00:00`);
      startAt.setHours(h, m, 0, 0);

      await appointmentsService.create({
        ownerId: user.id,
        clientId: client.id,
        serviceId,
        startAt: startAt.toISOString(),
        notes: `Agendado pelo dono para ${nome}`,
      });

      onConfirm();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8, color: 'var(--red)' }}>NOVO ATENDIMENTO</div>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 16 }}>
          Agendar para um <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>cliente</em>
        </div>

        <LuckField label="Nome do cliente" value={nome} editable onChange={setNome} state={nome ? 'filled' : 'focus'} />
        <LuckField label="WhatsApp" value={whatsapp} editable onChange={setWhatsapp} mono state={whatsapp ? 'filled' : 'idle'} />

        <label style={{
          fontSize: 10.5, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase',
          fontWeight: 700, display: 'block', marginBottom: 6,
        }}>Serviço</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          {servicos.length === 0 && (
            <div style={{ fontSize: 11, color: '#aaa' }}>Cadastre serviços para poder agendar.</div>
          )}
          {servicos.map((s) => {
            const sel = serviceId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setServiceId(s.id)}
                className="lk-press"
                style={{
                  background: sel ? 'var(--red-soft)' : 'var(--bg2)',
                  border: sel ? '1.5px solid var(--red)' : '1.5px solid transparent',
                  borderRadius: 10, padding: '10px 14px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{s.name}</span>
                <span className="lk-mono" style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>R$ {s.price}</span>
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <LuckField label="Data" value={data} editable onChange={setData} mono state="filled" />
          <LuckField label="Horário" value={horario} editable onChange={setHorario} mono state="focus" />
        </div>

        {erro && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
            {erro}
          </div>
        )}
      </div>
      <LuckFooter>
        <LuckCTA onClick={confirmar} disabled={loading} icon={<IconCheck size={17} color="white" strokeWidth={2.5} />}>
          {loading ? 'CRIANDO…' : 'CONFIRMAR ATENDIMENTO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
