import { useEffect, useMemo, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { clamp, boundPanelWidths } from '../../shared/utils';
import { activityBarWidth, combinedResizerWidth, editorMinWidth, sidebarMinWidth, aiPanelMinWidth } from '../constants';

export function usePanelResize(
  sidebarWidth: number,
  aiPanelWidth: number,
  onSettingsChange: (updater: (prev: { sidebarWidth: number; aiPanelWidth: number }) => { sidebarWidth: number; aiPanelWidth: number }) => void,
) {
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);

  useEffect(() => {
    function onResize() {
      setViewportWidth(window.innerWidth);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const panelWidths = useMemo(
    () => boundPanelWidths(sidebarWidth, aiPanelWidth, viewportWidth),
    [aiPanelWidth, sidebarWidth, viewportWidth],
  );

  function startPanelResize(panel: 'sidebar' | 'ai', event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault();
    const startX = event.clientX;
    const initialWidth = panel === 'sidebar' ? panelWidths.sidebar : panelWidths.ai;

    function onPointerMove(pointerEvent: PointerEvent) {
      const delta = pointerEvent.clientX - startX;
      const nextWidth = panel === 'sidebar' ? initialWidth + delta : initialWidth - delta;
      const availableWidth = window.innerWidth - activityBarWidth - combinedResizerWidth - editorMinWidth;
      const otherPanelWidth = panel === 'sidebar' ? panelWidths.ai : panelWidths.sidebar;
      const minWidth = panel === 'sidebar' ? sidebarMinWidth : aiPanelMinWidth;
      const maxWidth = Math.max(minWidth, availableWidth - otherPanelWidth);
      const boundedWidth = clamp(nextWidth, minWidth, maxWidth);

      onSettingsChange((current) => ({
        ...current,
        [panel === 'sidebar' ? 'sidebarWidth' : 'aiPanelWidth']: boundedWidth,
      }));
    }

    function onPointerUp() {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      document.body.classList.remove('is-resizing-panel');
    }

    document.body.classList.add('is-resizing-panel');
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  return { panelWidths, viewportWidth, startPanelResize };
}
