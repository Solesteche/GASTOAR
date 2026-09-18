import React from 'react';

interface GastoArLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showAccentBar?: boolean;
  variant?: 'light' | 'dark' | 'full-color';
  className?: string;
  iconOnly?: boolean;
}

/**
 * GastoAR Icon - Oficial:
 * Logo oficial con gradiente violeta/fucsia a naranja cálido,
 * 'G' estilizada con carita sonriente blanca.
 */
export const GastoArIcon: React.FC<{ size?: number | string; className?: string }> = ({ 
  size = 40,
  className = ''
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const radius = typeof size === 'number' ? `${Math.round(size * 0.28)}px` : '28%';

  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center select-none overflow-hidden shadow-md group ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderRadius: radius,
        background: 'linear-gradient(135deg, #4A0E78 0%, #7E22CE 30%, #D946EF 60%, #F97316 100%)',
        boxShadow: '0 4px 16px -2px rgba(168, 85, 247, 0.45), 0 2px 8px -1px rgba(249, 115, 22, 0.35)',
      }}
    >
      <img
        src="/logo.png"
        alt="GastoAR Logo"
        className="w-full h-full object-cover select-none pointer-events-none"
        referrerPolicy="no-referrer"
        onError={(e) => {
          (e.currentTarget as HTMLElement).style.display = 'none';
        }}
      />
      {/* SVG vector fallback with exact geometry */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-[74%] h-[74%] absolute inset-0 m-auto -z-10"
      >
        {/* Outer Circular 'G' track with horizontal spur */}
        <path
          d="M 68 30 A 28 28 0 1 0 78 50 L 63 50"
          stroke="#FFFFFF"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center dot */}
        <circle cx="51" cy="41" r="5" fill="#FFFFFF" />

        {/* Center smiling mouth curve */}
        <path
          d="M 44 56.5 Q 51 63.5 58 56.5"
          stroke="#FFFFFF"
          strokeWidth="4.8"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
    </div>
  );
};

/**
 * GastoAR Complete Brand Logo
 * Includes Icon + "GastoAR" (Crisp White in Dark Mode / Deep Plum #2E0854 in Light Mode)
 * + Tagline "Registra, Controla, Ahorra" + Violet Accent Bar
 */
export const GastoArBrand: React.FC<GastoArLogoProps> = ({
  size = 'md',
  showTagline = true,
  showAccentBar = true,
  variant = 'light',
  className = '',
  iconOnly = false,
}) => {
  const config = {
    sm: {
      iconSize: 28,
      textSize: 'text-base',
      taglineSize: 'text-[9.5px]',
      barWidth: 'w-7',
      barHeight: 'h-0.5',
      gap: 'gap-2',
    },
    md: {
      iconSize: 38,
      textSize: 'text-xl',
      taglineSize: 'text-[11.5px]',
      barWidth: 'w-9',
      barHeight: 'h-1',
      gap: 'gap-3',
    },
    lg: {
      iconSize: 52,
      textSize: 'text-3xl',
      taglineSize: 'text-xs sm:text-sm',
      barWidth: 'w-14',
      barHeight: 'h-1',
      gap: 'gap-3.5',
    },
    xl: {
      iconSize: 84,
      textSize: 'text-4xl sm:text-5xl',
      taglineSize: 'text-sm sm:text-base',
      barWidth: 'w-18',
      barHeight: 'h-1.5',
      gap: 'gap-4',
    },
  }[size];

  if (iconOnly) {
    return <GastoArIcon size={config.iconSize} className={className} />;
  }

  const isDarkCanvas = variant === 'dark';

  return (
    <div className={`inline-flex items-center ${config.gap} select-none ${className}`}>
      <GastoArIcon size={config.iconSize} />

      <div className="flex flex-col justify-center">
        {/* Brand Text: Gasto + AR (Pure white in dark mode) */}
        <div className={`font-black tracking-tight leading-none ${config.textSize} flex items-center`}>
          <span className={isDarkCanvas ? 'text-white' : 'text-[#2E0854] dark:text-white'}>
            Gasto
          </span>
          <span className={isDarkCanvas ? 'text-white' : 'text-[#9333EA] dark:text-white ml-0.5'}>
            AR
          </span>
        </div>

        {/* Slogan / Tagline: Registra, Controla, Ahorra */}
        {showTagline && (
          <div className="flex flex-col items-start mt-0.5">
            <span className={`font-bold tracking-normal leading-tight ${config.taglineSize} ${
              isDarkCanvas ? 'text-purple-200' : 'text-slate-700 dark:text-slate-300'
            }`}>
              Registra, Controla, Ahorra
            </span>

            {/* Violet to Orange Official Accent Line */}
            {showAccentBar && (
              <span 
                className={`${config.barWidth} ${config.barHeight} rounded-full bg-gradient-to-r from-[#7E22CE] via-[#D946EF] to-[#F97316] mt-0.5`} 
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * GastoAR Hero Badge (Centered stacked layout for Auth Landing & Splash)
 */
export const GastoArHeroBrand: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Large Glowing Icon */}
      <div className="relative mb-3">
        <div className="absolute inset-0 bg-purple-600/30 rounded-full blur-2xl" />
        <GastoArIcon size={76} className="relative z-10" />
      </div>

      {/* Brand Title */}
      <div className="font-black text-3xl sm:text-4xl tracking-tight leading-none flex items-center justify-center">
        <span className="text-white">Gasto</span>
        <span className="text-[#D946EF] ml-1">AR</span>
      </div>

      {/* Slogan */}
      <p className="text-xs sm:text-sm font-bold text-purple-200 mt-2 tracking-wide">
        Registra, Controla, Ahorra
      </p>

      {/* Official Gradient Accent Bar */}
      <div className="w-14 h-1 bg-gradient-to-r from-[#7E22CE] via-[#D946EF] to-[#F97316] rounded-full mt-1.5" />
    </div>
  );
};

/**
 * 3 Pillars of Opción 1 Brand:
 * REGISTRO (Registro de consumos ágil)
 * CONTROL (Control presupuestario y cuotas)
 * AHORRO (Metas y cajas de ahorro)
 */
export const GastoArPillars: React.FC<{ variant?: 'light' | 'dark'; className?: string }> = ({
  variant = 'light',
  className = '',
}) => {
  const isDark = variant === 'dark';
  return (
    <div className={`grid grid-cols-3 gap-2.5 text-center ${className}`}>
      <div className={`p-2.5 rounded-2xl border transition-all ${
        isDark ? 'bg-purple-950/40 border-purple-800/60 text-purple-200' : 'bg-white border-purple-100 shadow-xs text-purple-950'
      }`}>
        <div className="text-[11px] font-black tracking-wider text-[#9333EA] uppercase">1. Registro</div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">En segundos</div>
      </div>

      <div className={`p-2.5 rounded-2xl border transition-all ${
        isDark ? 'bg-purple-950/40 border-purple-800/60 text-purple-200' : 'bg-white border-purple-100 shadow-xs text-purple-950'
      }`}>
        <div className="text-[11px] font-black tracking-wider text-[#7928CA] uppercase">2. Control</div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">Límites & Cuotas</div>
      </div>

      <div className={`p-2.5 rounded-2xl border transition-all ${
        isDark ? 'bg-purple-950/40 border-purple-800/60 text-purple-200' : 'bg-white border-purple-100 shadow-xs text-purple-950'
      }`}>
        <div className="text-[11px] font-black tracking-wider text-[#F95420] uppercase">3. Ahorro</div>
        <div className="text-[10px] text-slate-400 font-medium mt-0.5">Metas y Cajas</div>
      </div>
    </div>
  );
};
