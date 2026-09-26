import React, { useState, useEffect, useRef } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Sliders, Type } from 'lucide-react';

export const ZoomControl: React.FC = () => {
  const [zoom, setZoom] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('mosaab_font_scale_level') || localStorage.getItem('mosaab_chrome_zoom_level');
      if (saved) {
        const val = Number(saved);
        if (val >= 40 && val <= 250) return val;
      }
    } catch (e) {
      console.warn('Could not load font scale level:', e);
    }
    return 100;
  });

  const [isOpenMenu, setIsOpenMenu] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Apply pure font scaling to document root (scales all typography without shrinking layout or viewport)
  const applyZoom = (newZoom: number) => {
    const clamped = Math.min(250, Math.max(40, Math.round(newZoom)));
    setZoom(clamped);

    try {
      const scaleRatio = clamped / 100;

      // 1. Remove any legacy CSS zoom to prevent viewport shrinking and side black bars
      document.documentElement.style.removeProperty('zoom');
      (document.documentElement.style as any).zoom = '';

      // 2. Set root CSS custom property & root font-size (Tailwind rem units scale proportionally)
      document.documentElement.style.setProperty('--app-font-scale', `${scaleRatio}`);
      document.documentElement.style.fontSize = `${16 * scaleRatio}px`;

      // 3. Inject or update dynamic font style tag for maximum cross-browser reliability
      let styleTag = document.getElementById('app-font-scaling-dynamic') as HTMLStyleElement | null;
      if (!styleTag) {
        styleTag = document.createElement('style');
        styleTag.id = 'app-font-scaling-dynamic';
        document.head.appendChild(styleTag);
      }
      styleTag.textContent = `
        :root {
          --app-font-scale: ${scaleRatio} !important;
        }
        html {
          font-size: ${16 * scaleRatio}px !important;
          width: 100% !important;
          max-width: 100vw !important;
        }
        html, body {
          width: 100% !important;
          max-width: 100vw !important;
        }
        .text-xs { font-size: ${12 * scaleRatio}px !important; }
        .text-sm { font-size: ${14 * scaleRatio}px !important; }
        .text-base { font-size: ${16 * scaleRatio}px !important; }
        .text-lg { font-size: ${18 * scaleRatio}px !important; }
        .text-xl { font-size: ${20 * scaleRatio}px !important; }
        .text-2xl { font-size: ${24 * scaleRatio}px !important; }
        .text-3xl { font-size: ${30 * scaleRatio}px !important; }
        .text-4xl { font-size: ${36 * scaleRatio}px !important; }
        [class*="text-[8px]"] { font-size: ${8 * scaleRatio}px !important; }
        [class*="text-[9px]"] { font-size: ${9 * scaleRatio}px !important; }
        [class*="text-[10px]"] { font-size: ${10 * scaleRatio}px !important; }
        [class*="text-[11px]"] { font-size: ${11 * scaleRatio}px !important; }
        [class*="text-[12px]"] { font-size: ${12 * scaleRatio}px !important; }
        [class*="text-[13px]"] { font-size: ${13 * scaleRatio}px !important; }
        [class*="text-[14px]"] { font-size: ${14 * scaleRatio}px !important; }
        [class*="text-[15px]"] { font-size: ${15 * scaleRatio}px !important; }
        [class*="text-[16px]"] { font-size: ${16 * scaleRatio}px !important; }
        [class*="text-[18px]"] { font-size: ${18 * scaleRatio}px !important; }
        [class*="text-[20px]"] { font-size: ${20 * scaleRatio}px !important; }
        [class*="text-[22px]"] { font-size: ${22 * scaleRatio}px !important; }
        [class*="text-[24px]"] { font-size: ${24 * scaleRatio}px !important; }
        [class*="text-[28px]"] { font-size: ${28 * scaleRatio}px !important; }
      `;

      // 4. Save setting in localStorage
      localStorage.setItem('mosaab_font_scale_level', clamped.toString());
      localStorage.removeItem('mosaab_chrome_zoom_level');
    } catch (e) {
      console.warn('Could not apply font scale:', e);
    }
  };

  // Initial apply on mount
  useEffect(() => {
    applyZoom(zoom);
  }, []);

  // Keyboard shortcuts like Chrome (Ctrl + / Ctrl - / Ctrl 0)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === '+' || e.key === '=') {
          e.preventDefault();
          applyZoom(zoom + 10);
        } else if (e.key === '-' || e.key === '_') {
          e.preventDefault();
          applyZoom(zoom - 10);
        } else if (e.key === '0') {
          e.preventDefault();
          applyZoom(100);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoom]);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpenMenu(false);
      }
    };

    if (isOpenMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpenMenu]);

  const presetLevels = [50, 75, 90, 100, 110, 125, 150, 175, 200, 250];

  return (
    <div className="relative inline-flex items-center" ref={menuRef}>
      {/* Sleek inline controls */}
      <div className="inline-flex items-center bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 rounded-lg sm:rounded-xl p-0.5 shadow-xs transition-all">
        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={() => applyZoom(zoom - 10)}
          disabled={zoom <= 40}
          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md sm:rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="تصغير حجم الخطوط والشاشة (Ctrl + -)"
          aria-label="تصغير حجم الخط"
        >
          <ZoomOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>

        {/* Current Zoom Percentage & Menu Trigger */}
        <button
          type="button"
          onClick={() => setIsOpenMenu(!isOpenMenu)}
          className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-mono font-bold flex items-center gap-1 transition-all cursor-pointer ${
            zoom !== 100
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              : 'text-slate-200 hover:bg-slate-700'
          }`}
          title="تغيير حجم الخطوط من 40% إلى 250% (نفس متصفح قوقل كروم)"
          aria-label="خيارات تكبير وتصغير الخط"
        >
          <Type className="w-3 h-3 text-amber-400 hidden xs:inline" />
          <span>{zoom}%</span>
        </button>

        {/* Zoom In Button */}
        <button
          type="button"
          onClick={() => applyZoom(zoom + 10)}
          disabled={zoom >= 250}
          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center rounded-md sm:rounded-lg text-slate-300 hover:text-white hover:bg-slate-700 active:scale-90 disabled:opacity-30 disabled:pointer-events-none transition-all cursor-pointer"
          title="تكبير حجم الخطوط والشاشة (Ctrl + +)"
          aria-label="تكبير حجم الخط"
        >
          <ZoomIn className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </button>
      </div>

      {/* Dropdown Menu for Precise Zoom Selection & Slider */}
      {isOpenMenu && (
        <div
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-72 sm:w-80 bg-slate-900/98 backdrop-blur-md border border-slate-700 rounded-2xl shadow-2xl p-4 z-50 text-right space-y-4 animate-in fade-in slide-in-from-top-2 duration-150"
          style={{ zoom: 1 }} // Keep the menu itself at 100% scale for easy control
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <Type className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">تكبير وتصغير خطوط وشاشة البرنامج</h4>
                <p className="text-[10px] text-slate-400">تحكم كامل من 40% حتى 250% لكافة العناصر</p>
              </div>
            </div>
            {zoom !== 100 && (
              <button
                type="button"
                onClick={() => applyZoom(100)}
                className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                title="إعادة ضبط الحجم إلى 100% (Ctrl + 0)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>

          {/* Smooth Range Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="text-[11px] text-slate-400">40% (أصغر شيء)</span>
              <span className="font-mono text-amber-400 font-black text-sm bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700">
                {zoom}%
              </span>
              <span className="text-[11px] text-slate-400">250% (أكبر شيء)</span>
            </div>
            <input
              type="range"
              min="40"
              max="250"
              step="5"
              value={zoom}
              onChange={(e) => applyZoom(Number(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400">مقاسات سريعة جاهزة:</label>
            <div className="grid grid-cols-5 gap-1.5">
              {presetLevels.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => applyZoom(lvl)}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                    zoom === lvl
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60'
                  }`}
                >
                  {lvl}%
                </button>
              ))}
            </div>
          </div>

          {/* Helper info */}
          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>اختصارات لوحة المفاتيح:</span>
            <span className="font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded text-[9px]">
              Ctrl + / - / 0
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
