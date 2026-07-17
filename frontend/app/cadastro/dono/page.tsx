'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { salvarSessao } from '@/lib/auth';

export default function CadastroDono() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    whatsapp: '',
    barbershopName: '',
    barbershopAddress: '',
  });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (campo: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [campo]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');

    if (form.password !== form.confirmPassword) {
      setErro('As senhas não conferem');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/owner/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        whatsapp: form.whatsapp.replace(/\D/g, ''),
        barbershopName: form.barbershopName,
        barbershopAddress: form.barbershopAddress,
      });
      salvarSessao(data.token, { ...data.owner, role: 'owner' });
      router.push('/cadastro/servicos');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao cadastrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A3A6B] px-6 pt-12 pb-8">
        <div className="flex items-center gap-2 mb-3">
          <Scissors size={18} className="text-[#C0392B]" />
          <span className="text-white/60 text-xs tracking-widest">BARBEARIA LUCK</span>
        </div>
        <h1 className="text-2xl font-bold text-white">Criar conta</h1>
        <p className="text-white/60 text-sm mt-1">Painel do Dono</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-8 max-w-sm mx-auto flex flex-col gap-4">
        <p className="text-xs font-bold text-[#BDBDBD] uppercase tracking-wider">Dados pessoais</p>
        <Input label="Nome completo" value={form.name} onChange={set('name')} required />
        <Input label="E-mail" type="email" value={form.email} onChange={set('email')} required />
        <Input label="Senha (mín. 6 dígitos)" type="password" value={form.password} onChange={set('password')} required minLength={6} />
        <Input label="Confirmar senha" type="password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
        <Input label="WhatsApp (com DDD)" type="tel" value={form.whatsapp} onChange={set('whatsapp')} required />

        <div className="h-px bg-[#BDBDBD]/20 my-2" />
        <p className="text-xs font-bold text-[#BDBDBD] uppercase tracking-wider">Sua barbearia</p>
        <Input label="Nome da barbearia" value={form.barbershopName} onChange={set('barbershopName')} required />
        <Input label="Endereço (opcional)" value={form.barbershopAddress} onChange={set('barbershopAddress')} />

        {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erro}</p>}

        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-4">
          Criar conta
        </Button>

        <p className="text-center text-sm text-[#BDBDBD] mt-2">
          Já tem conta?{' '}
          <button type="button" onClick={() => router.push('/login')} className="text-[#C0392B] font-semibold hover:underline">
            Entrar
          </button>
        </p>
      </form>
    </div>
  );
}
