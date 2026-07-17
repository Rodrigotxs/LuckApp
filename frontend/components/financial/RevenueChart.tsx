'use client';

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface DadoDia {
  data: string;
  faturamento: number;
  agendamentos: number;
}

interface RevenueChartProps {
  dados: DadoDia[];
}

function formatarValor(valor: any) {
  const num = typeof valor === 'number' ? valor : Number(valor);
  return `R$ ${(isNaN(num) ? 0 : num).toFixed(0)}`;
}

export function RevenueChart({ dados }: RevenueChartProps) {
  if (!dados.length) {
    return (
      <div className="h-48 flex items-center justify-center text-[#BDBDBD] text-sm">
        Nenhum dado para exibir
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={dados} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#F5F5F5" />
        <XAxis
          dataKey="data"
          tick={{ fontSize: 11, fill: '#BDBDBD' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#BDBDBD' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `R$${v}`}
          width={50}
        />
        <Tooltip
          formatter={(value) => [formatarValor(value), 'Faturamento']}
          contentStyle={{ fontSize: 12, border: '1px solid #BDBDBD', borderRadius: 8 }}
        />
        <Bar dataKey="faturamento" fill="#C0392B" radius={[4, 4, 0, 0]} maxBarSize={40} />
      </BarChart>
    </ResponsiveContainer>
  );
}
