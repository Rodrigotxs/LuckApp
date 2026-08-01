import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Barbearia Luck',
  description: 'Tradição · Estilo · Precisão. Agendamento online.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // `maximumScale: 1` impedia o pinch-zoom no celular. Isso quebra a
  // WCAG 1.4.4 (redimensionamento de texto) e prejudica quem tem baixa
  // visão, que é justamente parte do público de uma barbearia de bairro.
  maximumScale: 5,
  userScalable: true,
  themeColor: '#C0392B',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
