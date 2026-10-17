// Pointer interaction must not inherit the browser's keyboard-focus heuristic.
// Keep a visible cue when a player deliberately navigates with a keyboard.
export function trackFocusInput(doc = document) {
  const root = doc.documentElement;
  root.dataset.inputMode = 'pointer';
  const pointer = () => { root.dataset.inputMode = 'pointer'; };
  const keyboard = event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (['Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'PageUp', 'PageDown'].includes(event.key)) {
      root.dataset.inputMode = 'keyboard';
    }
  };
  doc.addEventListener('pointerdown', pointer, {capture: true, passive: true});
  doc.addEventListener('keydown', keyboard, true);
  return () => {
    doc.removeEventListener('pointerdown', pointer, true);
    doc.removeEventListener('keydown', keyboard, true);
  };
}
