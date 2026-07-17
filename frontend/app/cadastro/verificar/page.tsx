'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OTPInput } from '@/components/ui/OTPInput';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { salvarSessao } from '@/lib/auth';

export default function VerificarOTPPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);
  const [contador, setContador] = useState(30);
  const [podeReenviar, setPodeReenviar] = useState(false);
  const [whatsapp, setWhatsapp] = useState('');
  const [nome, setNome] = useState('');

  useEffect(() => {
    const wa = sessionStorage.getItem('cadastro_whatsapp') || '';
    const nm = sessionStorage.getItem('cadastro_nome') || '';
    if (!wa) { router.replace('/cadastro/cliente'); return; }
    setWhatsapp(wa);
    setNome(nm);

    const timer = setInterval(() => {
      setContador((c) => {
        if (c <= 1) { clearInterval(timer); setPodeReenviar(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  const verificar = async () => {
    if (codigo.length !== 6) { setErro('Digite os 6 dígitos'); return; }
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/client/verify-otp', { whatsapp, code: codigo });
      salvarSessao(data.token, { ...data.client, role: 'client' });
      sessionStorage.removeItem('cadastro_whatsapp');
      sessionStorage.removeItem('cadastro_nome');
      router.push('/agendar');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  const reenviar = async () => {
    setPodeReenviar(false);
    setContador(30);
    try {
      await api.post('/auth/client/send-otp', { whatsapp, name: nome });
      setErro('');
    } catch {
      setErro('Erro ao reenviar código');
    }
    const timer = setInterval(() => {
      setContador((c) => { if (c <= 1) { clearInterval(timer); setPodeReenviar(true); return 0; } return c - 1; });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <div className="bg-[#1A3A6B] px-6 pt-16 pb-10">
        <h1 className="text-2xl font-bold text-white">Verificação</h1>
        <p className="text-white/60 text-sm mt-1">
          Código enviado para WhatsApp{whatsapp ? ` ****${whatsapp.slice(-4)}` : ''}
        </p>
      </div>

      <div className="flex-1 px-6 py-10 max-w-sm mx-auto w-full flex flex-col items-center gap-8">
        <div className="text-center">
          <p className="text-[#2C2C2C] font-medium mb-2">Digite o código de 6 dígitos</p>
          <p className="text-[#BDBDBD] text-sm">Verifique seu WhatsApp</p>
        </div>

        <OTPInput value={codigo} onChange={setCodigo} />

        {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg w-full text-center">{erro}</p>}

        <Button variant="primary" size="lg" className="w-full" loading={loading} disabled={codigo.length !== 6} onClick={verificar}>
          Verificar Código
        </Button>

        <div className="text-center">
          {podeReenviar ? (
            <button onClick={reenviar} className="text-[#C0392B] text-sm font-semibold hover:underline">
              Reenviar código
            </button>
          ) : (
            <p className="text-[#BDBDBD] text-sm">
              Reenviar em <span className="font-bold text-[#2C2C2C]">{contador}s</span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
