import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  variant?: 'light' | 'dark';
}

export const LogoMark: React.FC<{
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}> = ({ size = 'md', className = '' }) => {
  const iconSizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return (
    <svg
      viewBox="0 0 280 280"
      className={`${iconSizes[size]} shrink-0 transition-transform duration-300 hover:scale-105 ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Official SPORTELLO IMPRESE 6-Droplet Vector Logo Mark */}
      {/* 1. Goccia Viola (Apice Superiore) */}
      <path
        d="M 116 114 C 110 94, 102 76, 102 54 C 102 32, 120 16, 142 16 C 164 16, 182 32, 182 54 C 182 76, 160 94, 116 114 Z"
        fill="#7E29C3"
      />

      {/* 2. Goccia Azzurra (Centro-Sinistra) */}
      <path
        d="M 125 112 C 116 124, 106 134, 94 134 C 79 134, 68 146, 68 162 C 68 178, 79 190, 94 190 C 108 190, 121 178, 121 162 C 121 148, 124 130, 125 112 Z"
        fill="#00A3FF"
      />

      {/* 3. Goccia Arancione (Centro-Destra) */}
      <path
        d="M 186 186 C 180 172, 174 158, 176 144 C 178 128, 166 114, 150 114 C 134 114, 124 128, 126 144 C 128 158, 146 172, 186 186 Z"
        fill="#FA7E1E"
      />

      {/* 4. Goccia Rossa (Basso-Destra) */}
      <path
        d="M 188 166 C 196 186, 188 202, 188 220 C 188 242, 206 258, 226 258 C 246 258, 264 242, 264 220 C 264 198, 248 180, 188 166 Z"
        fill="#F03C15"
      />

      {/* 5. Goccia Gialla (Centro-Basso) */}
      <path
        d="M 100 214 C 116 208, 132 198, 148 196 C 164 194, 178 206, 178 222 C 178 238, 164 248, 148 246 C 132 244, 116 228, 100 214 Z"
        fill="#FFC200"
      />

      {/* 6. Goccia Verde (Basso-Sinistra) */}
      <path
        d="M 114 224 C 96 226, 80 238, 64 252 C 48 266, 28 256, 20 236 C 12 216, 24 190, 48 186 C 72 182, 98 204, 114 224 Z"
        fill="#00B368"
      />
    </svg>
  );
};

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = false,
  className = '',
  variant = 'light'
}) => {
  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl',
  };

  const isDark = variant === 'dark';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Official 3-Blade Interconnected Twisted Droplets Mark */}
      <LogoMark size={size} />

      <div className="flex flex-col leading-none">
        <span
          className={`font-extrabold uppercase tracking-tight font-display ${
            isDark ? 'text-white' : 'text-slate-800'
          } ${textSizes[size]}`}
        >
          SPORTELLO
        </span>
        <span
          className={`font-black uppercase tracking-tight font-display ${
            isDark ? 'text-slate-100' : 'text-slate-950'
          } ${textSizes[size]}`}
        >
          IMPRESE
        </span>
        {showSubtitle && (
          <div className="mt-1 flex items-center">
            <img
              src="/sviluppo-molise-logo-fb.png"
              alt="Sviluppo Italia Molise"
              className={`h-3.5 sm:h-4.5 w-auto object-contain shrink-0 select-none ${
                isDark ? 'brightness-0 invert opacity-90' : ''
              }`}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export {
  LogoUnioneEuropea,
  LogoRepubblicaItaliana,
  LogoRegioneMolise,
  LogoCoesioneItalia,
  LogoSviluppoItalia,
  InstitutionalLogosStrip,
  InstitutionalBanner,
} from './InstitutionalLogos';
