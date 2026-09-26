import * as XLSX from 'xlsx';

/**
 * Universal safe workbook downloader that prevents corrupted Excel files.
 * Uses binary array buffers and official OpenXML MIME types.
 */
export function downloadExcelWorkbook(wb: XLSX.WorkBook, fileName: string): void {
  try {
    // Generate ArrayBuffer which is 100% binary-safe and avoids charCode truncation bugs
    const excelBuffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'array',
    });

    const blob = new Blob([excelBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    });

    const safeName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
    triggerFileDownload(blob, safeName);
  } catch (error) {
    console.error('Error exporting Excel workbook:', error);
    alert('حدث خطأ أثناء تصدير ملف الإكسل. يرجى إعادة المحاولة.');
  }
}

/**
 * Universal safe HTML/Report document downloader.
 * Exports a clean, self-contained HTML report with built-in print styles
 * that opens immediately in any browser and Word without corruption warnings.
 */
export function downloadHtmlReport(htmlContent: string, fileName: string): void {
  try {
    // Ensure UTF-8 BOM so Arabic letters render flawlessly in all text editors and browsers
    const blob = new Blob(['\ufeff' + htmlContent], {
      type: 'text/html;charset=utf-8',
    });

    const safeName = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    triggerFileDownload(blob, safeName);
  } catch (error) {
    console.error('Error exporting HTML report:', error);
  }
}

/**
 * Universal file trigger using standard DOM anchor element,
 * fully optimized for desktop browsers, Android WebView, and Electron.
 */
export function triggerFileDownload(blob: Blob, fileName: string): void {
  try {
    // If running in Capacitor or environment with native file writer
    if ((window as any).Capacitor && (window as any).Capacitor.isNativePlatform?.()) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const a = document.createElement('a');
        a.href = base64data;
        a.download = fileName;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          try { document.body.removeChild(a); } catch (e) {}
        }, 1000);
      };
      reader.readAsDataURL(blob);
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.setAttribute('download', fileName);
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      try {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        // ignore
      }
    }, 2500);
  } catch (err) {
    console.error('File download failed, falling back to data URI:', err);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const a = document.createElement('a');
        a.href = reader.result as string;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };
      reader.readAsDataURL(blob);
    } catch (fallbackErr) {
      console.error('Download fallback failed:', fallbackErr);
    }
  }
}
