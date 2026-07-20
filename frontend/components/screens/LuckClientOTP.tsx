'use client';

import { useEffect, useRef, useState } from 'react';
import { LuckHeader, LuckProgress, LuckCTA, LuckFooter } from '../luck';
import { IconMail, IconWhatsapp } from '../icons/Icons';
import { api } from '@/lib/api';

interface Props {
  onBack: () => void;
  onNext: () => void;
  method: 'whatsapp' | 'email';
}

export function LuckClientOTP({ onBack, onNext, method }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(23);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const isEmail = method === 'email';
  const whatsapp = typeof window !== 'undefined' ? sessionStorage.getItem('cadastro_whatsapp') || '' : '';
  const nome = typeof window !== 'undefined' ? sessionStorage.getItem('cadastro_nome') || 'Cliente' : 'Cliente';
  const email = typeof window !== 'undefined' ? sessionStorage.getItem('cadastro_email') || '' : '';

  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);

  const setDigit = (i: number, v: string) => {
    if (!/^\d?$/.test(v)) return;
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  };

  const verificar = async () => {
    setErro('');
    const codigo = digits.join('');
    if (codigo.length !== 6) { setErro('Digite os 6 dígitos'); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/auth/client/verify-otp', { whatsapp, code: codigo });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({ ...data.client, role: 'client' }));
      sessionStorage.removeItem('cadastro_whatsapp');
      sessionStorage.removeItem('cadastro_nome');
      onNext();
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async () => {
    setCountdown(23);
    try { await api.post('/auth/client/send-otp', { name: nome, whatsapp }); } catch {}
  };

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <LuckProgress step={2} total={3} label="CADASTRO · CLIENTE" />
      <div style={{ flex: 1, padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>
          Confirme seu <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>{isEmail ? 'e-mail' : 'número'}</em>.
        </div>
        <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 22 }}>
          Código enviado {isEmail ? 'por e-mail para' : 'via WhatsApp para'}{' '}
          <b style={{ color: 'var(--ink)' }}>{isEmail ? email : whatsapp}</b>
        </div>
        <div style={{
          width: 60, height: 60, borderRadius: 30,
          background: isEmail ? 'var(--navy-soft)' : '#25D36618',
          display: 'grid', placeItems: 'center', marginBottom: 22,
        }}>
          {isEmail ? <IconMail size={26} color="var(--navy)" /> : <IconWhatsapp size={26} color="var(--whatsapp)" />}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !d && i > 0) inputs.current[i - 1]?.focus();
              }}
              inputMode="numeric"
              maxLength={1}
              className="lk-mono"
              style={{
                width: 40, height: 52, borderRadius: 10,
                background: 'var(--bg2)',
                border: `1.5px solid ${d ? 'var(--gray)' : i === digits.findIndex((x) => !x) ? 'var(--red)' : 'var(--gray-soft)'}`,
                textAlign: 'center', fontSize: 20, fontWeight: 700,
                color: 'var(--ink)', outline: 'none',
              }}
            />
          ))}
        </div>
        {erro && <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--red)' }}>{erro}</div>}
        <div style={{ fontSize: 12, color: '#888' }}>
          {countdown > 0 ? (
            <>Reenviar em <span className="lk-mono" style={{ color: 'var(--red)', fontWeight: 700 }}>{mm}:{ss}</span></>
          ) : (
            <button onClick={reenviar} style={{ background: 'none', border: 'none', color: 'var(--red)', fontWeight: 700, cursor: 'pointer' }}>
              Reenviar código
            </button>
          )}
        </div>
      </div>
      <LuckFooter>
        <LuckCTA onClick={verificar} disabled={loading}>{loading ? 'VERIFICANDO…' : 'VERIFICAR CÓDIGO'}</LuckCTA>
      </LuckFooter>
    </div>
  );
}
