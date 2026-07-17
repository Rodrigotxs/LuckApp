'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { obterUsuario, salvarSessao } from '@/lib/auth';

export default function CadastroBarbeariaPage() {
  const router = useRouter();
  const [form, setForm] = useState({ barbershopName: '', barbershopAddress: '', logoUrl: '' });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    const usuario = obterUsuario();
    if (usuario) {
      setForm({
        barbershopName: usuario.barbershopName || '',
        barbershopAddress: usuario.barbershopAddress || '',
        logoUrl: usuario.logoUrl || '',
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErro('');
    try {
      const { data } = await api.patch('/owners/me', form);
      const token = localStorage.getItem('token') || '';
      salvarSessao(token, { ...data, role: 'owner' });
      router.push('/cadastro/servicos');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao salvar dados');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A3A6B] px-6 pt-12 pb-8">
        <span className="text-white/40 text-xs">2 / 4</span>
        <h1 className="text-2xl font-bold text-white mt-2">Sua barbearia</h1>
        <p className="text-white/60 text-sm mt-1">Personalize seu espaço</p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-8 max-w-sm mx-auto flex flex-col gap-5">
        <div className="flex justify-center mb-2">
          <div className="w-20 h-20 bg-[#C0392B]/10 rounded-full flex items-center justify-center">
            <Store size={36} className="text-[#C0392B]" />
          </div>
        </div>

        <Input label="Nome da barbearia" value={form.barbershopName} onChange={(e) => setForm({ ...form, barbershopName: e.target.value })} required />
        <Input label="Endereço completo" value={form.barbershopAddress} onChange={(e) => setForm({ ...form, barbershopAddress: e.target.value })} required />
        <Input label="URL do logo (opcional)" value={form.logoUrl} onChange={(e) => setForm({ ...form, logoUrl: e.target.value })} />

        {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erro}</p>}

        <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
          Continuar
        </Button>
      </form>
    </div>
  );
}
