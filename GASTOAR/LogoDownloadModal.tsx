import React, { useRef, useState } from 'react';
import { 
  X, 
  Download, 
  Check, 
  Image as ImageIcon, 
  Sparkles, 
  Layers, 
  Copy,
  ExternalLink
} from 'lucide-react';
import { GastoArBrand, GastoArHeroBrand, GastoArIcon } from './GastoArLogo';

interface LogoDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const LogoDownloadModal: React.FC<LogoDownloadModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [downloadFormat, setDownloadFormat] = useState<'png' | 'svg'>('png');
  const [selectedVariant, setSelectedVariant] = useState<'light' | 'dark' | 'icon'>('light');
  const [isDownloading, setIsDownloading] = useState(false);

  if (!isOpen) return null;

  const downloadSVG = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onShowToast(`¡Logo ${filename} descargado con éxito!`, 'success');
  };

  const downloadPNGFromSVG = (svgContent: string, filename: string, width = 800, height = 800) => {
    setIsDownloading(true);
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            const pngUrl = URL.createObjectURL(pngBlob);
            const downloadLink = document.createElement('a');
            downloadLink.href = pngUrl;
            downloadLink.download = filename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
            URL.revokeObjectURL(pngUrl);
            onShowToast(`¡Imagen ${filename} descargada en alta resolución!`, 'success');
          }
          setIsDownloading(false);
        }, 'image/png');
      }
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      setIsDownloading(false);
      onShowToast('Error al generar la imagen PNG.', 'error');
    };

    img.src = url;
  };

  const handleDownload = () => {
    if (selectedVariant === 'icon') {
      const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
        <defs>
          <linearGradient id="gastoArGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00d2ff" />
            <stop offset="52%" stop-color="#7928ca" />
            <stop offset="100%" stop-color="#ff0080" />
          </linearGradient>
        </defs>
        <rect width="512" height="512" rx="140" fill="url(#gastoArGrad)" />
        <g transform="translate(64, 64) scale(3.84)">
          <path d="M 68 32 A 28 28 0 1 0 74 62 L 54 62 L 54 50 L 75 50" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          <line x1="50" y1="34" x2="50" y2="66" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
          <path d="M 54 41 C 54 38 46 38 46 43 C 46 48 54 48 54 53 C 54 58 46 58 46 55" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </g>
      </svg>`;

      if (downloadFormat === 'svg') {
        downloadSVG(iconSvg, 'gastoar_app_icon_512.svg');
      } else {
        downloadPNGFromSVG(iconSvg, 'gastoar_app_icon_512.png', 512, 512);
      }
    } else if (selectedVariant === 'dark') {
      const darkSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240">
        <defs>
          <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00d2ff" />
            <stop offset="52%" stop-color="#7928ca" />
            <stop offset="100%" stop-color="#ff0080" />
          </linearGradient>
          <linearGradient id="barGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#9333EA" />
            <stop offset="50%" stop-color="#7928CA" />
            <stop offset="100%" stop-color="#F95420" />
          </linearGradient>
        </defs>
        <rect width="800" height="240" fill="#0B0517" rx="24"/>
        <!-- Icon -->
        <g transform="translate(48, 48)">
          <rect width="144" height="144" rx="42" fill="url(#iconGrad)"/>
          <g transform="translate(18, 18) scale(1.08)">
            <path d="M 68 32 A 28 28 0 1 0 74 62 L 54 62 L 54 50 L 75 50" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <line x1="50" y1="34" x2="50" y2="66" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
            <path d="M 54 41 C 54 38 46 38 46 43 C 46 48 54 48 54 53 C 54 58 46 58 46 55" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </g>
        </g>
        <!-- Text -->
        <text x="220" y="125" font-family="Plus Jakarta Sans, sans-serif" font-weight="900" font-size="70" fill="#FFFFFF">Gasto<tspan fill="#A855F7">AR</tspan></text>
        <text x="222" y="165" font-family="Plus Jakarta Sans, sans-serif" font-weight="700" font-size="22" fill="#E9D5FF">Registrá. Controlá. Ahorrá.</text>
        <rect x="222" y="178" width="160" height="6" rx="3" fill="url(#barGrad)"/>
      </svg>`;

      if (downloadFormat === 'svg') {
        downloadSVG(darkSvg, 'gastoar_logo_dark.svg');
      } else {
        downloadPNGFromSVG(darkSvg, 'gastoar_logo_dark.png', 800, 240);
      }
    } else {
      const lightSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 240" width="800" height="240">
        <defs>
          <linearGradient id="iconGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#00d2ff" />
            <stop offset="52%" stop-color="#7928ca" />
            <stop offset="100%" stop-color="#ff0080" />
          </linearGradient>
          <linearGradient id="barGrad2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#9333EA" />
            <stop offset="50%" stop-color="#7928CA" />
            <stop offset="100%" stop-color="#F95420" />
          </linearGradient>
        </defs>
        <rect width="800" height="240" fill="#FFFFFF" rx="24"/>
        <!-- Icon -->
        <g transform="translate(48, 48)">
          <rect width="144" height="144" rx="42" fill="url(#iconGrad2)"/>
          <g transform="translate(18, 18) scale(1.08)">
            <path d="M 68 32 A 28 28 0 1 0 74 62 L 54 62 L 54 50 L 75 50" stroke="#FFFFFF" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
            <line x1="50" y1="34" x2="50" y2="66" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round"/>
            <path d="M 54 41 C 54 38 46 38 46 43 C 46 48 54 48 54 53 C 54 58 46 58 46 55" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
          </g>
        </g>
        <!-- Text -->
        <text x="220" y="125" font-family="Plus Jakarta Sans, sans-serif" font-weight="900" font-size="70" fill="#2E0854">Gasto<tspan fill="#9333EA">AR</tspan></text>
        <text x="222" y="165" font-family="Plus Jakarta Sans, sans-serif" font-weight="700" font-size="22" fill="#334155">Registrá. Controlá. Ahorrá.</text>
        <rect x="222" y="178" width="160" height="6" rx="3" fill="url(#barGrad2)"/>
      </svg>`;

      if (downloadFormat === 'svg') {
        downloadSVG(lightSvg, 'gastoar_logo_light.svg');
      } else {
        downloadPNGFromSVG(lightSvg, 'gastoar_logo_light.png', 800, 240);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col my-auto max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-[#2E0854] via-[#4A0E78] to-[#7928CA] text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                Descargar Logo GastoAR
              </h3>
              <p className="text-xs text-purple-200">
                Logotipo oficial, isotipo y recursos de marca en alta resolución
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-purple-200 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          
          {/* Variant Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              1. Selecciona la variante del logo:
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedVariant('light')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedVariant === 'light'
                    ? 'border-[#7928CA] bg-purple-50/60 ring-2 ring-[#7928CA]/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center mb-1.5 p-1 shadow-2xs">
                  <GastoArBrand size="sm" showTagline={false} />
                </div>
                <span className="text-xs font-bold text-slate-800 block">Fondo Claro</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVariant('dark')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedVariant === 'dark'
                    ? 'border-[#7928CA] bg-purple-50/60 ring-2 ring-[#7928CA]/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="h-10 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center mb-1.5 p-1 shadow-2xs">
                  <GastoArBrand size="sm" variant="dark" showTagline={false} />
                </div>
                <span className="text-xs font-bold text-slate-800 block">Fondo Oscuro</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedVariant('icon')}
                className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                  selectedVariant === 'icon'
                    ? 'border-[#7928CA] bg-purple-50/60 ring-2 ring-[#7928CA]/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="h-10 bg-purple-100/50 rounded-xl flex items-center justify-center mb-1.5">
                  <GastoArIcon size={28} />
                </div>
                <span className="text-xs font-bold text-slate-800 block">Isotipo 512x512</span>
              </button>
            </div>
          </div>

          {/* Format Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              2. Formato de archivo:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDownloadFormat('png')}
                className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  downloadFormat === 'png'
                    ? 'bg-[#2E0854] text-white border-[#2E0854] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>PNG Alta Resolución</span>
              </button>

              <button
                type="button"
                onClick={() => setDownloadFormat('svg')}
                className={`py-2.5 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  downloadFormat === 'svg'
                    ? 'bg-[#2E0854] text-white border-[#2E0854] shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>SVG Vectorial Escalable</span>
              </button>
            </div>
          </div>

          {/* Preview Box */}
          <div className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 flex flex-col items-center justify-center min-h-[140px] text-center space-y-2">
            <div className="p-4 rounded-2xl bg-white shadow-xs border border-purple-100 w-full flex items-center justify-center">
              {selectedVariant === 'icon' ? (
                <GastoArIcon size={64} />
              ) : selectedVariant === 'dark' ? (
                <div className="bg-slate-950 p-4 rounded-xl w-full flex items-center justify-center">
                  <GastoArBrand size="md" variant="dark" />
                </div>
              ) : (
                <GastoArBrand size="md" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Formato: <strong>.{downloadFormat.toUpperCase()}</strong> | Listo para presentaciones, impresiones y perfiles
            </p>
          </div>

          {/* Download Action Button */}
          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownload}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#F95420] via-[#FF6B3D] to-[#FA541C] hover:from-[#E04412] hover:to-[#F95420] active:scale-98 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-orange-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isDownloading ? 'Generando archivo...' : `Descargar Logo (${downloadFormat.toUpperCase()})`}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
