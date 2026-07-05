"use client";

import { useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";

export function PwaBootstrap() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
