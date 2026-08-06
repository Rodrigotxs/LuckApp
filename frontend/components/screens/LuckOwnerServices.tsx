'use client';

import { useEffect, useState } from 'react';
import { LuckHeader, LuckProgress, LuckField, LuckCTA, LuckFooter } from '../luck';
import { IconArrow, IconCombo, IconMore, IconPlus, IconRazor, IconScissors } from '../icons/Icons';
import { servicesService } from '@/lib/services';
import type { Service } from '@/lib/services/services.service';

interface Props {
  onBack: () => void;
  onNext: () => void;
}

const iconFor = (name?: string) => (name === 'IconScissors' ? IconScissors : name === 'IconRazor' ? IconRazor : IconCombo);

export function LuckOwnerServices({ onBack, onNext }: Props) {
  const [services, setServices] = useState<Service[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState('');
  const [loaded, setLoaded] = useState(false);

  const carregar = async () => {
    try {
      const data = await servicesService.list();
      setServices(data);
    } catch {}
    finally { setLoaded(true); }
  };

  useEffect(() => { carregar(); }, []);

  const addService = async () => {
    setErro('');
    if (!name.trim()) { setErro('Informe o nome do serviço'); return; }
    const p = parseFloat(price);
    const d = parseInt(duration);
    if (isNaN(p) || p < 0) { setErro('Preço inválido'); return; }
    if (isNaN(d) || d < 5) { setErro('Duração mínima 5 min'); return; }

    setSaving(true);
    try {
      await servicesService.create({ name: name.trim(), price: p, durationMin: d });
      setName(''); setPrice(''); setDuration(''); setShowForm(false);
      await carregar();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao criar');
    } finally { setSaving(false); }
  };

  const remover = async (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Desativar este serviço?')) return;
    try {
      await servicesService.remove(id);
      await carregar();
    } catch {}
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
          {!loaded ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 12, color: '#bbb' }}>Carregando…</div>
          ) : services.length === 0 && !showForm ? (
            <div style={{ padding: 12, background: 'var(--bg2)', borderRadius: 10, fontSize: 11.5, color: '#888', textAlign: 'center' }}>
              Nenhum serviço cadastrado ainda.
            </div>
          ) : (
            services.map((s) => {
              const Icon = iconFor();
              return (
                <div key={s.id} style={{
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
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)' }}>{s.name}</div>
                    <div style={{ fontSize: 10.5, color: '#888' }}>{s.durationMin} min · R$ {s.price}</div>
                  </div>
                  <button
                    onClick={() => remover(s.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
                    title="Desativar"
                  >
                    <IconMore size={14} color="#999" />
                  </button>
                </div>
              );
            })
          )}

          {showForm ? (
            <div style={{
              background: 'var(--bg2)', border: '1.5px solid var(--red)', borderRadius: 12, padding: '14px',
            }}>
              <LuckField label="Nome do serviço" value={name} onChange={setName} editable placeholder="Ex: Sobrancelha" state={name ? 'filled' : 'focus'} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: -4 }}>
                <LuckField label="Preço (R$)" value={price} onChange={setPrice} editable placeholder="45" state={price ? 'filled' : 'idle'} mono type="number" />
                <LuckField label="Duração (min)" value={duration} onChange={setDuration} editable placeholder="30" state={duration ? 'filled' : 'idle'} mono type="number" />
              </div>
              {erro && (
                <div style={{ marginBottom: 8, padding: '8px 12px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 8, fontSize: 11, color: 'var(--red)' }}>
                  {erro}
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowForm(false); setErro(''); }} style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none',
                  background: 'transparent', color: '#888', fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>CANCELAR</button>
                <button onClick={addService} disabled={saving} style={{
                  flex: 2, padding: '10px', borderRadius: 8, border: 'none',
                  background: 'var(--red)', color: 'white', fontSize: 12, fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  opacity: saving ? 0.6 : 1,
                }}>{saving ? 'SALVANDO…' : 'ADICIONAR'}</button>
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
        <LuckCTA variant="navy" onClick={onNext} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          FINALIZAR CADASTRO
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
