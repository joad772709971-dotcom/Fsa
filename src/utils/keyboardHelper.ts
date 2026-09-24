/**
 * Global Keyboard & Numpad Compatibility Engine
 * Ensures smooth typing across all desktop, laptop, and mobile keyboards:
 * 1. Text inputs, descriptions, and textareas receive 100% native unblocked typing.
 * 2. Laptop Numpad keys (0-9, ., +, -, *, /, Enter) work reliably even if NumLock is off.
 * 3. Selection Replacement is strictly respected: typing replaces selected text instead of appending.
 * 4. Arabic/Eastern-Arabic digits (٠-٩) and Persian digits (۰-۹) are converted to English digits (0-9)
 *    cleanly with full React 18 state synchronization without dropping keystrokes or jumping.
 */

export const ARABIC_TO_ENGLISH_DIGITS: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٫': '.', '،': ',',
};

/**
 * Normalizes any Arabic or Eastern-Arabic numerals in a string to standard digits (0-9).
 */
export function normalizeArabicNumerals(val: string | number | undefined | null): string {
  if (val === undefined || val === null) return '';
  const str = String(val);
  return str.replace(/[\u0660-\u0669\u06F0-\u06F9]/g, (char) => ARABIC_TO_ENGLISH_DIGITS[char] || char);
}

// Map Numpad codes to their intended character when NumLock is off
const NUMPAD_NAVIGATION_KEYS = new Set([
  'Insert', 'Delete', 'End', 'ArrowDown', 'PageDown', 'ArrowLeft', 'Clear', 'ArrowRight', 'Home', 'ArrowUp', 'PageUp'
]);

const NUMPAD_CODE_TO_CHAR: Record<string, string> = {
  Numpad0: '0',
  Numpad1: '1',
  Numpad2: '2',
  Numpad3: '3',
  Numpad4: '4',
  Numpad5: '5',
  Numpad6: '6',
  Numpad7: '7',
  Numpad8: '8',
  Numpad9: '9',
  NumpadDecimal: '.',
  NumpadAdd: '+',
  NumpadSubtract: '-',
  NumpadMultiply: '*',
  NumpadDivide: '/',
};

/**
 * Safely inserts or replaces character at the current selection of an input/textarea.
 * Correctly respects highlight/selection: replaces highlighted text rather than appending!
 */
export function insertCharWithSelectionReplacement(
  target: HTMLInputElement | HTMLTextAreaElement,
  char: string
) {
  const isNumberType = target.type === 'number';
  const val = target.value || '';

  let start = val.length;
  let end = val.length;

  if (!isNumberType) {
    try {
      if (typeof target.selectionStart === 'number' && typeof target.selectionEnd === 'number') {
        start = target.selectionStart;
        end = target.selectionEnd;
      }
    } catch {
      start = val.length;
      end = val.length;
    }
  } else {
    // HTML5 input type="number" blocks selectionStart in some browsers.
    const activeDocSelection = window.getSelection()?.toString();
    if (activeDocSelection && activeDocSelection === val) {
      start = 0;
      end = val.length;
    } else {
      start = val.length;
      end = val.length;
    }
  }

  // First try document.execCommand('insertText') if supported (creates native input events and preserves undo stack)
  if (document.queryCommandSupported && document.queryCommandSupported('insertText')) {
    try {
      const success = document.execCommand('insertText', false, char);
      if (success) {
        return;
      }
    } catch {
      // Fall back to manual value setter
    }
  }

  const newVal = val.slice(0, start) + char + val.slice(end);
  const newCaretPos = start + char.length;

  setReactInputValue(target, newVal, newCaretPos);
}

/**
 * Safely sets value on a React-controlled input/textarea and dispatches events
 * with full support for React 18's internal _valueTracker and caret position.
 */
export function setReactInputValue(
  target: HTMLInputElement | HTMLTextAreaElement,
  newVal: string,
  targetCaretPos?: number
) {
  const isNumberType = target.type === 'number';

  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype,
    'value'
  )?.set;
  const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(
    window.HTMLTextAreaElement.prototype,
    'value'
  )?.set;

  // Reset React's internal valueTracker so React's synthetic onChange detects the change
  const tracker = (target as any)._valueTracker;
  if (tracker) {
    tracker.setValue(target.value + '_reset');
  }

  if (target instanceof HTMLInputElement && nativeInputValueSetter) {
    nativeInputValueSetter.call(target, newVal);
  } else if (target instanceof HTMLTextAreaElement && nativeTextAreaValueSetter) {
    nativeTextAreaValueSetter.call(target, newVal);
  } else {
    target.value = newVal;
  }

  if (!isNumberType && target.setSelectionRange && typeof targetCaretPos === 'number') {
    try {
      target.setSelectionRange(targetCaretPos, targetCaretPos);
    } catch {
      // Ignore if not applicable
    }
  }

  // Dispatch standard events that React listens to
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Initializes global event listeners for the laptop keyboard and numpad.
 * Designed to never block regular typing or text inputs.
 */
export function initKeyboardHelper(): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const isInput = target instanceof HTMLInputElement;
    const isTextArea = target instanceof HTMLTextAreaElement;
    if (!isInput && !isTextArea) return;

    const inputTarget = target as HTMLInputElement | HTMLTextAreaElement;

    // DO NOT intercept text inputs or textareas for normal letter typing!
    // Letters, backspaces, enters, tabs must flow naturally.
    const isNumberInput = isInput && (target as HTMLInputElement).type === 'number';

    // 1. Laptop Numpad when NumLock is OFF (e.code is Numpad*, but e.key is navigation key like Insert, End, etc.)
    if (
      e.code &&
      NUMPAD_CODE_TO_CHAR[e.code] &&
      NUMPAD_NAVIGATION_KEYS.has(e.key) &&
      !e.ctrlKey &&
      !e.altKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      const char = NUMPAD_CODE_TO_CHAR[e.code];
      insertCharWithSelectionReplacement(inputTarget, char);
      return;
    }

    // 2. Arabic digits typed into HTML5 <input type="number">
    // (Because Chrome and Firefox silently drop non-ASCII digits on type="number")
    if (isNumberInput && ARABIC_TO_ENGLISH_DIGITS[e.key]) {
      e.preventDefault();
      const digit = ARABIC_TO_ENGLISH_DIGITS[e.key];
      insertCharWithSelectionReplacement(inputTarget, digit);
    }
  };

  // Attach using standard bubbling (not capture phase) so components handle their own events first
  window.addEventListener('keydown', handleKeyDown, false);

  return () => {
    window.removeEventListener('keydown', handleKeyDown, false);
  };
}
