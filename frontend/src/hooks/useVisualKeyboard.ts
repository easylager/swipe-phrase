"use client";

import { useEffect, useState } from "react";

/** Detect software keyboard on mobile via visualViewport shrink. */
export function useVisualKeyboard() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      setOpen(vv.height < window.innerHeight * 0.82);
    };

    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, []);

  return open;
}
