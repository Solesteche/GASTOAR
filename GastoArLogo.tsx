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
 * GastoAR Icon - Opción 1:
 * Modern circular gradient badge (Cyan-Blue into Deep Violet/Purple)
 * featuring the stylized 'G' and coin/financial smile glyph.
 */
export const GastoArIcon: React.FC<{ size?: number | string; className?: string }> = ({ 
  size = 40,
  className = ''
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  return (
    <div 
      className={`relative shrink-0 flex items-center justify-center select-none shadow-md ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        borderRadius: typeof size === 'number' ? `${Math.round(size * 0.32)}px` : '30%',
        background: 'linear-gradient(135deg, #00d2ff 0%, #7928ca 52%, #ff0080 100%)',
        boxShadow: '0 4px 16px -2px rgba(121, 40, 202, 0.4), 0 2px 6px -1px rgba(0, 210, 255, 0.25)',
      }}
    >
      {/* SVG Icon recreating Opción 1 circular stylized G glyph */}
      <svg 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="w-[74%] h-[74%]"
      >
        {/* Outer Circular 'G' track */}
        <path
          d="M 68 32 A 28 28 0 1 0 74 62 L 54 62 L 54 50 L 75 50"
          stroke="#FFFFFF"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Center Dollar / Coin Sign '$' */}
        <line
          x1="50"
          y1="34"
          x2="50"
          y2="66"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 54 41 C 54 38 46 38 46 43 C 46 48 54 48 54 53 C 54 58 46 58 46 55"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
};

/**
 * GastoAR Complete Brand Logo (Opción 1 Brand Guidelines)
 * Includes Icon + "Gasto" (Deep Plum #2E0854 / White) + "AR" (Electric Purple #9333EA)
 * + Tagline "Registrá. Controlá. Ahorrá." + Violet Accent Bar
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
        {/* Brand Text: Gasto + AR */}
        <div className={`font-black tracking-tight leading-none ${config.textSize} flex items-center`}>
          <span className={isDarkCanvas ? 'text-white' : 'text-[#2E0854]'}>
            Gasto
          </span>
          <span className="text-[#9333EA] ml-0.5">
            AR
          </span>
        </div>

        {/* Slogan / Tagline: Registrá. Controlá. Ahorrá. */}
        {showTagline && (
          <div className="flex flex-col items-start mt-0.5">
            <span className={`font-bold tracking-normal leading-tight ${config.taglineSize} ${
              isDarkCanvas ? 'text-purple-200' : 'text-slate-700'
            }`}>
              Registrá. Controlá. Ahorrá.
            </span>

            {/* Violet/Purple Opción 1 accent line */}
            {showAccentBar && (
              <span 
                className={`${config.barWidth} ${config.barHeight} rounded-full bg-gradient-to-r from-[#9333EA] via-[#7928CA] to-[#F95420] mt-0.5`} 
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
        <span className="text-[#A855F7] ml-1">AR</span>
      </div>

      {/* Slogan */}
      <p className="text-xs sm:text-sm font-bold text-purple-200 mt-2 tracking-wide">
        Registrá. Controlá. Ahorrá.
      </p>

      {/* Opción 1 Gradient Accent Bar */}
      <div className="w-12 h-1 bg-gradient-to-r from-[#A855F7] to-[#F95420] rounded-full mt-1.5" />
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
