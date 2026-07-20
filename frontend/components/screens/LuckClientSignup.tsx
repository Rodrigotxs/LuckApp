'use client';

import { useState } from 'react';
import { LuckHeader, LuckProgress, LuckField, LuckCTA, LuckFooter, LuckSocialButtons } from '../luck';
import { IconArrow, IconCheck, IconWhatsapp } from '../icons/Icons';
import { authService } from '@/lib/services';

interface Props {
  onBack: () => void;
  onNext: () => void;
  method: 'whatsapp' | 'email';
  setMethod: (m: 'whatsapp' | 'email') => void;
}

export function LuckClientSignup({ onBack, onNext, method, setMethod }: Props) {
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [aceito, setAceito] = useState(true);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const enviar = async () => {
    setErro('');
    if (!nome.trim()) { setErro('Informe seu nome'); return; }
    if (method === 'whatsapp') {
      const wa = whatsapp.replace(/\D/g, '');
      if (wa.length < 11) { setErro('WhatsApp deve ter 11 dígitos (com DDD)'); return; }
      setLoading(true);
      try {
        await authService.sendClientOtp(nome, wa);
        sessionStorage.setItem('cadastro_whatsapp', wa);
        sessionStorage.setItem('cadastro_nome', nome);
        sessionStorage.removeItem('cadastro_email');
        onNext();
      } catch (err: any) {
        setErro(err.response?.data?.message || 'Erro ao enviar código');
      } finally { setLoading(false); }
    } else {
      if (!/^\S+@\S+\.\S+$/.test(email)) { setErro('E-mail inválido'); return; }
      setLoading(true);
      try {
        await authService.sendClientEmailOtp(nome, email);
        sessionStorage.setItem('cadastro_email', email);
        sessionStorage.setItem('cadastro_nome', nome);
        sessionStorage.removeItem('cadastro_whatsapp');
        onNext();
      } catch (err: any) {
        setErro(err.response?.data?.message || 'Erro ao enviar código por e-mail');
      } finally { setLoading(false); }
    }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <LuckProgress step={1} total={3} label="CADASTRO · CLIENTE" />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '10px 18px 140px' }}>
        <div className="lk-serif" style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>
          Vamos te <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>conhecer</em>.
        </div>
        <div style={{ fontSize: 12.5, color: '#888', marginBottom: 20, lineHeight: 1.4 }}>
          Suas informações para confirmar o agendamento.
        </div>
        <LuckSocialButtons />

        <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 16 }}>
          <button onClick={() => setMethod('whatsapp')} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: method === 'whatsapp' ? 'var(--red)' : 'transparent',
            color: method === 'whatsapp' ? 'white' : '#888',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <IconWhatsapp size={13} color={method === 'whatsapp' ? 'white' : '#888'} />WHATSAPP
          </button>
          <button onClick={() => setMethod('email')} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: method === 'email' ? 'var(--red)' : 'transparent',
            color: method === 'email' ? 'white' : '#888',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
          }}>E-MAIL</button>
        </div>

        <LuckField label="Nome completo" value={nome} onChange={setNome} editable state={nome ? 'filled' : 'idle'} />
        {method === 'whatsapp' ? (
          <LuckField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} editable state={whatsapp ? 'filled' : 'focus'} mono help="Você receberá um código por aqui" />
        ) : (
          <LuckField label="E-mail" value={email} onChange={setEmail} editable state={email ? 'filled' : 'focus'} help="Enviaremos um código de verificação" />
        )}

        <div
          onClick={() => setAceito((v) => !v)}
          style={{
            marginTop: 10, padding: '12px 14px', background: 'var(--bg2)', borderRadius: 10,
            display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer',
          }}
        >
          <div style={{
            width: 16, height: 16, borderRadius: 3,
            background: aceito ? 'var(--red)' : 'white',
            border: aceito ? 'none' : '1.5px solid var(--gray)',
            display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 1,
          }}>
            {aceito && <IconCheck size={10} color="white" strokeWidth={3} />}
          </div>
          <div style={{ fontSize: 11, color: '#777', lineHeight: 1.4 }}>
            Concordo com os <span style={{ color: 'var(--red)' }}>Termos de Uso</span> e a{' '}
            <span style={{ color: 'var(--red)' }}>Política de Privacidade</span>.
          </div>
        </div>

        {erro && (
          <div style={{ marginTop: 10, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
            {erro}
          </div>
        )}
      </div>
      <LuckFooter>
        <LuckCTA disabled={!aceito || loading} onClick={enviar} icon={<IconArrow size={17} color="white" strokeWidth={2} />}>
          {loading ? 'ENVIANDO…' : 'ENVIAR CÓDIGO'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
