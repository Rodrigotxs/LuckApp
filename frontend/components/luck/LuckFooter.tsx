import { ReactNode } from 'react';

interface LuckFooterProps {
  children: ReactNode;
}

export function LuckFooter({ children }: LuckFooterProps) {
  return (
    <div style={{
      position: 'sticky', bottom: 0, left: 0, right: 0,
      padding: '14px 18px 28px',
      background: 'linear-gradient(to top, white 70%, transparent)',
      zIndex: 30,
    }}>
      {children}
    </div>
  );
}
