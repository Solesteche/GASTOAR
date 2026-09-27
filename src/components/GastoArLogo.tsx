import React from 'react';

export interface GastoArLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  showAccentBar?: boolean;
  variant?: 'light' | 'dark' | 'full-color' | 'auto';
  className?: string;
  iconOnly?: boolean;
}

/**
 * GastoAR Icon Oficial (Isotipo):
 * Mantiene el isotipo auténtico original de GastoAR:
 * Contenedor estilizado con degradé violeta/fucsia/naranja y símbolo vectorizado G en blanco.
 */
export const GastoArIcon: React.FC<{ 
  size?: number | string; 
  className?: string;
  variant?: 'light' | 'dark' | 'full-color' | 'auto';
}> = ({ 
  size = 40,
  className = '',
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;
  const radius = typeof size === 'number' ? `${Math.round(size * 0.28)}px` : '28%';

  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center select-none overflow-hidden group transition-all duration-200 active:scale-95 bg-gradient-to-br from-[#4A0E78] via-[#7E22CE] to-[#F97316] shadow-sm shadow-purple-950/20 ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderRadius: radius,
      }}
    >
      {/* Isotipo vectorizado nítido a cualquier resolución */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-[72%] h-[72%] text-white drop-shadow-xs"
      >
        <path
          d="M 68 30 A 28 28 0 1 0 78 50 L 63 50"
          stroke="currentColor"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle 
          cx="51" 
          cy="41" 
          r="5" 
          fill="currentColor" 
        />
        <path
          d="M 44 56.5 Q 51 63.5 58 56.5"
          stroke="currentColor"
          strokeWidth="4.8"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};

/**
 * GastoAR Complete Brand Logo:
 * Mantiene el logotipo y tipografía auténticos anteriores:
 * "Gasto" + "AR" + Slogan oficial "Registra, Controla, Ahorra" y barra de acento degradé.
 */
export const GastoArBrand: React.FC<GastoArLogoProps> = ({
  size = 'md',
  showTagline = true,
  showAccentBar = true,
  variant = 'auto',
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
    return <GastoArIcon size={config.iconSize} variant={variant} className={className} />;
  }

  const isDark = variant === 'dark';

  return (
    <div className={`inline-flex items-center ${config.gap} select-none ${className}`}>
      <GastoArIcon size={config.iconSize} variant={variant} />

      <div className="flex flex-col justify-center">
        {/* Brand Text: Gasto + AR */}
        <div className={`font-black tracking-tight leading-none ${config.textSize} flex items-center`}>
          <span className={
            isDark
              ? 'text-white'
              : variant === 'light'
              ? 'text-[#2E0854]'
              : 'text-[#2E0854] dark:text-white'
          }>
            Gasto
          </span>
          <span className={`ml-0.5 ${
            isDark
              ? 'text-[#D946EF]'
              : variant === 'light'
              ? 'text-[#7928CA]'
              : 'text-[#7928CA] dark:text-[#D946EF]'
          }`}>
            AR
          </span>
        </div>

        {/* Slogan / Tagline: Registra, Controla, Ahorra */}
        {showTagline && (
          <div className="flex flex-col items-start mt-0.5">
            <span className={`font-bold tracking-normal leading-tight ${config.taglineSize} ${
              isDark
                ? 'text-purple-200'
                : variant === 'light'
                ? 'text-slate-600'
                : 'text-slate-600 dark:text-purple-200'
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
 * GastoAR Hero Brand (Centered stacked layout for Auth Landing, Splash & Screens)
 */
export const GastoArHeroBrand: React.FC<{ 
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
}> = ({ 
  variant = 'dark',
  className = '' 
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`flex flex-col items-center text-center select-none ${className}`}>
      {/* Large Glowing Icon */}
      <div className="relative mb-3">
        <div className={`absolute inset-0 rounded-full blur-2xl ${isDark ? 'bg-purple-600/30' : 'bg-purple-300/40'}`} />
        <GastoArIcon size={80} variant={variant} className="relative z-10" />
      </div>

      {/* Brand Title */}
      <div className="font-black text-3xl sm:text-4xl tracking-tight leading-none flex items-center justify-center">
        <span className={isDark ? 'text-white' : 'text-[#2E0854] dark:text-white'}>Gasto</span>
        <span className="text-[#D946EF] ml-1">AR</span>
      </div>

      {/* Slogan */}
      <p className={`text-xs sm:text-sm font-bold mt-2 tracking-wide ${
        isDark ? 'text-purple-200' : 'text-slate-600 dark:text-purple-200'
      }`}>
        Registra, Controla, Ahorra
      </p>

      {/* Official Gradient Accent Bar */}
      <div className="w-14 h-1 bg-gradient-to-r from-[#7E22CE] via-[#D946EF] to-[#F97316] rounded-full mt-1.5" />
    </div>
  );
};

/**
 * GastoAR Direct Image Logo / Component Logo
 */
export const GastoArImageLogo: React.FC<{
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
  height?: number | string;
  alt?: string;
}> = ({
  variant = 'auto',
  className = '',
  height = 40,
}) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <GastoArBrand 
        size={typeof height === 'number' && height > 45 ? 'lg' : 'md'} 
        variant={variant} 
      />
    </div>
  );
};

/**
 * 3 Pillars of GastoAR:
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
