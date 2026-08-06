'use client';

import { useEffect, useRef, useState } from 'react';
import { LuckHeader, LuckCTA, LuckFooter } from '../luck';
import { IconWhatsapp } from '../icons/Icons';
import { authService } from '@/lib/services';

interface Props {
  whatsapp: string;
  onBack: () => void;
  onSuccess: (payload: { token: string; owner: any }) => void;
}

export function LuckOwnerOTP({ whatsapp, onBack, onSuccess }: Props) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [countdown, setCountdown] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

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
      const data = await authService.verifyOwnerOtp(whatsapp, codigo);
      onSuccess(data);
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async () => {
    setCountdown(30);
    try { await authService.sendOwnerOtp(whatsapp); } catch {}
  };

  const mm = String(Math.floor(countdown / 60)).padStart(2, '0');
  const ss = String(countdown % 60).padStart(2, '0');

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div style={{ flex: 1, padding: '20px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="lk-serif" style={{ fontSize: 22, fontWeight: 800, textAlign: 'center', marginBottom: 6 }}>
          Confirme seu <em style={{ color: 'var(--navy)', fontStyle: 'italic' }}>WhatsApp</em>.
        </div>
        <div style={{ fontSize: 12, color: '#888', textAlign: 'center', marginBottom: 22 }}>
          Código enviado via WhatsApp para <b style={{ color: 'var(--ink)' }}>{whatsapp}</b>
        </div>
        <div style={{
          width: 60, height: 60, borderRadius: 30, background: '#25D36618',
          display: 'grid', placeItems: 'center', marginBottom: 22,
        }}>
          <IconWhatsapp size={26} color="var(--whatsapp)" />
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputs.current[i] = el; }}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) inputs.current[i - 1]?.focus(); }}
              inputMode="numeric"
              maxLength={1}
              className="lk-mono"
              style={{
                width: 40, height: 52, borderRadius: 10, background: 'var(--bg2)',
                border: `1.5px solid ${d ? 'var(--gray)' : i === digits.findIndex((x) => !x) ? 'var(--navy)' : 'var(--gray-soft)'}`,
                textAlign: 'center', fontSize: 20, fontWeight: 700, color: 'var(--ink)', outline: 'none',
              }}
            />
          ))}
        </div>
        {erro && <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--red)' }}>{erro}</div>}
        <div style={{ fontSize: 12, color: '#888' }}>
          {countdown > 0 ? (
            <>Reenviar em <span className="lk-mono" style={{ color: 'var(--navy)', fontWeight: 700 }}>{mm}:{ss}</span></>
          ) : (
            <button onClick={reenviar} style={{ background: 'none', border: 'none', color: 'var(--navy)', fontWeight: 700, cursor: 'pointer' }}>
              Reenviar código
            </button>
          )}
        </div>
      </div>
      <LuckFooter>
        <LuckCTA variant="navy" onClick={verificar} disabled={loading}>{loading ? 'VERIFICANDO…' : 'VERIFICAR CÓDIGO'}</LuckCTA>
      </LuckFooter>
    </div>
  );
}
