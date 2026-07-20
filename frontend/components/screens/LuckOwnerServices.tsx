'use client';

import { useState } from 'react';
import { LuckHeader, LuckProgress, LuckField, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCombo, IconMore, IconPlus, IconRazor, IconScissors } from '../icons/Icons';
import { api } from '@/lib/api';

interface Item { n: string; d: string; i: 'IconScissors' | 'IconRazor' | 'IconCombo'; price: number; duration: number; }

interface Props {
  onBack: () => void;
  onNext: () => void;
}

const iconFor = (name: Item['i']) => (name === 'IconScissors' ? IconScissors : name === 'IconRazor' ? IconRazor : IconCombo);

export function LuckOwnerServices({ onBack, onNext }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [services, setServices] = useState<Item[]>([
    { n: 'Corte Masculino', d: '40 min · R$ 45', i: 'IconScissors', price: 45, duration: 40 },
    { n: 'Barba Tradicional', d: '30 min · R$ 35', i: 'IconRazor', price: 35, duration: 30 },
  ]);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);

  const addService = () => {
    if (!name.trim()) return;
    const p = parseFloat(price) || 0;
    const dm = parseInt(duration) || 30;
    setServices((prev) => [...prev, { n: name, d: `${dm} min · R$ ${p}`, i: 'IconCombo', price: p, duration: dm }]);
    setName(''); setPrice(''); setDuration(''); setShowForm(false);
  };

  const finalizar = async () => {
    setSaving(true);
    try {
      for (const s of services) {
        try {
          await api.post('/services', { name: s.n, price: s.price, durationMin: s.duration });
        } catch { /* ignora duplicados */ }
      }
      onNext();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <LuckProgress step={3} total={4} label="CADASTRO · FUNCIONÁRIO" />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 140px' }}>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, marginBottom: 14 }}>
          Configure os <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>serviços</em>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {services.map((s, i) => {
            const Icon = iconFor(s.i);
            return (
              <div key={i} style={{
                background: 'var(--bg2)', borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 12,
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: 'white', border: '1px solid var(--gray-soft)',
                  display: 'grid', placeItems: 'center',
                }}>
                  <Icon size={16} color="var(--navy)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{s.n}</div>
                  <div style={{ fontSize: 10.5, color: '#888' }}>{s.d}</div>
                </div>
                <button
                  onClick={() => setServices((prev) => prev.filter((_, idx) => idx !== i))}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                >
                  <IconMore size={14} color="#999" />
                </button>
              </div>
            );
          })}

          {showForm ? (
            <div style={{
              background: 'var(--bg2)', border: '1.5px solid var(--red)', borderRadius: 12, padding: '14px',
            }}>
              <LuckField label="Nome do serviço" value={name} onChange={setName} editable placeholder="Ex: Sobrancelha" state={name ? 'filled' : 'focus'} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: -4 }}>
                <LuckField label="Preço (R$)" value={price} onChange={setPrice} editable placeholder="45" state="idle" mono />
                <LuckField label="Duração (min)" value={duration} onChange={setDuration} editable placeholder="30" state="idle" mono />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setShowForm(false)} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: 'transparent', color: '#888', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>CANCELAR</button>
                <button onClick={addService} style={{
                  flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                  background: 'var(--red)', color: 'white', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>ADICIONAR</button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowForm(true)} className="lk-press" style={{
              border: '1.5px dashed var(--red)', borderRadius: 12, padding: '12px 14px',
              display: 'flex', alignItems: 'center', gap: 12, background: 'transparent',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}>
              <div style={{
                width: 34, height: 34, borderRadius: 9,
                background: 'var(--red)', display: 'grid', placeItems: 'center',
              }}>
                <IconPlus size={16} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--red)' }}>Adicionar serviço</div>
                <div style={{ fontSize: 10.5, color: '#888' }}>Combo, sobrancelha, etc.</div>
              </div>
            </button>
          )}
        </div>
      </div>
      <LuckFooter>
        <LuckCTA variant="navy" onClick={finalizar} disabled={saving} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          {saving ? 'SALVANDO…' : 'FINALIZAR CADASTRO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
