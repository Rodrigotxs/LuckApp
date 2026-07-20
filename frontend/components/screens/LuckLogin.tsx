'use client';

import { useState } from 'react';
import { LuckHeader, LuckField, LuckCTA, LuckFooter, LuckSocialButtons } from '../luck';
import { IconArrow, IconWhatsapp } from '../icons/Icons';
import { authService } from '@/lib/services';
import { salvarSessao } from '@/lib/auth';

type Role = 'client' | 'owner';
type Method = 'email' | 'whatsapp';

interface Props {
  onBack: () => void;
  onEnter: (role: Role) => void;
  /** Chamado quando o dono precisa ir para tela de OTP após envio */
  onOwnerOtpSent?: (whatsapp: string) => void;
  /** Chamado quando cliente pede OTP (mesmo fluxo de cadastro) */
  onClientOtpSent?: () => void;
}

export function LuckLogin({ onBack, onEnter, onOwnerOtpSent, onClientOtpSent }: Props) {
  const [role, setRole] = useState<Role>('client');
  const [method, setMethod] = useState<Method>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const roleColor = role === 'client' ? 'var(--red)' : 'var(--navy)';

  const entrar = async () => {
    setErro('');
    setMensagem('');
    setLoading(true);
    try {
      if (role === 'owner') {
        if (method === 'email') {
          const data = await authService.loginOwner(email, password);
          salvarSessao(data.token, { ...data.owner, role: 'owner' });
          onEnter('owner');
        } else {
          const wa = whatsapp.replace(/\D/g, '');
          if (wa.length < 11) { setErro('WhatsApp deve ter 11 dígitos'); return; }
          await authService.sendOwnerOtp(wa);
          onOwnerOtpSent?.(wa);
        }
      } else {
        // Cliente sempre por OTP WhatsApp
        const wa = whatsapp.replace(/\D/g, '');
        if (wa.length < 11) { setErro('WhatsApp deve ter 11 dígitos'); return; }
        await authService.sendClientOtp('Cliente Luck', wa);
        sessionStorage.setItem('cadastro_whatsapp', wa);
        sessionStorage.setItem('cadastro_nome', 'Cliente Luck');
        onClientOtpSent?.();
      }
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao entrar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const esqueciSenha = async () => {
    if (role !== 'owner') return;
    const payload: any = method === 'email' ? { email } : { whatsapp: whatsapp.replace(/\D/g, '') };
    try {
      await authService.requestOwnerPasswordReset(payload);
      setResetSent(true);
      setMensagem('Se a conta existir, você receberá um link em breve.');
    } catch {
      setResetSent(true); // Sempre "sucesso" para não vazar existência de conta
    }
  };

  const podeSubmit =
    role === 'client'
      ? whatsapp.length >= 11
      : method === 'email'
        ? email.length > 0 && password.length > 0
        : whatsapp.replace(/\D/g, '').length >= 11;

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>JÁ TENHO CONTA</div>
        <div className="lk-serif" style={{ fontSize: 26, fontWeight: 800, marginBottom: 18 }}>
          Entrar na <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>conta</em>
        </div>

        <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 12 }}>
          <button onClick={() => setRole('client')} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: role === 'client' ? 'var(--red)' : 'transparent', color: role === 'client' ? 'white' : '#888',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
          }}>CLIENTE</button>
          <button onClick={() => setRole('owner')} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: role === 'owner' ? 'var(--navy)' : 'transparent', color: role === 'owner' ? 'white' : '#888',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
          }}>FUNCIONÁRIO</button>
        </div>

        {role === 'owner' && (
          <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
            <button onClick={() => setMethod('email')} style={{
              flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: method === 'email' ? roleColor : 'transparent', color: method === 'email' ? 'white' : '#888',
              fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
            }}>E-MAIL</button>
            <button onClick={() => setMethod('whatsapp')} style={{
              flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              background: method === 'whatsapp' ? roleColor : 'transparent', color: method === 'whatsapp' ? 'white' : '#888',
              fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              <IconWhatsapp size={13} color={method === 'whatsapp' ? 'white' : '#888'} />WHATSAPP
            </button>
          </div>
        )}

        <LuckSocialButtons />

        {role === 'client' || method === 'whatsapp' ? (
          <LuckField label="WhatsApp" value={whatsapp} onChange={setWhatsapp} editable state={whatsapp ? 'filled' : 'focus'} mono help="Enviaremos um código por WhatsApp" />
        ) : (
          <>
            <LuckField label="E-mail" value={email} onChange={setEmail} editable state={email ? 'filled' : 'focus'} />
            <LuckField label="Senha" value={password} onChange={setPassword} editable type="password" state={password ? 'filled' : 'idle'} />
          </>
        )}

        {role === 'owner' && (
          <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 6 }}>
            <button
              onClick={esqueciSenha}
              style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: roleColor, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {resetSent ? 'Link enviado ✓' : 'Esqueci minha senha'}
            </button>
          </div>
        )}

        {mensagem && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: '#4caf5015', border: '1px solid #4caf5040', borderRadius: 10, fontSize: 11.5, color: '#2e7d32' }}>
            {mensagem}
          </div>
        )}

        {erro && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
            {erro}
          </div>
        )}

        <div style={{ marginTop: 14, padding: '12px 14px', background: 'var(--bg2)', borderRadius: 10, fontSize: 11, color: '#888', lineHeight: 1.45 }}>
          {role === 'client'
            ? 'Entre para ver seus próximos agendamentos e histórico de visitas.'
            : 'Entre para acessar sua agenda, relatórios e configurações da barbearia.'}
        </div>
      </div>
      <LuckFooter>
        <LuckCTA
          variant={role === 'owner' ? 'navy' : 'primary'}
          onClick={entrar}
          disabled={loading || !podeSubmit}
          icon={<IconArrow size={17} color="white" strokeWidth={2} />}
        >
          {loading ? 'ENTRANDO…' : role === 'client' || method === 'whatsapp' ? 'ENVIAR CÓDIGO' : 'ENTRAR'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
