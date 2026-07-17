'use client';

import { InputHTMLAttributes, useState } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  const [focused, setFocused] = useState(false);
  const hasValue = props.value !== '' && props.value !== undefined;

  return (
    <div className="relative w-full">
      <input
        {...props}
        onFocus={(e) => { setFocused(true); props.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); props.onBlur?.(e); }}
        className={`
          peer w-full px-4 pt-5 pb-2
          border-2 rounded-lg outline-none
          bg-white text-[#2C2C2C]
          transition-all duration-150
          ${focused ? 'border-[#C0392B]' : error ? 'border-red-400' : 'border-[#BDBDBD]'}
          ${className}
        `}
        placeholder=" "
      />
      <label
        className={`
          absolute left-4 top-3.5 text-sm pointer-events-none
          transition-all duration-150
          ${focused || hasValue
            ? 'top-1.5 text-xs font-semibold ' + (focused ? 'text-[#C0392B]' : 'text-[#BDBDBD]')
            : 'text-[#BDBDBD]'
          }
        `}
      >
        {label}
      </label>
      {error && (
        <p className="mt-1 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}
