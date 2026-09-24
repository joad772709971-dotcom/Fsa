/**
 * Universal Printing & System Print Dialog Engine
 * Supports A4 reports, 80mm/58mm thermal receipts, Android WebView (PrintManager),
 * Electron Desktop (Windows Print Dialog), and direct browser window.print().
 */

export type PaperSize = 'a4' | 'receipt80' | 'receipt58' | 'auto';
export type ColorMode = 'color' | 'grayscale';

export interface PrintOptions {
  title?: string;
  paperSize?: PaperSize;
  colorMode?: ColorMode;
  autoPrint?: boolean;
}

export interface PrintPayload {
  html: string;
  rawContent: string;
  title: string;
  paperSize: PaperSize;
  colorMode: ColorMode;
}

// Global callback for the Print Preview and System Print Modal
type PrintListener = (payload: PrintPayload) => void;
let globalPrintListener: PrintListener | null = null;

export function registerPrintListener(listener: PrintListener | null) {
  globalPrintListener = listener;
}

/**
 * Synchronizes and populates the hidden #printableArea container in the main document.
 * This guarantees that when window.print() is called, only the target document prints cleanly.
 */
export function syncPrintableArea(contentHtml: string): HTMLElement {
  let area = document.getElementById('printableArea');
  if (!area) {
    area = document.createElement('div');
    area.id = 'printableArea';
    document.body.appendChild(area);
  }
  area.innerHTML = contentHtml;
  if (contentHtml && contentHtml.trim().length > 0) {
    document.body.classList.add('has-printable-content');
  } else {
    document.body.classList.remove('has-printable-content');
  }
  return area;
}

export function clearPrintableArea(): void {
  const area = document.getElementById('printableArea');
  if (area) {
    area.innerHTML = '';
  }
  document.body.classList.remove('has-printable-content');
}

/**
 * Builds a complete, standalone, high-fidelity printable HTML document
 * fully equipped with native print dialog CSS (@media print).
 */
