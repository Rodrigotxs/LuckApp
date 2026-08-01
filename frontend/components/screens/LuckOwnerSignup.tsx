'use client';

import { useState } from 'react';
import { LuckHeader, LuckProgress, LuckField, LuckCTA, LuckFooter, LuckSocialButtons } from '../luck';
import { IconArrow, IconCheck, IconWhatsapp } from '../icons/Icons';
import { LUCK_UNITS } from './data';
import { api } from '@/lib/api';
import { unitsService } from '@/lib/services';
import { useEffect } from 'react';

interface Props {
  onBack: () => void;
  onNext: () => void;
  selectedUnitId: string | null;
  setSelectedUnitId: (id: string) => void;
}

export function LuckOwnerSignup({ onBack, onNext, selectedUnitId, setSelectedUnitId }: Props) {
  const [method, setMethod] = useState<'email' | 'whatsapp'>('email');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [senha, setSenha] = useState('');
  const [barbearia, setBarbearia] = useState('');
  const [endereco, setEndereco] = useState('');
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [unidades, setUnidades] = useState(LUCK_UNITS as Array<{ id: string; name: string; address: string }>);

  // Buscar unidades reais (com UUIDs) — se o backend estiver rodando
  useEffect(() => {
    // Tenta listar via owner default para ter contexto — mas Units.list requer auth.
    // Usamos GET público sob o dono default.
    import('@/lib/services').then(({ ownerService, unitsService }) =>
      ownerService.getDefaultPublic()
        .then((o) => o ? unitsService.listPublic(o.id) : null)
        .then((u) => { if (u && u.length) setUnidades(u); })
        .catch(() => {})
    );
  }, []);

  const submit = async () => {
    setErro('');
    if (!nome.trim() || !email.trim() || !senha.trim() || !barbearia.trim()) {
      setErro('Preencha os campos obrigatórios (nome, e-mail, senha e barbearia).');
      return;
    }
    if (senha.length < 6) { setErro('Senha deve ter no mínimo 6 caracteres.'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/owner/register', {
        name: nome,
        email,
        password: senha,
        whatsapp: whatsapp.replace(/\D/g, '') || '5511000000000',
        barbershopName: barbearia,
        barbershopAddress: endereco,
        zipCode: cep || undefined,
        unitId: selectedUnitId || undefined,
      });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...data.owner, role: 'owner' }));
      onNext();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar');
    } finally { setLoading(false); }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <LuckProgress step={1} total={4} label="CADASTRO · FUNCIONÁRIO" />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 140px' }}>
        <div className="lk-serif" style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
          Sua <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>barbearia</em>
        </div>
        <div style={{ fontSize: 12.5, color: '#888', marginBottom: 20 }}>Como seus clientes vão te encontrar.</div>
        <LuckSocialButtons papel="owner" />

        <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 16 }}>
          <button onClick={() => setMethod('email')} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: method === 'email' ? 'var(--navy)' : 'transparent',
            color: method === 'email' ? 'white' : '#888',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
          }}>E-MAIL</button>
          <button onClick={() => setMethod('whatsapp')} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: method === 'whatsapp' ? 'var(--navy)' : 'transparent',
            color: method === 'whatsapp' ? 'white' : '#888',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <IconWhatsapp size={13} color={method === 'whatsapp' ? 'white' : '#888'} />
            WHATSAPP
          </button>
        </div>

        <LuckField label="Seu nome" value={nome} editable onChange={setNome} state={nome ? 'filled' : 'idle'} />
        {method === 'email' ? (
          <>
            <LuckField label="E-mail" value={email} editable onChange={setEmail} state={email ? 'filled' : 'focus'} help="Enviaremos um código de verificação" />
            <LuckField label="Senha" value={senha} editable onChange={setSenha} type="password" state={senha ? 'filled' : 'idle'} />
          </>
        ) : (
          <>
            <LuckField label="WhatsApp" value={whatsapp} editable onChange={setWhatsapp} state={whatsapp ? 'filled' : 'focus'} mono help="Você receberá um código por aqui" />
            <LuckField label="Senha" value={senha} editable onChange={setSenha} type="password" state={senha ? 'filled' : 'idle'} />
          </>
        )}
        <LuckField label="Nome do estabelecimento" value={barbearia} editable onChange={setBarbearia} state={barbearia ? 'filled' : 'idle'} />
        <LuckField label="Endereço completo" value={endereco} editable onChange={setEndereco} state={endereco ? 'filled' : 'idle'} />
        <LuckField label="CEP" value={cep} editable onChange={setCep} mono state={cep ? 'filled' : 'idle'} />

        <div style={{ fontSize: 11, color: '#888', letterSpacing: '0.08em', fontWeight: 600, margin: '16px 0 8px' }}>UNIDADE VINCULADA</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {unidades.map((u) => {
            const sel = selectedUnitId === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setSelectedUnitId(u.id)}
                className="lk-press"
                style={{
                  background: sel ? 'var(--navy-soft)' : 'var(--bg2)',
                  border: sel ? '1.5px solid var(--navy)' : '1.5px solid transparent',
                  borderRadius: 12, padding: '11px 13px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)' }}>{u.name}</div>
                  <div style={{ fontSize: 10, color: '#888', marginTop: 1 }}>{u.address}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: 9,
                  border: sel ? 'none' : '1.5px solid var(--gray)',
                  background: sel ? 'var(--navy)' : 'transparent',
                  display: 'grid', placeItems: 'center', flexShrink: 0,
                }}>
                  {sel && <IconCheck size={10} color="white" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ fontSize: 10.5, color: '#888', marginTop: 8 }}>
          Você só vai aparecer para clientes que agendarem nesta unidade.
        </div>

        {erro && (
          <div style={{ marginTop: 12, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
            {erro}
          </div>
        )}
      </div>
      <LuckFooter>
        <LuckCTA
          variant="navy"
          disabled={!selectedUnitId || loading}
          onClick={submit}
          icon={<IconArrow size={17} color="white" strokeWidth={2} />}
        >
          {loading ? 'CADASTRANDO…' : 'CONTINUAR'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
