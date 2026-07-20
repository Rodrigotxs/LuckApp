'use client';

import { useEffect, useState } from 'react';
import { LuckHeader, LuckField, LuckCTA, LuckFooter } from '../luck';
import { IconCalendar, IconCheck, IconEdit, IconPlus } from '../icons/Icons';
import { LUCK_UNITS } from './data';
import { clientService, ownerService, authService } from '@/lib/services';

interface Props {
  role: 'client' | 'owner';
  onBack: () => void;
  onLogout: () => void;
  onCalendar?: () => void;
}

export function LuckProfile({ role, onBack, onLogout, onCalendar }: Props) {
  const isOwner = role === 'owner';
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [establishment, setEstablishment] = useState('Barbearia Luck');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [unitId, setUnitId] = useState('atlantica');
  const [unitOpen, setUnitOpen] = useState(false);
  const color = isOwner ? 'var(--navy)' : 'var(--red)';
  const colorSoft = isOwner ? 'var(--navy-soft)' : 'var(--red-soft)';

  useEffect(() => {
    (async () => {
      try {
        if (isOwner) {
          const owner = await ownerService.getMe();
          setName(owner.name);
          setWhatsapp(owner.whatsapp);
          setEmail(owner.email);
          setEstablishment(owner.barbershopName);
          setEndereco(owner.barbershopAddress || '');
          setCep(owner.zipCode || '');
        } else {
          const client = await clientService.getMe();
          setName(client.name);
          setWhatsapp(client.whatsapp);
          setEmail(client.email || '');
        }
      } catch {
        // Backend offline: usa defaults do design
        setName(isOwner ? 'Diego Monteiro' : 'Ricardo Almeida');
        setWhatsapp(isOwner ? '(11) 99887-6655' : '(11) 98765-4321');
        setEmail(isOwner ? 'diego@navalha.co' : 'ricardo.almeida@gmail.com');
      }
    })();
  }, [isOwner]);

  const salvar = async () => {
    setErro('');
    if (novaSenha && novaSenha.length < 6) {
      setErro('Nova senha deve ter no mínimo 6 caracteres');
      return;
    }
    setLoading(true);
    try {
      if (isOwner) {
        await ownerService.updateMe({
          name, whatsapp, email,
          barbershopName: establishment,
          barbershopAddress: endereco || undefined,
          zipCode: cep || undefined,
        });
      } else {
        await clientService.updateMe({ name, whatsapp, email });
        if (novaSenha) {
          await authService.setClientPassword(novaSenha);
        }
      }
      setNovaSenha('');
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const iniciais = name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase() || (isOwner ? 'DM' : 'RA');

  return (
    <div className="lk-screen">
      <LuckHeader
        onBack={onBack}
        right={
          <div style={{ display: 'flex', gap: 8 }}>
            {!isOwner && onCalendar && (
              <button onClick={onCalendar} style={{
                width: 32, height: 32, borderRadius: 16, background: 'var(--bg2)', border: 'none',
                display: 'grid', placeItems: 'center', cursor: 'pointer',
              }}>
                <IconCalendar size={15} color="#888" />
              </button>
            )}
            <button onClick={() => setEditing((e) => !e)} style={{
              width: 32, height: 32, borderRadius: 16, background: 'var(--bg2)', border: 'none',
              display: 'grid', placeItems: 'center', cursor: 'pointer',
            }}>
              {editing ? <IconCheck size={15} color={color} strokeWidth={2.5} /> : <IconEdit size={15} color="#888" strokeWidth={1.8} />}
            </button>
          </div>
        }
      />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8, color }}>MEU PERFIL</div>
        <div className="lk-serif" style={{ fontSize: 24, fontWeight: 800, marginBottom: 18 }}>
          {editing ? <>Editar <em style={{ color, fontStyle: 'italic' }}>dados</em></> : <>Meus <em style={{ color, fontStyle: 'italic' }}>dados</em></>}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ position: 'relative' }}>
            <div style={{
              width: 78, height: 78, borderRadius: 39,
              background: colorSoft, border: `2px solid ${color}`,
              display: 'grid', placeItems: 'center', fontSize: 22, fontWeight: 700, color,
            }}>
              {iniciais}
            </div>
            {editing && (
              <div style={{
                position: 'absolute', bottom: -2, right: -2,
                width: 26, height: 26, borderRadius: 13,
                background: color, border: '3px solid white',
                display: 'grid', placeItems: 'center',
              }}>
                <IconPlus size={13} color="white" strokeWidth={2.5} />
              </div>
            )}
          </div>
          <div style={{
            marginTop: 10, padding: '4px 10px',
            background: colorSoft, color, fontSize: 9.5, fontWeight: 700,
            letterSpacing: '0.08em', borderRadius: 5,
          }}>
            {isOwner ? 'FUNCIONÁRIO' : 'CLIENTE'}
          </div>
        </div>

        <LuckField label="Nome completo" value={name} editable={editing} onChange={setName} state={editing ? 'focus' : 'success'} />
        <LuckField label="WhatsApp" value={whatsapp} editable={editing} onChange={setWhatsapp} state={editing ? 'filled' : 'success'} mono />
        <LuckField label="E-mail" value={email} editable={editing} onChange={setEmail} state={editing ? 'filled' : 'success'} />

        {isOwner && (
          <>
            <LuckField label="Nome do estabelecimento" value={establishment} editable={editing} onChange={setEstablishment} state={editing ? 'filled' : 'success'} />
            <LuckField label="Endereço" value={endereco} editable={editing} onChange={setEndereco} state={editing ? 'filled' : 'success'} />
            <LuckField label="CEP" value={cep} editable={editing} onChange={setCep} state={editing ? 'filled' : 'success'} mono />
          </>
        )}

        {isOwner && (
          <div style={{ marginTop: 4 }}>
            <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.08em', fontWeight: 600, margin: '10px 0 8px' }}>
              UNIDADE VINCULADA
            </div>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setUnitOpen((o) => !o)}
                className="lk-press"
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  padding: '11px 13px', background: 'var(--bg2)',
                  border: unitOpen ? '1.5px solid var(--navy)' : '1.5px solid transparent',
                  borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                }}
              >
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>
                  {LUCK_UNITS.find((u) => u.id === unitId)?.name}
                </div>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ transform: unitOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {unitOpen && (
                <div style={{
                  marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6,
                  background: 'white', border: '1px solid var(--gray-soft)', borderRadius: 12,
                  padding: 6, boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                }}>
                  {LUCK_UNITS.map((u) => {
                    const sel = unitId === u.id;
                    return (
                      <button
                        key={u.id}
                        onClick={() => { setUnitId(u.id); setUnitOpen(false); }}
                        className="lk-press"
                        style={{
                          background: sel ? 'var(--navy-soft)' : 'transparent', border: 'none',
                          borderRadius: 9, padding: '10px 11px',
                          display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{u.name}</div>
                          <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{u.address}</div>
                        </div>
                        {sel && <IconCheck size={13} color="var(--navy)" strokeWidth={3} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {editing && (
          <LuckField
            label="Nova senha"
            placeholder="Deixe em branco para não alterar"
            value={novaSenha}
            editable
            type="password"
            onChange={setNovaSenha}
            state={novaSenha ? 'filled' : 'idle'}
            help={isOwner ? 'Alteração de senha do dono via "Esqueci minha senha" no login.' : 'Mín. 6 caracteres. Deixe em branco para manter a atual.'}
          />
        )}

        {erro && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
            {erro}
          </div>
        )}

        {!editing && saved && (
          <div style={{
            marginTop: 8, padding: '12px 14px',
            background: '#4caf5015', border: '1px solid #4caf5040', borderRadius: 10,
            fontSize: 11.5, color: '#2e7d32', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <IconCheck size={14} color="#2e7d32" strokeWidth={3} /> Alterações salvas com sucesso.
          </div>
        )}

        {!editing && !saved && (
          <div style={{
            marginTop: 8, padding: '12px 14px',
            background: 'var(--bg2)', borderRadius: 10,
            fontSize: 11, color: '#888', lineHeight: 1.4,
          }}>
            Toque no ícone de lápis para editar suas informações.
          </div>
        )}

        {!editing && (
          <button onClick={onLogout} className="lk-press" style={{
            width: '100%', marginTop: 24, padding: '14px', borderRadius: 12,
            border: '1.5px solid var(--gray-soft)', background: 'white',
            cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 12.5, fontWeight: 700, color: '#c0392b',
          }}>
            SAIR DA CONTA
          </button>
        )}
      </div>
      {editing && (
        <LuckFooter>
          <LuckCTA
            variant={isOwner ? 'navy' : 'primary'}
            onClick={salvar}
            disabled={loading}
            icon={<IconCheck size={17} color="white" strokeWidth={2.5} />}
          >
            {loading ? 'SALVANDO…' : 'SALVAR ALTERAÇÕES'}
          </LuckCTA>
        </LuckFooter>
      )}
    </div>
  );
}
