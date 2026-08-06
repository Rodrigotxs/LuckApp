'use client';

import { IconCheck } from '../icons/Icons';

type FieldState = 'idle' | 'focus' | 'filled' | 'error' | 'success';

interface LuckFieldProps {
  label: string;
  value?: string;
  placeholder?: string;
  state?: FieldState;
  help?: string;
  mono?: boolean;
  editable?: boolean;
  onChange?: (value: string) => void;
  type?: string;
}

const borderColorMap: Record<FieldState, string> = {
  idle: 'var(--gray-soft)',
  focus: 'var(--red)',
  filled: 'var(--gray-soft)',
  error: '#c0392b',
  success: '#2e7d32',
};

export function LuckField({ label, value, placeholder, state = 'idle', help, mono, editable, onChange, type = 'text' }: LuckFieldProps) {
  // "success" e "filled" só fazem sentido se realmente houver valor.
  // Sem valor, colapsa para "idle" — evita check verde em campo vazio.
  const efetivo: FieldState = !value && (state === 'success' || state === 'filled') ? 'idle' : state;
  const borderColor = borderColorMap[efetivo];

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{
        fontSize: 10.5, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase',
        fontWeight: 700, display: 'block', marginBottom: 6,
      }}>
        {label}
      </label>
      <div style={{
        background: 'var(--bg2)', border: `1.5px solid ${borderColor}`, borderRadius: 10,
        padding: '13px 14px', display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: efetivo === 'focus' ? '0 0 0 3px var(--red-soft)' : 'none',
      }}>
        {editable ? (
          <input
            type={type}
            className={mono ? 'lk-mono' : ''}
            value={value || ''}
            placeholder={placeholder}
            onChange={(e) => onChange && onChange(e.target.value)}
            style={{
              flex: 1, fontSize: 14, color: 'var(--ink)', fontWeight: 500,
              background: 'transparent', border: 'none', outline: 'none',
              fontFamily: 'inherit', padding: 0,
            }}
          />
        ) : (
          <span className={mono ? 'lk-mono' : ''} style={{
            flex: 1, fontSize: 14, color: value ? 'var(--ink)' : '#aaa', fontWeight: value ? 500 : 400,
          }}>
            {value || placeholder}
            {efetivo === 'focus' && (
              <span style={{
                display: 'inline-block', width: 1.5, height: 15, background: 'var(--red)',
                marginLeft: 1, marginBottom: -3, animation: 'lk-blink 1s step-end infinite',
              }} />
            )}
          </span>
        )}
        {efetivo === 'success' && <IconCheck size={16} color="#2e7d32" strokeWidth={2.5} />}
      </div>
      {help && (
        <div style={{ fontSize: 10.5, marginTop: 6, color: efetivo === 'error' ? 'var(--red)' : '#999' }}>
          {help}
        </div>
      )}
    </div>
  );
}
