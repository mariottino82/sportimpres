import React from 'react';

// --- STAR GENERATION UTILITIES ---
function make5PointStar(cx: number, cy: number, rOut: number, rIn: number): string {
  let d = '';
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? rOut : rIn;
    const angle = (i * 36 - 90) * (Math.PI / 180);
    const x = (cx + r * Math.cos(angle)).toFixed(2);
    const y = (cy + r * Math.sin(angle)).toFixed(2);
    d += (i === 0 ? 'M ' : 'L ') + x + ' ' + y + ' ';
  }
  return d + 'Z';
}

// 12 Stars of the EU Flag
const EU_STARS_PATHS = (() => {
  const stars: string[] = [];
  const cx = 27;
  const cy = 18;
  const rRing = 11.5;
  for (let i = 0; i < 12; i++) {
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const sx = cx + rRing * Math.cos(angle);
    const sy = cy + rRing * Math.sin(angle);
    stars.push(make5PointStar(sx, sy, 2.2, 0.9));
  }
  return stars;
})();

// ==========================================
// 1. UNIONE EUROPEA / COFINANZIATO DALL'UE
// ==========================================
export interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'responsive';
}

export const LogoUnioneEuropea: React.FC<LogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
}) => {
  const isDark = variant === 'dark';

  const sizeClasses = {
    xs: 'h-6',
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    responsive: 'h-5 sm:h-8 md:h-10',
  };

  const textClasses = {
    xs: 'text-[9px] leading-[1.15]',
    sm: 'text-[11px] sm:text-[12px] leading-[1.15]',
    md: 'text-[11px] sm:text-[12px] leading-[1.15]',
    lg: 'text-xs sm:text-sm leading-[1.15]',
    responsive: 'text-[7.5px] sm:text-[11px] md:text-[12px] leading-[1.1]',
  };

  const gapClasses = {
    xs: 'gap-1.5',
    sm: 'gap-2',
    md: 'gap-2.5',
    lg: 'gap-3',
    responsive: 'gap-1 sm:gap-2 md:gap-2.5',
  };

  return (
    <div
      className={`inline-flex items-center ${gapClasses[size]} shrink-0 ${className}`}
      title="Cofinanziato dall'Unione europea"
    >
      {/* Official EU Flag */}
      <svg
        viewBox="0 0 54 36"
        className={`${sizeClasses[size]} w-auto aspect-[3/2] shrink-0 rounded-[1px] shadow-2xs`}
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect width="54" height="36" fill="#003399" />
        {EU_STARS_PATHS.map((d, i) => (
          <path key={i} d={d} fill="#FFCC00" />
        ))}
      </svg>

      {/* Official EU attribution text */}
      <div className="flex flex-col text-left select-none">
        <span
          className={`font-sans font-bold tracking-tight ${textClasses[size]} ${
            isDark ? 'text-white' : 'text-[#003399]'
          }`}
        >
          Cofinanziato
        </span>
        <span
          className={`font-sans font-bold tracking-tight ${textClasses[size]} ${
            isDark ? 'text-sky-200' : 'text-[#003399]'
          }`}
        >
          dall'Unione europea
        </span>
      </div>
    </div>
  );
};

// ==========================================
// 2. EMBLEMA DELLA REPUBBLICA ITALIANA
// ==========================================
export const LogoRepubblicaItaliana: React.FC<LogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
}) => {
  const sizeClasses = {
    xs: 'h-7',
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-14',
    responsive: 'h-5.5 sm:h-8 md:h-11',
  };

  return (
    <div
      className={`inline-flex items-center shrink-0 ${className}`}
      title="Repubblica Italiana"
    >
      <img
        src="/repubblica-italiana.svg"
        alt="Emblema della Repubblica Italiana"
        className={`${sizeClasses[size]} w-auto aspect-[710/808] object-contain shrink-0 drop-shadow-sm select-none`}
        loading="eager"
      />
    </div>
  );
};

// ==========================================
// 3. STEMMA UFFICIALE REGIONE MOLISE
// ==========================================
export const LogoRegioneMolise: React.FC<LogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
}) => {
  const sizeClasses = {
    xs: 'h-7',
    sm: 'h-9',
    md: 'h-11',
    lg: 'h-14',
    responsive: 'h-5.5 sm:h-8 md:h-11',
  };

  return (
    <div
      className={`inline-flex items-center shrink-0 ${className}`}
      title="Regione Molise"
    >
      <svg
        viewBox="0 0 237 254"
        className={`${sizeClasses[size]} w-auto aspect-[237/254] shrink-0 drop-shadow-sm select-none`}
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Scudo sannitico rosso con bordo argento */}
        <path
          d="m 6,7 8.6e-5,32.891628 C 6.0388438,98.466249 19.201531,216.47157 118.5,247.5 217.79964,216.47121 230.96146,98.46346 230.99992,39.889551 L 231,7"
          fill="#d71919"
          stroke="#bebebe"
          strokeWidth="12"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeMiterlimit="4"
        />
        {/* Stella d'argento a 8 punte in alto a sinistra */}
        <path
          d="m -94.826052,21.417974 -17.425228,-5.836683 -8.19434,16.448654 -8.19434,-16.448653 -17.42522,5.836682 5.83668,-17.4252263 -16.44865,-8.1943391 16.44865,-8.1943376 -5.83668,-17.425228 17.42522,5.836683 8.19434,-16.448654 8.19434,16.448653 17.425228,-5.836682 -5.836688,17.425226 16.448659,8.1943394 -16.448649,8.1943376 z"
          transform="matrix(0.81472105,0,0,0.81355632,150.27719,54.56679)"
          fill="#bebebe"
          fillRule="evenodd"
        />
        {/* Banda diagonale d'argento */}
        <path
          d="M 203.45367,11.23086 36.930294,170.18169 c 6.87661,15.95951 15.58882,30.36494 26.635463,41.18288 L 228.75091,53.68845 228.08243,11.861158 z"
          fill="#bebebe"
          fillRule="evenodd"
        />
        {/* Bordo superiore d'argento */}
        <rect
          x="0.0427"
          y="0.4998"
          width="236.933"
          height="12"
          fill="#bebebe"
          fillRule="evenodd"
        />
      </svg>
    </div>
  );
};

