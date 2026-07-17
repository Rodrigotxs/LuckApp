'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Scissors } from 'lucide-react';

export default function AgendarIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const ownerId = sessionStorage.getItem('agendar_ownerId');
    if (ownerId) router.replace(`/agendar/${ownerId}`);
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-[#1A3A6B] rounded-full flex items-center justify-center mx-auto">
          <Scissors size={28} className="text-white" />
        </div>
        <p className="text-[#2C2C2C] font-semibold">Barbearia Luck</p>
        <p className="text-[#BDBDBD] text-sm">Use o link da barbearia para agendar seu horário.</p>
      </div>
    </div>
  );
}
