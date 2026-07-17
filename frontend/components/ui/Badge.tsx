type BadgeVariant = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'PENDING' | 'PAID';

interface BadgeProps {
  variant: BadgeVariant;
  className?: string;
}

const badgeConfig: Record<BadgeVariant, { label: string; classes: string }> = {
  SCHEDULED:  { label: 'Agendado',   classes: 'bg-blue-50 text-blue-700 border border-blue-200' },
  CONFIRMED:  { label: 'Confirmado', classes: 'bg-green-50 text-green-700 border border-green-200' },
  COMPLETED:  { label: 'Concluído',  classes: 'bg-[#1A3A6B]/10 text-[#1A3A6B] border border-[#1A3A6B]/20' },
  CANCELLED:  { label: 'Cancelado',  classes: 'bg-red-50 text-red-700 border border-red-200' },
  NO_SHOW:    { label: 'Faltou',     classes: 'bg-orange-50 text-orange-700 border border-orange-200' },
  PENDING:    { label: 'Pendente',   classes: 'bg-yellow-50 text-yellow-700 border border-yellow-200' },
  PAID:       { label: 'Pago',       classes: 'bg-green-50 text-green-700 border border-green-200' },
};

export function Badge({ variant, className = '' }: BadgeProps) {
  const config = badgeConfig[variant] || badgeConfig.SCHEDULED;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.classes} ${className}`}>
      {config.label}
    </span>
  );
}
