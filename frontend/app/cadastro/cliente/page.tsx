'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';

export default function CadastroClientePage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', whatsapp: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const formatarWhatsapp = (valor: string) => valor.replace(/\D/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    const whatsapp = formatarWhatsapp(form.whatsapp);
    if (whatsapp.length < 11) {
      setErro('WhatsApp deve ter pelo menos 11 dígitos (com DDD)');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/client/send-otp', { name: form.name, whatsapp });
      sessionStorage.setItem('cadastro_whatsapp', whatsapp);
      sessionStorage.setItem('cadastro_nome', form.name);
      router.push('/cadastro/verificar');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao enviar código');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <div className="bg-[#1A3A6B] px-6 pt-16 pb-10">
        <div className="flex items-center gap-3 mb-2">
          <Scissors size={22} className="text-[#C0392B]" />
          <span className="text-white/70 text-sm tracking-widest uppercase">Barbearia Luck</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Bem-vindo!</h1>
        <p className="text-white/60 text-sm mt-1">Informe seus dados para agendar</p>
      </div>

      <div className="flex-1 px-6 py-8 max-w-sm mx-auto w-full">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="Seu nome completo"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
          />
          <div>
            <Input
              label="WhatsApp (com DDD)"
              type="tel"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: formatarWhatsapp(e.target.value) })}
              required
              maxLength={13}
            />
            <p className="text-xs text-[#BDBDBD] mt-1 ml-1">Ex: 11 9 9999-9999</p>
          </div>

          {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erro}</p>}

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
            Receber Código via WhatsApp
          </Button>
        </form>

        <button
          onClick={() => router.back()}
          className="w-full text-center text-[#BDBDBD] text-sm mt-6 hover:text-[#2C2C2C] transition-colors"
        >
          ← Voltar
        </button>
      </div>
    </div>
  );
}
