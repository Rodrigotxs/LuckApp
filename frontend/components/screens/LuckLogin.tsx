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
  const [whatsapp, setWhatsapp] = useState('');
  const [password, setPassword] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');

  const roleColor = role === 'client' ? 'var(--red)' : 'var(--navy)';

  const wa = whatsapp.replace(/\D/g, '');
  const identificadorValido = method === 'email' ? /^\S+@\S+\.\S+$/.test(email) : wa.length >= 11;
  const temSenha = password.length > 0;
  const podeSubmit = identificadorValido && (temSenha || method === 'whatsapp' || method === 'email');

  const entrar = async () => {
    setErro('');
    setMensagem('');

    if (!identificadorValido) {
      setErro(method === 'email' ? 'E-mail inválido' : 'WhatsApp deve ter 11 dígitos (com DDD)');
      return;
    }

    setLoading(true);
    try {
      if (temSenha) {
        // Fluxo com senha (paridade cliente/dono)
        if (role === 'owner') {
          if (method !== 'email') {
            setErro('Login por senha do funcionário usa apenas e-mail.');
            return;
          }
          const data = await authService.loginOwner(email, password);
          salvarSessao(data.token, { ...data.owner, role: 'owner' });
          onEnter('owner');
        } else {
          const data = await authService.loginClient({
            email: method === 'email' ? email : undefined,
            whatsapp: method === 'whatsapp' ? wa : undefined,
            password,
          });
          salvarSessao(data.token, { ...data.client, role: 'client' });
          onEnter('client');
        }
      } else {
        // Sem senha → envia código (OTP)
        if (role === 'owner') {
          if (method === 'whatsapp') {
            await authService.sendOwnerOtp(wa);
            onOwnerOtpSent?.(wa);
          } else {
            setErro('Login por e-mail do funcionário exige senha. Se esqueceu, use "Esqueci minha senha".');
          }
        } else {
          if (method === 'whatsapp') {
            await authService.sendClientOtp('Cliente Luck', wa);
            sessionStorage.setItem('cadastro_whatsapp', wa);
            sessionStorage.setItem('cadastro_nome', 'Cliente Luck');
            sessionStorage.removeItem('cadastro_email');
          } else {
            await authService.sendClientEmailOtp('Cliente Luck', email);
            sessionStorage.setItem('cadastro_email', email);
            sessionStorage.setItem('cadastro_nome', 'Cliente Luck');
            sessionStorage.removeItem('cadastro_whatsapp');
          }
          onClientOtpSent?.();
        }
      }
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao entrar. Verifique seus dados.');
    } finally {
      setLoading(false);
    }
  };

  const esqueciSenha = async () => {
    const payload: any = method === 'email' ? { email } : { whatsapp: wa };
    try {
      if (role === 'owner') {
        await authService.requestOwnerPasswordReset(payload);
      } else {
        await authService.requestClientPasswordReset(payload);
      }
      setResetSent(true);
      setMensagem('Se a conta existir, você receberá um link em breve.');
    } catch {
      // Sempre exibe sucesso (não vazar existência de conta)
      setResetSent(true);
      setMensagem('Se a conta existir, você receberá um link em breve.');
    }
  };

  return (
    <div className="lk-screen">
      <LuckHeader onBack={onBack} />
      <div className="lk-scroll" style={{ flex: 1, overflowY: 'auto', padding: '16px 18px 140px' }}>
        <div className="lk-eyebrow" style={{ marginTop: 8 }}>JÁ TENHO CONTA</div>
        <div className="lk-serif" style={{ fontSize: 26, fontWeight: 800, marginBottom: 18 }}>
          Entrar na <em style={{ color: 'var(--red)', fontStyle: 'italic' }}>conta</em>
        </div>

        {/* Toggle CLIENTE / FUNCIONÁRIO — cores mudam por role */}
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

        {/* Toggle E-MAIL / WHATSAPP — sempre visível */}
        <div style={{ display: 'flex', background: 'var(--bg2)', borderRadius: 10, padding: 4, marginBottom: 20 }}>
          <button onClick={() => setMethod('email')} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: method === 'email' ? roleColor : 'transparent', color: method === 'email' ? 'white' : '#888',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
          }}>E-MAIL</button>
          <button onClick={() => setMethod('whatsapp')} style={{
            flex: 1, padding: '9px 0', borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: method === 'whatsapp' ? roleColor : 'transparent', color: method === 'whatsapp' ? 'white' : '#888',
            fontSize: 11.5, fontWeight: 700, letterSpacing: '0.04em',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            <IconWhatsapp size={13} color={method === 'whatsapp' ? 'white' : '#888'} />WHATSAPP
          </button>
        </div>

        <LuckSocialButtons papel={role} />

        {/* Campo de identificação */}
        {method === 'email' ? (
          <LuckField
            label="E-mail"
            value={email}
            onChange={setEmail}
            editable
            state={email ? 'filled' : 'focus'}
          />
        ) : (
          <LuckField
            label="WhatsApp"
            value={whatsapp}
            onChange={setWhatsapp}
            editable
            state={whatsapp ? 'filled' : 'focus'}
            mono
          />
        )}

        {/* Campo Senha — sempre visível (paridade total). Se vazio, cai no fluxo OTP. */}
        <LuckField
          label="Senha"
          value={password}
          onChange={setPassword}
          editable
          type="password"
          state={password ? 'filled' : 'idle'}
          help={!password ? 'Deixe em branco para receber um código' : undefined}
        />

        {/* Esqueci minha senha — sempre visível */}
        <div style={{ textAlign: 'right', marginTop: -6, marginBottom: 6 }}>
          <button
            onClick={esqueciSenha}
            style={{ background: 'none', border: 'none', padding: 0, fontSize: 11, color: roleColor, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            {resetSent ? 'Link enviado ✓' : 'Esqueci minha senha'}
          </button>
        </div>

        {mensagem && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: '#4caf5015', border: '1px solid #4caf5040', borderRadius: 10, fontSize: 11.5, color: '#2e7d32' }}>
            {mensagem}
          </div>
        )}

        {erro && (
          <div style={{ marginTop: 8, padding: '10px 14px', background: '#c0392b15', border: '1px solid #c0392b40', borderRadius: 10, fontSize: 11.5, color: 'var(--red)' }}>
            {erro}
            {role === 'owner' && /não encontramos|cadastre-se/i.test(erro) && (
              <div style={{ marginTop: 6, fontSize: 11 }}>
                Novo por aqui? Volte e escolha <b>Sou funcionário</b> para se cadastrar.
              </div>
            )}
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
          {loading ? 'ENTRANDO…' : 'ENTRAR'}
        </LuckCTA>
      </LuckFooter>
    </div>
  );
}
