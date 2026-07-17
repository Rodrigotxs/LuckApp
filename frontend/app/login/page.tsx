'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { salvarSessao } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/owner/login', form);
      salvarSessao(data.token, { ...data.owner, role: 'owner' });
      router.push('/painel');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'E-mail ou senha inválidos');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="flex flex-col items-center mb-10">
            <div className="w-16 h-16 bg-[#1A3A6B] rounded-full flex items-center justify-center mb-4">
              <Scissors size={30} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1A3A6B]">Entrar</h1>
            <p className="text-[#BDBDBD] text-sm mt-1">Painel do Dono</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input label="E-mail" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            <Input label="Senha" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />

            {erro && <p className="text-red-500 text-sm text-center bg-red-50 py-2 px-3 rounded-lg">{erro}</p>}

            <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2">
              Entrar
            </Button>
          </form>

          <p className="text-center text-sm text-[#BDBDBD] mt-6">
            Não tem conta?{' '}
            <button onClick={() => router.push('/cadastro/dono')} className="text-[#C0392B] font-semibold hover:underline">
              Cadastre-se
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
