import { animate, useMotionValue, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef } from "react";

const DRAG_START_PX = 8;
const SWIPE_OFFSET_PX = 40;
const SWIPE_VELOCITY = 0.22; // px/ms upward
const TAP_MAX_PX = 12;
const TAP_MAX_MS = 280;

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return !!target.closest("button, a, input, textarea, select, [data-no-swipe]");
}

interface UseCardSwipeOptions {
  onSwipeUp: () => void;
  onTap: () => void;
  disabled?: boolean;
}

/** Full-surface swipe with window-level tracking — works from any point on the card. */
export function useCardSwipe({ onSwipeUp, onTap, disabled }: UseCardSwipeOptions) {
  const y = useMotionValue(0);
  const scale = useTransform(y, [-320, 0], [0.92, 1]);
  const opacity = useTransform(y, [-320, 0], [0.5, 1]);

  const startRef = useRef<{ y: number; x: number; t: number; pointerId: number } | null>(null);
  const draggingRef = useRef(false);
  const lockedRef = useRef(false);
  const lastMoveRef = useRef<{ y: number; t: number } | null>(null);

  const onSwipeUpRef = useRef(onSwipeUp);
  const onTapRef = useRef(onTap);
  const disabledRef = useRef(disabled);

  useEffect(() => {
    onSwipeUpRef.current = onSwipeUp;
  }, [onSwipeUp]);

  useEffect(() => {
    onTapRef.current = onTap;
  }, [onTap]);

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  const resetGesture = useCallback(() => {
    startRef.current = null;
    draggingRef.current = false;
    lastMoveRef.current = null;
  }, []);

  const finishGesture = useCallback(
    async (clientY: number) => {
      const start = startRef.current;
      if (!start || disabledRef.current) {
        resetGesture();
        return;
      }

      const dy = clientY - start.y;
      const dt = Math.max(Date.now() - start.t, 1);
      const velocity = dy / dt;
      const last = lastMoveRef.current;
      const flingVelocity =
        last && Date.now() - last.t < 120 ? (clientY - last.y) / Math.max(Date.now() - last.t, 1) : velocity;
      const wasDrag = draggingRef.current;

      resetGesture();

      if (wasDrag) {
        const shouldSwipe = dy < -SWIPE_OFFSET_PX || flingVelocity < -SWIPE_VELOCITY;
        if (shouldSwipe) {
          lockedRef.current = true;
          await animate(y, -window.innerHeight, {
            duration: 0.24,
            ease: [0.32, 0.72, 0, 1],
          });
          y.set(0);
          lockedRef.current = false;
          onSwipeUpRef.current();
        } else {
          animate(y, 0, { type: "spring", stiffness: 480, damping: 36 });
        }
        return;
      }

      const elapsed = Date.now() - start.t;
      if (Math.abs(dy) <= TAP_MAX_PX && elapsed <= TAP_MAX_MS) {
        onTapRef.current();
      }
    },
    [resetGesture, y],
  );

  useEffect(() => {
    const onWindowMove = (e: PointerEvent) => {
      const start = startRef.current;
      if (!start || disabledRef.current || e.pointerId !== start.pointerId) return;

      const dy = e.clientY - start.y;
      const dx = e.clientX - start.x;

      if (!draggingRef.current && Math.hypot(dx, dy) > DRAG_START_PX) {
        // Vertical intent wins — swipe beats scroll/tap ambiguity.
        if (Math.abs(dy) >= Math.abs(dx)) {
          draggingRef.current = true;
        } else {
          resetGesture();
          return;
        }
      }

      if (draggingRef.current) {
        e.preventDefault();
        y.set(Math.min(0, dy));
        lastMoveRef.current = { y: e.clientY, t: Date.now() };
      }
    };

    const onWindowUp = (e: PointerEvent) => {
      const start = startRef.current;
      if (!start || e.pointerId !== start.pointerId) return;
      finishGesture(e.clientY);
    };

    const onWindowCancel = (e: PointerEvent) => {
      const start = startRef.current;
      if (!start || e.pointerId !== start.pointerId) return;
      resetGesture();
      animate(y, 0, { type: "spring", stiffness: 480, damping: 36 });
    };

    window.addEventListener("pointermove", onWindowMove, { passive: false });
    window.addEventListener("pointerup", onWindowUp);
    window.addEventListener("pointercancel", onWindowCancel);

    return () => {
      window.removeEventListener("pointermove", onWindowMove);
      window.removeEventListener("pointerup", onWindowUp);
      window.removeEventListener("pointercancel", onWindowCancel);
    };
  }, [finishGesture, resetGesture, y]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      if (disabledRef.current || lockedRef.current) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      if (isInteractiveTarget(e.target)) return;

      startRef.current = { y: e.clientY, x: e.clientX, t: Date.now(), pointerId: e.pointerId };
      draggingRef.current = false;
      lastMoveRef.current = null;
    },
    [],
  );

  return {
    y,
    scale,
    opacity,
    handlers: {
      onPointerDown,
      style: { touchAction: "none" as const },
    },
  };
}
