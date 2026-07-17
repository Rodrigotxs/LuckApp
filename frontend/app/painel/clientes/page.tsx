'use client';

import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, Phone, MessageCircle } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { api } from '@/lib/api';

interface Cliente {
  id: string;
  name: string;
  whatsapp: string;
  email?: string;
  ultimoServico?: string;
  ultimoAgendamento?: string;
  createdAt: string;
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients')
      .then(({ data }) => setClientes(data))
      .finally(() => setLoading(false));
  }, []);

  const filtrados = clientes.filter(c =>
    c.name.toLowerCase().includes(busca.toLowerCase()) ||
    c.whatsapp.includes(busca),
  );

  const abrirWhatsapp = (numero: string) => {
    window.open(`https://wa.me/${numero}`, '_blank');
  };

  return (
    <div>
      <Header titulo="Clientes" subtitulo={`${clientes.length} cadastrados`} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-3">
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#BDBDBD]" />
          <input
            type="text"
            placeholder="Buscar por nome ou WhatsApp"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white border border-[#BDBDBD]/30 rounded-xl text-sm outline-none focus:border-[#C0392B] transition-colors"
          />
        </div>

        {loading ? (
          Array(4).fill(null).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-xl animate-pulse" />
          ))
        ) : filtrados.length === 0 ? (
          <div className="text-center py-16 text-[#BDBDBD]">
            <p className="font-medium">
              {busca ? 'Nenhum cliente encontrado' : 'Nenhum cliente ainda'}
            </p>
            <p className="text-sm mt-1">
              {busca ? 'Tente outra busca' : 'Os clientes aparecerão aqui após o primeiro agendamento'}
            </p>
          </div>
        ) : (
          filtrados.map((c) => (
            <Card key={c.id}>
              <div className="flex items-center gap-3">
                <Avatar name={c.name} size="lg" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[#2C2C2C] truncate">{c.name}</p>
                  <div className="flex items-center gap-1 text-xs text-[#BDBDBD] mt-0.5">
                    <Phone size={11} />
                    <span>{c.whatsapp}</span>
                  </div>
                  {c.ultimoServico && c.ultimoAgendamento && (
                    <p className="text-xs text-[#1A3A6B] mt-1 truncate">
                      Último: {c.ultimoServico} – {format(parseISO(c.ultimoAgendamento), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => abrirWhatsapp(c.whatsapp)}
                  className="w-9 h-9 bg-green-50 text-green-600 rounded-full flex items-center justify-center hover:bg-green-100 transition-colors"
                  title="Abrir WhatsApp"
                >
                  <MessageCircle size={16} />
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