// ==========================================
// 4. SVILUPPO ITALIA MOLISE
// ==========================================
export const LogoSviluppoItalia: React.FC<LogoProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
}) => {
  const isDark = variant === 'dark';

  const textSizes = {
    xs: { main: 'text-sm', sub: 'text-[9px]' },
    sm: { main: 'text-base', sub: 'text-[10px]' },
    md: { main: 'text-xl sm:text-2xl', sub: 'text-xs' },
    lg: { main: 'text-2xl sm:text-3xl', sub: 'text-sm' },
    responsive: {
      main: 'text-[11px] sm:text-lg md:text-2xl',
      sub: 'text-[7.5px] sm:text-[10px] md:text-xs',
    },
  };

  return (
    <div
      className={`inline-flex flex-col leading-none shrink-0 select-none ${className}`}
      title="Sviluppo Italia Molise S.p.A."
    >
      <div className="flex items-baseline tracking-tight">
        <span
          className={`font-serif font-normal ${
            isDark ? 'text-white' : 'text-slate-900'
          } ${textSizes[size].main}`}
        >
          Sviluppo
        </span>
        <span
          className={`font-serif font-normal text-[#00A0E2] ml-0.5 ${textSizes[size].main}`}
        >
          Italia
        </span>
      </div>
      <span
        className={`font-sans font-medium tracking-normal mt-0.5 ${
          isDark ? 'text-slate-300' : 'text-slate-800'
        } ${textSizes[size].sub}`}
      >
        Molise
      </span>
    </div>
  );
};

// ==========================================
// 5. BANNER / STRIP ISTITUZIONALE COMPLETO
// ==========================================
interface InstitutionalLogosStripProps {
  className?: string;
  variant?: 'light' | 'dark';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'responsive';
  showDividers?: boolean;
}

export const InstitutionalLogosStrip: React.FC<InstitutionalLogosStripProps> = ({
  className = '',
  variant = 'light',
  size = 'md',
  showDividers = true,
}) => {
  const isDark = variant === 'dark';
  const dividerClass = isDark ? 'border-slate-800' : 'border-slate-300/80';
  const isResponsive = size === 'responsive';

  const dividerHeight = isResponsive
    ? 'h-5 sm:h-7 md:h-9'
    : size === 'xs'
    ? 'h-6'
    : size === 'sm'
    ? 'h-8'
    : size === 'lg'
    ? 'h-12'
    : 'h-9';

  return (
    <div
      className={`flex items-center flex-nowrap ${
        isResponsive
          ? 'justify-between sm:justify-start w-full gap-1.5 sm:gap-5 md:gap-6 py-0.5 sm:py-1 overflow-hidden'
          : 'overflow-x-auto no-scrollbar gap-4 sm:gap-6 py-1'
      } ${className}`}
    >
      {/* 1. Cofinanziato dall'Unione Europea */}
      <div className="shrink-0 flex items-center">
        <LogoUnioneEuropea variant={variant} size={size} />
      </div>

      {showDividers && (
        <div className={`${dividerHeight} border-r ${dividerClass} shrink-0`} />
      )}

      {/* 2. Repubblica Italiana */}
      <div className="shrink-0 flex items-center">
        <LogoRepubblicaItaliana variant={variant} size={size} />
      </div>

      {showDividers && (
        <div className={`${dividerHeight} border-r ${dividerClass} shrink-0`} />
      )}

      {/* 3. Regione Molise */}
      <div className="shrink-0 flex items-center">
        <LogoRegioneMolise variant={variant} size={size} />
      </div>

      {showDividers && (
        <div className={`${dividerHeight} border-r ${dividerClass} shrink-0`} />
      )}

      {/* 4. Sviluppo Italia Molise */}
      <div className="shrink-0 flex items-center">
        <LogoSviluppoItalia variant={variant} size={size} />
      </div>
    </div>
  );
};

// ==========================================
// 6. TOP INSTITUTIONAL BAR
// ==========================================
export const InstitutionalBanner: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <header
      className={`w-full bg-white border-b border-slate-200 py-1 sm:py-2 px-2.5 sm:px-6 shadow-2xs overflow-hidden select-none ${className}`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full min-w-0">
        {/* The 4 Official Logos side by side as in the institutional guideline */}
        <div className="w-full min-w-0 flex items-center overflow-hidden">
          <InstitutionalLogosStrip size="responsive" className="w-full" />
        </div>

        {/* PR Molise FESR FSE+ Attribution */}
        <div className="hidden xl:flex flex-col items-end text-right text-[10px] text-slate-500 font-medium leading-tight shrink-0">
          <span className="font-semibold text-slate-700 uppercase tracking-wider">
            PR Molise FESR FSE+ 2021-2027
          </span>
          <span className="text-slate-500">
            Azione 1.4.2 • CUP J19B25000190009
          </span>
        </div>
      </div>
    </header>
  );
};
