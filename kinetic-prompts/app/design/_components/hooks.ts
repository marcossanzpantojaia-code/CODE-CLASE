"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/**
 * Lee los valores calculados de variables CSS en :root. Devuelve una cadena estable
 * («--bg=valor;--surface=valor;…») para que useSyncExternalStore no vuelva a renderizar sin cambios.
 */
export function useCssVars(names: readonly string[]): Record<string, string> | null {
  const snapshot = useSyncExternalStore(
    noopSubscribe,
    () => {
      const styles = getComputedStyle(document.documentElement);
      return names.map((name) => `${name}=${styles.getPropertyValue(name).trim()}`).join(";");
    },
    () => null,
  );
  if (snapshot === null) return null;
  return Object.fromEntries(snapshot.split(";").map((entry) => entry.split("=") as [string, string]));
}

function subscribeReducedMotion(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/** true si el sistema pide movimiento reducido (null durante el render en servidor). */
export function useReducedMotion(): boolean | null {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => null,
  );
}
