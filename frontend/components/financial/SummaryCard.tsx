import { ReactNode } from 'react';
import { Card } from '../ui/Card';

interface SummaryCardProps {
  titulo: string;
  valor: string;
  descricao?: string;
  icone: ReactNode;
  cor?: 'red' | 'navy' | 'green';
}

const corClasses = {
  red: 'text-[#C0392B] bg-[#C0392B]/10',
  navy: 'text-[#1A3A6B] bg-[#1A3A6B]/10',
  green: 'text-green-600 bg-green-50',
};

export function SummaryCard({ titulo, valor, descricao, icone, cor = 'navy' }: SummaryCardProps) {
  return (
    <Card className="flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${corClasses[cor]}`}>
        {icone}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-[#BDBDBD] font-medium truncate">{titulo}</p>
        <p className="text-xl font-bold text-[#2C2C2C] truncate">{valor}</p>
        {descricao && <p className="text-xs text-[#BDBDBD]">{descricao}</p>}
      </div>
    </Card>
  );
}
