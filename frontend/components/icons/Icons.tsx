import { CSSProperties, ReactNode } from 'react';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: CSSProperties;
}

const Icon = ({ children, size = 20, color = 'currentColor', strokeWidth = 1.5, style }: IconProps & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
    strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={style}>
    {children}
  </svg>
);

export const IconScissors = (p: IconProps) => <Icon {...p}>
  <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" />
  <line x1="20" y1="4" x2="8.12" y2="15.88" /><line x1="14.47" y1="14.48" x2="20" y2="20" /><line x1="8.12" y1="8.12" x2="12" y2="12" />
</Icon>;

export const IconRazor = (p: IconProps) => <Icon {...p}>
  <path d="M14 4l6 6-9 9-6-6 9-9z" /><path d="M5 13l6 6" /><path d="M9 9l6 6" />
</Icon>;

export const IconCombo = (p: IconProps) => <Icon {...p}>
  <rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="8" rx="1.5" />
  <rect x="3" y="13" width="8" height="8" rx="1.5" /><rect x="13" y="13" width="8" height="8" rx="1.5" />
</Icon>;

export const IconBeard = (p: IconProps) => <Icon {...p}>
  <path d="M5 8c0-3 3-5 7-5s7 2 7 5v3c0 5-3 9-7 9s-7-4-7-9V8z" />
  <path d="M9 11h.01M15 11h.01" />
</Icon>;

export const IconHair = (p: IconProps) => <Icon {...p}>
  <path d="M4 13c0-5 3.5-9 8-9s8 4 8 9" /><path d="M4 13v3M20 13v3" />
  <path d="M4 16c2 1 4 1 4-2M20 16c-2 1-4 1-4-2M12 13v3" />
</Icon>;

export const IconChild = (p: IconProps) => <Icon {...p}>
  <circle cx="12" cy="8" r="4" /><path d="M5 21v-1a7 7 0 0114 0v1" />
</Icon>;

export const IconClock = (p: IconProps) => <Icon {...p}>
  <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15 14" />
</Icon>;

export const IconChevron = (p: IconProps) => <Icon {...p}>
  <polyline points="9 6 15 12 9 18" />
</Icon>;

export const IconChevronLeft = (p: IconProps) => <Icon {...p}>
  <polyline points="15 6 9 12 15 18" />
</Icon>;

export const IconChevronDown = (p: IconProps) => <Icon {...p}>
  <polyline points="6 9 12 15 18 9" />
</Icon>;

export const IconCheck = (p: IconProps) => <Icon {...p}>
  <polyline points="20 6 9 17 4 12" />
</Icon>;

export const IconCalendar = (p: IconProps) => <Icon {...p}>
  <rect x="3" y="5" width="18" height="16" rx="2" /><line x1="3" y1="10" x2="21" y2="10" />
  <line x1="8" y1="3" x2="8" y2="7" /><line x1="16" y1="3" x2="16" y2="7" />
</Icon>;

export const IconUser = (p: IconProps) => <Icon {...p}>
  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" />
</Icon>;

export const IconHome = (p: IconProps) => <Icon {...p}>
  <path d="M3 11l9-8 9 8" /><path d="M5 9v12h14V9" />
</Icon>;

export const IconChart = (p: IconProps) => <Icon {...p}>
  <line x1="3" y1="20" x2="21" y2="20" /><polyline points="5 15 9 11 13 14 19 6" />
  <polyline points="14 6 19 6 19 11" />
</Icon>;

export const IconWhatsapp = ({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.65-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.91-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35z"/>
    <path d="M20.52 3.48A11.86 11.86 0 0012.05 0C5.5 0 .17 5.32.16 11.87c0 2.09.55 4.13 1.6 5.93L.06 24l6.36-1.67a11.9 11.9 0 005.63 1.43h.01c6.55 0 11.88-5.32 11.9-11.87a11.8 11.8 0 00-3.44-8.4zm-8.47 18.27h-.01a9.87 9.87 0 01-5.03-1.38l-.36-.21-3.77.99 1-3.67-.24-.38a9.85 9.85 0 01-1.51-5.24C2.13 6.44 6.5 2.06 11.86 2.06c2.63 0 5.1 1.03 6.96 2.89a9.78 9.78 0 012.88 6.94c0 5.42-4.42 9.86-9.65 9.86z"/>
  </svg>
);

export const IconBell = (p: IconProps) => <Icon {...p}>
  <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.7 21a2 2 0 01-3.4 0" />
</Icon>;

export const IconPlus = (p: IconProps) => <Icon {...p}>
  <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
</Icon>;

export const IconArrow = (p: IconProps) => <Icon {...p}>
  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
</Icon>;

export const IconTrending = (p: IconProps) => <Icon {...p}>
  <polyline points="3 17 9 11 13 15 21 7" /><polyline points="14 7 21 7 21 14" />
</Icon>;

export const IconPhone = (p: IconProps) => <Icon {...p}>
  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.13.96.36 1.9.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0122 16.92z" />
</Icon>;

export const IconMore = (p: IconProps) => <Icon {...p}>
  <circle cx="12" cy="12" r="1" fill="currentColor" /><circle cx="19" cy="12" r="1" fill="currentColor" /><circle cx="5" cy="12" r="1" fill="currentColor" />
</Icon>;

export const IconStar = (p: IconProps) => <Icon {...p}>
  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
</Icon>;

export const IconEdit = (p: IconProps) => <Icon {...p}>
  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z" />
</Icon>;

export const IconLocation = (p: IconProps) => <Icon {...p}>
  <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
</Icon>;

export const IconBlock = (p: IconProps) => <Icon {...p}>
  <circle cx="12" cy="12" r="9"/><line x1="7" y1="17" x2="17" y2="7"/>
</Icon>;

export const IconDownload = (p: IconProps) => <Icon {...p}>
  <path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>
</Icon>;

export const IconMail = (p: IconProps) => <Icon {...p}>
  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 6-10 7L2 6"/>
</Icon>;

// Mapa por nome (para os serviços vindos do backend/mock)
export const iconByName: Record<string, (p: IconProps) => any> = {
  IconScissors, IconRazor, IconCombo, IconBeard, IconHair, IconChild,
};
