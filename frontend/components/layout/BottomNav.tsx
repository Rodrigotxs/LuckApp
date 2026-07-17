'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, DollarSign, Users, Settings } from 'lucide-react';

const tabs = [
  { href: '/painel', label: 'Agenda', icon: Calendar },
  { href: '/painel/financeiro', label: 'Financeiro', icon: DollarSign },
  { href: '/painel/clientes', label: 'Clientes', icon: Users },
  { href: '/painel/configuracoes', label: 'Config.', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-[#BDBDBD]/30 shadow-lg">
      <div className="max-w-lg mx-auto px-2 flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const ativo = pathname === href || (href !== '/painel' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`
                flex-1 flex flex-col items-center justify-center py-3 gap-0.5
                transition-colors duration-150
                ${ativo ? 'text-[#C0392B]' : 'text-[#BDBDBD] hover:text-[#2C2C2C]'}
              `}
            >
              <Icon size={22} strokeWidth={ativo ? 2.5 : 1.8} />
              <span className={`text-[10px] font-${ativo ? 'bold' : 'medium'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
