interface LuckLogoProps {
  size?: number;
}

export function LuckLogo({ size = 40 }: LuckLogoProps) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
      background: '#F0EEE6', display: 'grid', placeItems: 'center',
    }}>
      <img src="/assets/logo-luck.png" alt="Barbearia Luck" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}