export function buildPrintableHtml(
  contentHtml: string,
  title: string = 'طباعة مستند',
  options: PrintOptions = {}
): string {
  const paperSize = options.paperSize || 'a4';
  const colorMode = options.colorMode || 'color';

  let pageCss = 'size: auto; margin: 8mm;';
  let containerWidthCss = 'max-width: 100%;';
  let thermalReceiptClasses = '';

  if (paperSize === 'receipt80') {
    pageCss = 'size: 80mm auto; margin: 2mm 3mm;';
    containerWidthCss = 'max-width: 78mm; margin: 0 auto; font-size: 11px;';
    thermalReceiptClasses = 'receipt-mode';
  } else if (paperSize === 'receipt58') {
    pageCss = 'size: 58mm auto; margin: 1.5mm 2mm;';
    containerWidthCss = 'max-width: 56mm; margin: 0 auto; font-size: 10px;';
    thermalReceiptClasses = 'receipt-mode';
  } else if (paperSize === 'a4') {
    pageCss = 'size: A4 portrait; margin: 8mm 10mm;';
    containerWidthCss = 'max-width: 210mm; margin: 0 auto;';
  }

  const grayscaleFilter =
    colorMode === 'grayscale'
      ? `
    * {
      filter: grayscale(100%) !important;
      -webkit-filter: grayscale(100%) !important;
    }
    `
      : '';

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Tajawal:wght@400;700;900&family=JetBrains+Mono:wght@500;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: 'Cairo', 'Tajawal', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    body {
      background-color: #ffffff;
      color: #0f172a;
      direction: rtl;
      text-align: right;
      padding: 16px;
      font-size: 12.5px;
      line-height: 1.5;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    ${grayscaleFilter}

    /* Floating Toolbar inside preview/popup (never appears on printed paper) */
    .print-toolbar {
      background: #0f172a;
      color: #ffffff;
      padding: 10px 16px;
      border-radius: 12px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.18);
    }

    .print-btn {
      background: #0284c7;
      color: white;
      border: none;
      padding: 8px 18px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s;
    }

    .print-btn:hover {
      background: #0369a1;
    }

    .close-btn {
      background: #334155;
      color: #f8fafc;
      border: 1px solid #475569;
      padding: 8px 16px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 13px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: background 0.15s, color 0.15s;
    }

    .close-btn:hover {
      background: #dc2626;
      border-color: #ef4444;
      color: #ffffff;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
    }

    th, td {
      border: 1px solid #cbd5e1;
      padding: 6px 10px;
      text-align: right;
    }

    th {
      background-color: #f1f5f9;
      font-weight: bold;
    }

    .font-mono, .font-mono-numbers {
      font-family: 'JetBrains Mono', monospace;
    }

    #print-content-root {
      ${containerWidthCss}
    }

    /* Core @media print layout rules ensuring pristine, clean paper output */
    @media print {
      body {
        visibility: hidden !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
      }

      #printableArea,
      #print-content-root,
      #print-content-root *:not(button):not(.no-print):not([role="button"]):not(input):not(select):not(textarea) {
        visibility: visible !important;
      }

      #printableArea,
      #print-content-root {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
      }

      .no-print,
      .no-print *,
      .print-toolbar,
      button,
      [role="button"],
      input,
      select,
      textarea,
      .action-buttons,
      [title*="تعديل"],
      [title*="حذف"],
      [title*="إضافة"],
      [title*="حفظ"],
      [title*="إلغاء"],
      [aria-label*="تعديل"],
      [aria-label*="حذف"],
      [aria-label*="إضافة"] {
        display: none !important;
        visibility: hidden !important;
      }

      @page {
        ${pageCss}
      }

      .print-break-inside-avoid {
        break-inside: avoid;
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body class="${thermalReceiptClasses}">
  <!-- Clean non-printable preview bar -->
  <div class="print-toolbar no-print">
    <div>
      <strong style="font-size: 14px;">📄 ${title}</strong>
      <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
        الحجم المختار: ${
          paperSize === 'a4'
            ? 'A4 قياسي'
            : paperSize === 'receipt80'
            ? 'حراري 80mm'
            : paperSize === 'receipt58'
            ? 'حراري 58mm'
            : 'تلقائي'
        }
      </div>
    </div>
    <div style="display: flex; gap: 8px; align-items: center;">
      <button class="close-btn" onclick="if(window.parent && window.parent !== window){window.parent.postMessage('close-print-modal','*');} try{window.close();}catch(e){}">
        🔙 رجوع / إغلاق
      </button>
      <button class="print-btn" onclick="window.print()">
        🖨️ طباعة الآن (Print)
      </button>
    </div>
  </div>

  <div id="print-content-root">
    ${contentHtml}
  </div>

  <script>
    // Focus and listen for print trigger
    window.addEventListener('load', function() {
      try {
        window.focus();
      } catch(e) {}
    });
  </script>
</body>
</html>`;
}

/**
 * Triggers native system printing directly via an Iframe.
 * Opens the operating system print dialog (Printer, Copies, Pages, Paper Size, Color).
 */
export function printViaIframe(
  iframeElement: HTMLIFrameElement | null,
  fallbackHtml: string,
  title: string
): boolean {
  try {
    if (iframeElement && iframeElement.contentWindow) {
      iframeElement.contentWindow.focus();
      iframeElement.contentWindow.print();
      return true;
    }
  } catch (err) {
    console.warn('Iframe print call failed or sandboxed, falling back to window.print():', err);
  }

  // Fallback to main window print using synchronized #printableArea
  return directSystemPrint(fallbackHtml, { title });
}

/**
 * Triggers direct system print on the main window by populating #printableArea
 * and invoking window.print(). Fully compatible with Android WebView PrintManager and Electron.
 */
export function directSystemPrint(
  elementIdOrHtml: string,
  options: PrintOptions = {}
): boolean {
  let contentHtml = '';
  const el = document.getElementById(elementIdOrHtml);
  if (el) {
    contentHtml = el.innerHTML;
  } else {
    contentHtml = elementIdOrHtml;
  }

  syncPrintableArea(contentHtml);

  try {
    window.focus();
    window.print();
    return true;
  } catch (err) {
    console.error('Direct window.print() failed:', err);
    return false;
  }
}

/**
 * Opens a dedicated popup window and immediately triggers the system print dialog.
 */
export function printInNewWindow(
  contentHtml: string,
  title: string = 'طباعة مستند',
  options: PrintOptions = {}
): Window | null {
  const fullDoc = buildPrintableHtml(contentHtml, title, options);
  try {
    const printWindow = window.open('', '_blank', 'width=950,height=800,resizable=yes,scrollbars=yes');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(fullDoc);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (e) {
          console.warn('Auto print on popup failed:', e);
        }
      }, 350);
      return printWindow;
    }
  } catch (err) {
    console.warn('Popup window blocked by browser, trying blob URL fallback:', err);
  }

  // Blob fallback
  try {
    const blob = new Blob([fullDoc], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    return win;
  } catch (err) {
    console.error('Blob print window failed:', err);
  }

  return null;
}

/**
 * Universal print initiator called by any view across the system:
 * - Detects if content is thermal receipt vs A4 report automatically if unspecified
 * - Syncs with #printableArea in the main document
 * - Notifies the interactive Print Modal so user can adjust printer settings & trigger print
 */
export function printHtmlElement(
  elementIdOrHtml: string,
  title: string = 'طباعة مستند',
  options: PrintOptions = {}
): void {
  let contentHtml = '';
  const el = document.getElementById(elementIdOrHtml);
  if (el) {
    contentHtml = el.innerHTML;
  } else {
    contentHtml = elementIdOrHtml;
  }

  // Detect appropriate default paper size if not provided
  let detectedPaper: PaperSize = options.paperSize || 'a4';
  if (!options.paperSize) {
    if (
      elementIdOrHtml === 'thermal-receipt-printable' ||
      contentHtml.includes('thermal-receipt') ||
      contentHtml.includes('80mm') ||
      title.includes('فاتورة')
    ) {
      detectedPaper = 'receipt80';
    }
  }

  const detectedColor: ColorMode = options.colorMode || 'color';

  // Always sync main DOM printable area
  syncPrintableArea(contentHtml);

  const fullDoc = buildPrintableHtml(contentHtml, title, {
    paperSize: detectedPaper,
    colorMode: detectedColor,
    ...options,
  });

  // If there's an active global print preview modal listener, notify it!
  if (globalPrintListener) {
    globalPrintListener({
      html: fullDoc,
      rawContent: contentHtml,
      title,
      paperSize: detectedPaper,
      colorMode: detectedColor,
    });
    return;
  }

  // If modal is not mounted, trigger direct system print
  directSystemPrint(contentHtml, options);
}

/**
 * Quick helper to print the entire main page content
 */
export function triggerPagePrint(title: string = 'طباعة التقرير'): void {
  const mainContent = document.querySelector('main');
  if (mainContent) {
    printHtmlElement(mainContent.innerHTML, title);
  } else {
    directSystemPrint(document.body.innerHTML, { title });
  }
}

