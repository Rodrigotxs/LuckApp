'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Scissors, Clock, Target, LogOut, Calendar, Edit2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { encerrarSessao, obterUsuario } from '@/lib/auth';

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

interface Servico { id: string; name: string; price: number; durationMin: number; description?: string; }
interface Horario { dayOfWeek: number; startTime: string; endTime: string; active: boolean; }

export default function ConfiguracoesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [horarios, setHorarios] = useState<Horario[]>(
    Array.from({ length: 7 }, (_, i) => ({
      dayOfWeek: i, startTime: '09:00', endTime: '19:00', active: i >= 1 && i <= 5,
    })),
  );
  const [meta, setMeta] = useState('');
  const [editandoServico, setEditandoServico] = useState<Servico | null>(null);
  const [novoServico, setNovoServico] = useState<Partial<Servico> | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState('');

  const carregar = async () => {
    const [servs, hrs, metaR] = await Promise.all([
      api.get('/services'),
      api.get('/working-hours'),
      api.get('/financial/goals'),
    ]);
    setServicos(servs.data);

    if (hrs.data.length > 0) {
      const todos = Array.from({ length: 7 }, (_, i) => {
        const existente = hrs.data.find((h: any) => h.dayOfWeek === i);
        return existente || { dayOfWeek: i, startTime: '09:00', endTime: '19:00', active: false };
      });
      setHorarios(todos);
    }
    setMeta(String(metaR.data.metaMensal || ''));
  };

  useEffect(() => {
    setUser(obterUsuario());
    carregar();
  }, []);

  const exibirMensagem = (msg: string) => {
    setMensagem(msg);
    setTimeout(() => setMensagem(''), 3000);
  };

  const salvarHorarios = async () => {
    setSalvando(true);
    try {
      await api.post('/working-hours', { horarios });
      exibirMensagem('Horários salvos!');
    } finally { setSalvando(false); }
  };

  const salvarMeta = async () => {
    setSalvando(true);
    try {
      await api.patch('/financial/goals', { monthlyGoal: parseFloat(meta) || 0 });
      exibirMensagem('Meta atualizada!');
    } finally { setSalvando(false); }
  };

  const salvarServico = async (s: any) => {
    setSalvando(true);
    try {
      const payload = {
        name: s.name,
        price: typeof s.price === 'string' ? parseFloat(s.price) : s.price,
        durationMin: typeof s.durationMin === 'string' ? parseInt(s.durationMin) : s.durationMin,
        description: s.description,
      };
      if (s.id) await api.patch(`/services/${s.id}`, payload);
      else await api.post('/services', payload);

      setEditandoServico(null);
      setNovoServico(null);
      await carregar();
      exibirMensagem('Serviço salvo!');
    } finally { setSalvando(false); }
  };

  const removerServico = async (id: string) => {
    if (!confirm('Desativar este serviço?')) return;
    await api.delete(`/services/${id}`);
    await carregar();
    exibirMensagem('Serviço desativado');
  };

  const sair = () => {
    encerrarSessao();
    router.push('/');
  };

  const atualizarHorario = (dia: number, campo: keyof Horario, valor: any) => {
    setHorarios(horarios.map(h => h.dayOfWeek === dia ? { ...h, [campo]: valor } : h));
  };

  return (
    <div>
      <Header titulo="Configurações" subtitulo={user?.barbershopName} />

      {mensagem && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-semibold border border-green-200 z-50 shadow-lg">
          {mensagem}
        </div>
      )}

      <div className="px-4 py-4 max-w-lg mx-auto space-y-6">
        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Target size={18} className="text-[#C0392B]" />
            <h2 className="font-bold text-[#1A3A6B]">Meta Mensal</h2>
          </div>
          <Input
            label="Valor da meta (R$)"
            type="number"
            value={meta}
            onChange={(e) => setMeta(e.target.value)}
            min="0"
            step="100"
          />
          <Button variant="secondary" size="sm" onClick={salvarMeta} loading={salvando}>
            Salvar meta
          </Button>
        </Card>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Scissors size={18} className="text-[#C0392B]" />
              <h2 className="font-bold text-[#1A3A6B]">Serviços</h2>
            </div>
            <button
              onClick={() => setNovoServico({ name: '', price: 0, durationMin: 30 })}
              className="text-sm text-[#C0392B] font-semibold flex items-center gap-1 hover:underline"
            >
              <Plus size={14} /> Novo
            </button>
          </div>

          {novoServico && (
            <Card className="space-y-3 border-2 border-[#C0392B]">
              <Input
                label="Nome do serviço"
                value={novoServico.name || ''}
                onChange={(e) => setNovoServico({ ...novoServico, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Preço (R$)" type="number"
                  value={String(novoServico.price ?? '')}
                  onChange={(e) => setNovoServico({ ...novoServico, price: e.target.value as any })}
                />
                <Input
                  label="Duração (min)" type="number"
                  value={String(novoServico.durationMin ?? '')}
                  onChange={(e) => setNovoServico({ ...novoServico, durationMin: e.target.value as any })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => salvarServico(novoServico)} loading={salvando}>
                  Adicionar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setNovoServico(null)}>Cancelar</Button>
              </div>
            </Card>
          )}

          {servicos.map((s) => editandoServico?.id === s.id ? (
            <Card key={s.id} className="space-y-3 border-2 border-[#1A3A6B]">
              <Input
                label="Nome"
                value={editandoServico.name}
                onChange={(e) => setEditandoServico({ ...editandoServico, name: e.target.value })}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Preço (R$)" type="number"
                  value={String(editandoServico.price)}
                  onChange={(e) => setEditandoServico({ ...editandoServico, price: e.target.value as any })}
                />
                <Input
                  label="Duração (min)" type="number"
                  value={String(editandoServico.durationMin)}
                  onChange={(e) => setEditandoServico({ ...editandoServico, durationMin: e.target.value as any })}
                />
              </div>
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={() => salvarServico(editandoServico)} loading={salvando}>
                  Salvar
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setEditandoServico(null)}>Cancelar</Button>
              </div>
            </Card>
          ) : (
            <Card key={s.id}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#2C2C2C] truncate">{s.name}</p>
                  <div className="flex items-center gap-3 text-xs mt-1">
                    <span className="text-[#1A3A6B] flex items-center gap-1">
                      <Clock size={11} /> {s.durationMin} min
                    </span>
                    <span className="text-[#C0392B] font-bold">
                      R$ {s.price.toFixed(2).replace('.', ',')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setEditandoServico(s)} className="p-2 text-[#1A3A6B] hover:bg-[#1A3A6B]/10 rounded-full">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => removerServico(s.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {servicos.length === 0 && !novoServico && (
            <p className="text-center py-4 text-[#BDBDBD] text-sm">Nenhum serviço cadastrado</p>
          )}
        </div>

        <Card className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-[#C0392B]" />
            <h2 className="font-bold text-[#1A3A6B]">Horários de Funcionamento</h2>
          </div>
          <div className="space-y-2">
            {horarios.map((h) => (
              <div key={h.dayOfWeek} className="flex items-center gap-2 text-sm">
                <label className="flex items-center gap-2 w-24">
                  <input
                    type="checkbox"
                    checked={h.active}
                    onChange={(e) => atualizarHorario(h.dayOfWeek, 'active', e.target.checked)}
                    className="accent-[#C0392B] w-4 h-4"
                  />
                  <span className={h.active ? 'text-[#2C2C2C] font-medium' : 'text-[#BDBDBD]'}>
                    {DIAS[h.dayOfWeek].slice(0, 3)}
                  </span>
                </label>
                <input
                  type="time" value={h.startTime} disabled={!h.active}
                  onChange={(e) => atualizarHorario(h.dayOfWeek, 'startTime', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-[#BDBDBD]/40 rounded text-sm disabled:opacity-40"
                />
                <span className="text-[#BDBDBD]">–</span>
                <input
                  type="time" value={h.endTime} disabled={!h.active}
                  onChange={(e) => atualizarHorario(h.dayOfWeek, 'endTime', e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-[#BDBDBD]/40 rounded text-sm disabled:opacity-40"
                />
              </div>
            ))}
          </div>
          <Button variant="secondary" size="sm" onClick={salvarHorarios} loading={salvando}>
            Salvar horários
          </Button>
        </Card>

        <button
          onClick={sair}
          className="w-full py-3 text-red-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
