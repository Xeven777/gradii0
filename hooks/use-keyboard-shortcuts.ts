import { useEffect } from "react";

interface Shortcuts {
  [key: string]: () => void;
}

export function useKeyboardShortcuts(shortcuts: Shortcuts) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlKey = event.ctrlKey || event.metaKey;
      const altKey = event.altKey;

      if (ctrlKey && key === "z") {
        event.preventDefault();
        shortcuts["ctrl+z"]?.();
      } else if (altKey && key === "c") {
        event.preventDefault();
        shortcuts["alt+c"]?.();
      } else if (shortcuts[key]) {
        // Only trigger single-key shortcuts if no modifier keys are pressed
        if (!ctrlKey && !altKey && !event.shiftKey) {
          shortcuts[key]();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}
