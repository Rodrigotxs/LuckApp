import { BottomNav } from '@/components/layout/BottomNav';

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F5F5] pb-20">
      {children}
      <BottomNav />
    </div>
  );
}
