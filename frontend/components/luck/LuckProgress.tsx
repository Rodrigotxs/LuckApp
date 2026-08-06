interface LuckProgressProps {
  step: number;
  total: number;
  label: string;
}

export function LuckProgress({ step, total, label }: LuckProgressProps) {
  return (
    <div style={{ padding: '4px 18px 6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div className="lk-eyebrow" style={{ fontSize: 9.5 }}>{label}</div>
        <div className="lk-mono" style={{ fontSize: 10, color: '#999' }}>
          <span style={{ color: 'var(--red)', fontWeight: 700 }}>{String(step).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i < step ? 'var(--red)' : 'var(--gray-soft)',
          }} />
        ))}
      </div>
    </div>
  );
}
