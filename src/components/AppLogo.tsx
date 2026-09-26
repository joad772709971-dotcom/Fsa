import React from 'react';

interface AppLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  subTitle?: string;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showText = false,
  className = '',
  subTitle
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6', svg: 24, text: 'text-xs', sub: 'text-[9px]' },
    sm: { box: 'w-8 h-8', svg: 32, text: 'text-sm', sub: 'text-[10px]' },
    md: { box: 'w-10 h-10', svg: 40, text: 'text-base', sub: 'text-xs' },
    lg: { box: 'w-14 h-14', svg: 56, text: 'text-xl', sub: 'text-xs' },
    xl: { box: 'w-20 h-20', svg: 80, text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div 
        className={`${currentSize.box} shrink-0 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-emerald-950 p-1 border border-cyan-500/40 shadow-lg shadow-indigo-950/50 flex items-center justify-center relative overflow-hidden group`}
      >
        {/* Ambient Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/10 via-emerald-500/20 to-amber-500/20 opacity-70 group-hover:opacity-100 transition-opacity" />
        
        {/* High-definition Vector Icon for Nesma Nomow */}
        <svg 
          viewBox="0 0 100 100" 
          className="w-full h-full relative z-10 drop-shadow-md"
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="logoPhoneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>
            <linearGradient id="logoGrowthGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FDE047" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
          </defs>

          {/* Smartphone Frame */}
          <rect 
            x="20" 
            y="12" 
            width="60" 
            height="76" 
            rx="12" 
            stroke="url(#logoPhoneGrad)" 
            strokeWidth="4" 
            fill="#0F172A" 
          />

          {/* Speaker / Camera */}
          <circle cx="50" cy="19" r="2" fill="#64748B" />
          <rect x="42" y="18" width="16" height="2" rx="1" fill="#475569" />

          {/* Growth Bars & Curves (Nomow Growth Symbol) */}
          <path 
            d="M32 68 L32 54 M44 68 L44 42 M56 68 L56 32 M68 68 L68 24" 
            stroke="url(#logoGrowthGrad)" 
            strokeWidth="4" 
            strokeLinecap="round" 
          />

          {/* Growth Trend Arrow */}
          <path 
            d="M30 54 L44 40 L56 30 L70 20" 
            stroke="url(#logoGold)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />
          <path 
            d="M62 20 L70 20 L70 28" 
            stroke="url(#logoGold)" 
            strokeWidth="3.5" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
          />

          {/* Arabic Dot (نقطة النون) */}
          <circle cx="50" cy="78" r="3.5" fill="url(#logoGold)" />
        </svg>
      </div>

      {showText && (
        <div className="leading-tight select-none">
          <div className={`font-black text-white ${currentSize.text} tracking-tight flex items-center gap-1.5`}>
            <span className="bg-gradient-to-r from-amber-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">نمو</span>
            <span className="text-slate-200">لخدمات الجوالات</span>
          </div>
          <p className={`${currentSize.sub} text-slate-400 font-semibold truncate`}>
            {subTitle || 'أنظمة وحسابات الجوالات والصيانة ⚡'}
          </p>
        </div>
      )}
    </div>
  );
};
