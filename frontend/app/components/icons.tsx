import type { ReactNode } from "react";

type IconProps = { size?: number; color?: string; className?: string };

const IconGlyph = ({ size = 18, color = "currentColor", className = "", children }: IconProps & { children: ReactNode }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    {children}
  </svg>
);

export const Activity = (props: IconProps) => <IconGlyph {...props}><path d="M3 12h4l2-6 4 12 2-6h6" /></IconGlyph>;
export const ArrowRight = (props: IconProps) => <IconGlyph {...props}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></IconGlyph>;
export const ArrowSquareOut = (props: IconProps) => <IconGlyph {...props}><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" /></IconGlyph>;
export const Brain = (props: IconProps) => <IconGlyph {...props}><path d="M9 4a3 3 0 0 0-3 3v1a3 3 0 0 0 0 6v1a3 3 0 0 0 5 2" /><path d="M15 4a3 3 0 0 1 3 3v1a3 3 0 0 1 0 6v1a3 3 0 0 1-5 2" /><path d="M12 5v14" /></IconGlyph>;
export const ChartLineUp = (props: IconProps) => <IconGlyph {...props}><path d="M4 19h16" /><path d="M5 15l4-4 3 3 7-8" /></IconGlyph>;
export const Check = (props: IconProps) => <IconGlyph {...props}><path d="M20 6 9 17l-5-5" /></IconGlyph>;
export const CheckCircle = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></IconGlyph>;
export const Clock = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></IconGlyph>;
export const Coins = (props: IconProps) => <IconGlyph {...props}><ellipse cx="12" cy="6" rx="7" ry="3" /><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" /><path d="M5 12v4c0 1.7 3.1 3 7 3s7-1.3 7-3v-4" /></IconGlyph>;
export const DownloadSimple = (props: IconProps) => <IconGlyph {...props}><path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" /></IconGlyph>;
export const Funnel = (props: IconProps) => <IconGlyph {...props}><path d="M4 5h16l-6 7v5l-4 2v-7L4 5Z" /></IconGlyph>;
export const Gauge = (props: IconProps) => <IconGlyph {...props}><path d="M5 19a9 9 0 1 1 14 0" /><path d="m12 13 4-4" /></IconGlyph>;
export const GitBranch = (props: IconProps) => <IconGlyph {...props}><circle cx="6" cy="5" r="2" /><circle cx="18" cy="19" r="2" /><circle cx="6" cy="19" r="2" /><path d="M6 7v10" /><path d="M8 19h6a4 4 0 0 0 4-4V7" /></IconGlyph>;
export const GraduationCap = (props: IconProps) => <IconGlyph {...props}><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></IconGlyph>;
export const Lightning = (props: IconProps) => <IconGlyph {...props}><path d="M13 2 4 14h7l-1 8 10-13h-7l0-7Z" /></IconGlyph>;
export const Loader2 = (props: IconProps) => <IconGlyph {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56" /></IconGlyph>;
export const Medal = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="14" r="5" /><path d="M9 2h6l2 6-5 2-5-2 2-6Z" /></IconGlyph>;
export const PlugsConnected = (props: IconProps) => <IconGlyph {...props}><path d="M8 7V3" /><path d="M16 7V3" /><path d="M6 7h12v4a6 6 0 0 1-12 0V7Z" /><path d="M12 17v4" /></IconGlyph>;
export const Plus = (props: IconProps) => <IconGlyph {...props}><path d="M12 5v14" /><path d="M5 12h14" /></IconGlyph>;
export const ShieldCheck = (props: IconProps) => <IconGlyph {...props}><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" /><path d="m8.5 12 2 2 5-5" /></IconGlyph>;
export const ShoppingCart = (props: IconProps) => <IconGlyph {...props}><circle cx="8" cy="21" r="1" /><circle cx="19" cy="21" r="1" /><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" /></IconGlyph>;
export const Sparkle = (props: IconProps) => <IconGlyph {...props}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" /><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z" /></IconGlyph>;
export const TrendUp = (props: IconProps) => <IconGlyph {...props}><path d="M4 17 10 11l4 4 6-8" /><path d="M14 7h6v6" /></IconGlyph>;
export const Trophy = (props: IconProps) => <IconGlyph {...props}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></IconGlyph>;
export const Users = (props: IconProps) => <IconGlyph {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></IconGlyph>;
export const UsersThree = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="8" r="3" /><path d="M6 20a6 6 0 0 1 12 0" /><path d="M4 10a2 2 0 0 0 0 4" /><path d="M20 10a2 2 0 0 1 0 4" /></IconGlyph>;
export const Vote = (props: IconProps) => <IconGlyph {...props}><path d="M22 11.5V10a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v1.5" /><path d="M2 14.5h20" /><path d="M6 14.5V18a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-3.5" /><path d="M18 6 20 8" /><path d="m18 6-2 2" /></IconGlyph>;
export const Wallet = (props: IconProps) => <IconGlyph {...props}><path d="M4 7h16v12H4a2 2 0 0 1-2-2V7a3 3 0 0 1 3-3h13" /><path d="M16 13h4" /></IconGlyph>;
export const X = (props: IconProps) => <IconGlyph {...props}><path d="M18 6 6 18" /><path d="m6 6 12 12" /></IconGlyph>;
export const Alert = (props: IconProps) => <IconGlyph {...props}><path d="M12 9v4" /><path d="M12 17h.01" /><path d="M10.3 4.2 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" /></IconGlyph>;
export const AlertCircle = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="12" r="9" /><path d="M12 8v4" /><path d="M12 16h.01" /></IconGlyph>;export const Search = (props: IconProps) => <IconGlyph {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></IconGlyph>;
export const ChevronRight = (props: IconProps) => <IconGlyph {...props}><path d="m9 18 6-6-6-6" /></IconGlyph>;
export const Menu = (props: IconProps) => <IconGlyph {...props}><path d="M4 12h16" /><path d="M4 6h16" /><path d="M4 18h16" /></IconGlyph>;
export const Bot = (props: IconProps) => <IconGlyph {...props}><rect width="18" height="11" x="3" y="11" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v2" /><path d="M8 16a4 4 0 1 1 8 0" /></IconGlyph>;
export const ShoppingBag = (props: IconProps) => <IconGlyph {...props}><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></IconGlyph>;
export const Zap = (props: IconProps) => <IconGlyph {...props}><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" /></IconGlyph>;
export const Compass = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="12" r="9" /><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" /></IconGlyph>;
export const ChevronDown = (props: IconProps) => <IconGlyph {...props}><path d="m6 9 6 6 6-6" /></IconGlyph>;
export const Globe = (props: IconProps) => <IconGlyph {...props}><circle cx="12" cy="12" r="9" /><path d="M12 3a14.5 14.5 0 0 0 0 18" /><path d="M3 12h18" /></IconGlyph>;
