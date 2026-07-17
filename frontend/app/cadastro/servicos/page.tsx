'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { api } from '@/lib/api';

interface Servico {
  name: string;
  price: string;
  durationMin: string;
  description: string;
}

const servicosPreset = [
  { name: 'Corte Social', price: '35', durationMin: '30', description: '' },
  { name: 'Corte + Barba', price: '55', durationMin: '50', description: '' },
  { name: 'Barba', price: '25', durationMin: '25', description: '' },
];

export default function CadastroServicosPage() {
  const router = useRouter();
  const [servicos, setServicos] = useState<Servico[]>([
    { name: '', price: '', durationMin: '30', description: '' },
  ]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  const adicionar = () => setServicos([...servicos, { name: '', price: '', durationMin: '30', description: '' }]);
  const remover = (i: number) => setServicos(servicos.filter((_, idx) => idx !== i));
  const atualizar = (i: number, campo: keyof Servico, valor: string) => {
    const novos = [...servicos];
    novos[i] = { ...novos[i], [campo]: valor };
    setServicos(novos);
  };
  const usarPreset = (preset: Servico) => setServicos([...servicos.filter(s => s.name), preset]);

  const handleSubmit = async () => {
    const validos = servicos.filter(s => s.name && s.price && s.durationMin);
    if (!validos.length) { setErro('Adicione pelo menos um serviço'); return; }

    setLoading(true);
    try {
      for (const s of validos) {
        await api.post('/services', {
          name: s.name,
          price: parseFloat(s.price),
          durationMin: parseInt(s.durationMin),
          description: s.description || undefined,
        });
      }
      router.push('/cadastro/google');
    } catch (err: any) {
      setErro(err.response?.data?.message || 'Erro ao salvar serviços');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <div className="bg-[#1A3A6B] px-6 pt-12 pb-8">
        <span className="text-white/40 text-xs">3 / 4</span>
        <h1 className="text-2xl font-bold text-white mt-2">Seus serviços</h1>
        <p className="text-white/60 text-sm mt-1">Clientes vão escolher entre eles</p>
      </div>

      <div className="px-6 py-6 max-w-sm mx-auto space-y-4">
        <div>
          <p className="text-xs text-[#BDBDBD] font-semibold mb-2">Adicionar rápido:</p>
          <div className="flex gap-2 flex-wrap">
            {servicosPreset.map((p) => (
              <button
                key={p.name}
                onClick={() => usarPreset(p)}
                className="text-xs px-3 py-1.5 bg-white border border-[#BDBDBD] rounded-full hover:border-[#C0392B] hover:text-[#C0392B] transition-colors"
              >
                + {p.name}
              </button>
            ))}
          </div>
        </div>

        {servicos.map((servico, index) => (
          <Card key={index} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Scissors size={16} className="text-[#C0392B]" />
                <span className="text-sm font-semibold text-[#2C2C2C]">Serviço {index + 1}</span>
              </div>
              {servicos.length > 1 && (
                <button onClick={() => remover(index)} className="p-1 text-[#BDBDBD] hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
            <Input label="Nome do serviço" value={servico.name} onChange={(e) => atualizar(index, 'name', e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Preço (R$)" type="number" value={servico.price} onChange={(e) => atualizar(index, 'price', e.target.value)} min="0" step="0.50" />
              <Input label="Duração (min)" type="number" value={servico.durationMin} onChange={(e) => atualizar(index, 'durationMin', e.target.value)} min="5" step="5" />
            </div>
          </Card>
        ))}

        <button
          onClick={adicionar}
          className="w-full py-3 border-2 border-dashed border-[#BDBDBD] rounded-xl text-[#BDBDBD] text-sm hover:border-[#C0392B] hover:text-[#C0392B] transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Adicionar serviço
        </button>

        {erro && <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg">{erro}</p>}

        <Button variant="primary" size="lg" className="w-full" loading={loading} onClick={handleSubmit}>
          Salvar e continuar
        </Button>
        <button onClick={() => router.push('/painel')} className="w-full text-center text-[#BDBDBD] text-sm hover:text-[#2C2C2C]">
          Pular por agora
        </button>
      </div>
    </div>
  );
}
