import React from 'react';
import { QrCode, Copy, Printer } from 'lucide-react';

interface BarcodeBadgeProps {
  value: string;
  itemName?: string;
  price?: number;
  showPrintBtn?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Deterministic barcode pattern generator to render authentic Code128-style barcode bars
export const generateBarcodeSVG = (text: string, width = 180, height = 45): string => {
  if (!text) return '';
  
  // Create a pseudo-hash sequence for bar widths based on characters
  let pattern = '101001101'; // start pattern
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    // map charCode to standard-like 6-bit bar pattern
    const b1 = (code % 3) + 1;
    const b2 = ((code >> 1) % 3) + 1;
    const b3 = ((code >> 2) % 3) + 1;
    pattern += '1'.repeat(b1) + '0'.repeat(b2) + '1'.repeat(b3) + '0';
  }
  pattern += '101100101'; // stop pattern

  const totalBits = pattern.length;
  const unitWidth = width / totalBits;

  let rects = '';
  for (let i = 0; i < totalBits; i++) {
    if (pattern[i] === '1') {
      const x = (i * unitWidth).toFixed(2);
      rects += `<rect x="${x}" y="0" width="${unitWidth.toFixed(2)}" height="${height}" fill="#000000" />`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" preserveAspectRatio="none">${rects}</svg>`;
};

export const BarcodeBadge: React.FC<BarcodeBadgeProps> = ({
  value,
  itemName,
  price,
  showPrintBtn = true,
  className = '',
  size = 'md'
}) => {
  if (!value) return null;

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(value);
  };

  const handlePrintLabel = (e: React.MouseEvent) => {
    e.stopPropagation();
    const printWindow = window.open('', '_blank', 'width=450,height=350');
    if (!printWindow) return;

    const svgString = generateBarcodeSVG(value, 200, 50);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="rtl">
        <head>
          <title>طباعة باركود: ${itemName || value}</title>
          <style>
            @page {
              size: 50mm 30mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 4px;
              font-family: system-ui, sans-serif;
              text-align: center;
              background: white;
              color: black;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              box-sizing: border-box;
            }
            .shop-title {
              font-size: 8px;
              font-weight: bold;
              margin-bottom: 2px;
              letter-spacing: 0.5px;
            }
            .item-title {
              font-size: 11px;
              font-weight: 800;
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
              max-width: 180px;
              margin-bottom: 2px;
            }
            .barcode-wrap {
              margin: 1px 0;
            }
            .barcode-num {
              font-family: monospace;
              font-size: 10px;
              font-weight: bold;
              letter-spacing: 1px;
            }
            .price-tag {
              font-size: 12px;
              font-weight: 900;
              margin-top: 2px;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="shop-title">الرقم الأول لخدمات الجوال (772315106)</div>
          ${itemName ? `<div class="item-title">${itemName}</div>` : ''}
          <div class="barcode-wrap">
            ${svgString}
          </div>
          <div class="barcode-num">${value}</div>
          ${price !== undefined ? `<div class="price-tag">${price.toLocaleString('en-US')} ر.ي</div>` : ''}
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const svgContent = generateBarcodeSVG(
    value, 
    size === 'sm' ? 120 : size === 'lg' ? 240 : 160, 
    size === 'sm' ? 28 : size === 'lg' ? 44 : 34
  );

  return (
    <div className={`inline-flex flex-col items-center bg-white p-2 rounded-lg border border-slate-300 text-slate-900 select-none shadow-xs ${className}`}>
      {itemName && (
        <span className="text-[11px] font-bold text-slate-800 truncate max-w-[170px] mb-1">
          {itemName}
        </span>
      )}
      
      <div 
        className="w-full flex justify-center overflow-hidden my-0.5"
        dangerouslySetInnerHTML={{ __html: svgContent }} 
      />

      <div className="flex items-center justify-between w-full mt-1 gap-1 text-[10px]">
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-0.5 font-mono text-[10px] font-bold text-slate-700 hover:text-indigo-600 cursor-pointer"
          title="نسخ رقم الباركود"
        >
          <Copy className="w-2.5 h-2.5" />
          <span>{value}</span>
        </button>

        {price !== undefined && (
          <span className="font-bold text-emerald-700 font-mono-num text-[11px]">
            {price.toLocaleString('en-US')} ر.ي
          </span>
        )}

        {showPrintBtn && (
          <button
            onClick={handlePrintLabel}
            type="button"
            className="p-1 rounded hover:bg-slate-100 text-slate-600 hover:text-indigo-700 transition cursor-pointer"
            title="طباعة ملصق الباركود"
          >
            <Printer className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
