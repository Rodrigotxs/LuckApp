'use client';

interface GoalProgressProps {
  metaMensal: number;
  faturamentoAtual: number;
  progresso: number;
}

export function GoalProgress({ metaMensal, faturamentoAtual, progresso }: GoalProgressProps) {
  const raio = 54;
  const circunferencia = 2 * Math.PI * raio;
  const dashOffset = circunferencia * (1 - progresso / 100);

  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-white rounded-xl border border-[#BDBDBD]/30 shadow-sm">
      <p className="font-bold text-[#1A3A6B] text-sm">Meta Mensal</p>
      <div className="relative">
        <svg width="140" height="140" className="-rotate-90">
          <circle cx="70" cy="70" r={raio} fill="none" stroke="#F5F5F5" strokeWidth="12" />
          <circle
            cx="70" cy="70" r={raio}
            fill="none"
            stroke={progresso >= 100 ? '#27AE60' : '#C0392B'}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circunferencia}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-[#2C2C2C]">{Math.round(progresso)}%</span>
          <span className="text-xs text-[#BDBDBD]">concluído</span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm text-[#2C2C2C]">
          <span className="font-bold text-[#C0392B]">
            R$ {faturamentoAtual.toFixed(2).replace('.', ',')}
          </span>
          {' '}de{' '}
          <span className="font-bold">
            R$ {metaMensal.toFixed(2).replace('.', ',')}
          </span>
        </p>
      </div>
    </div>
  );
}
