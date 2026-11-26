---
id: SEC-001
titulo: Cabeceras de seguridad HTTP y Content Security Policy (incluido Next.js)
categoria: security
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (OWASP HTTP Headers Cheat Sheet; Next.js "Content Security Policy", act. 2026-03-20)
versiones: Next.js App Router con `proxy.ts` (nombre vigente en la doc consultada)
perfil: ambos (obligatorio en comercial)
ultima_revision: 2026-10-26
---

# SEC-001 · Cabeceras y CSP

1. **Finalidad.** Reducir XSS, clickjacking, filtrado de información y uso indebido de APIs del navegador en cualquier web publicada.
2. **Fuentes.** cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html · nextjs.org/docs/app/guides/content-security-policy.
3. **Cabeceras recomendadas (OWASP).** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (cuidado: un error bloquea a los usuarios durante todo el max-age; revisar requisitos de preload) · `X-Content-Type-Options: nosniff` · `Content-Security-Policy` con `frame-ancestors` (sustituye a `X-Frame-Options: DENY`, que queda como legado) · `Referrer-Policy: strict-origin-when-cross-origin` · `Permissions-Policy: geolocation=(), camera=(), microphone=()` (desactivar lo que no se use) · `Cross-Origin-Opener-Policy: same-origin` · `Cross-Origin-Resource-Policy: same-site` · `Cross-Origin-Embedder-Policy: require-corp` (probar: puede romper contenido de terceros) · `Content-Type: text/html; charset=UTF-8` · `Cache-Control: no-store` en respuestas sensibles.
4. **Evitar o quitar (OWASP).** `X-XSS-Protection` (no enviarla ni ponerla a 0), `X-Powered-By`, `Server` informativo, `Expect-CT`, `Public-Key-Pins`.
5. **CSP en Next.js (doc oficial).**
   - **Con nonces:** `proxy.ts` genera un nonce por petición y construye la política (`default-src 'self'; script-src 'self' 'nonce-…' 'strict-dynamic'; style-src 'self' 'nonce-…'; img-src 'self' blob: data:; font-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; upgrade-insecure-requests`). Next.js aplica el nonce automáticamente a sus scripts. **Exige renderizado dinámico** (sin estático/ISR, sin caché CDN por defecto, incompatible con PPR) → más coste y peor rendimiento. En desarrollo hace falta `'unsafe-eval'` (no en producción).
   - **Sin nonces:** política en `headers()` de `next.config.js` (con `'unsafe-inline'` para scripts y estilos) → mantiene el estático.
   - **SRI experimental:** hashes en build (`experimental.sri`), compatible con estático; solo App Router.
   - Terceros (p. ej. Google Tag Manager): añadir sus dominios a `script-src`/`connect-src`/`img-src` y pasar el nonce.
6. **Decisión para webs comerciales (análisis propio).** Una landing estática de negocio sin datos sensibles: cabeceras OWASP + CSP sin nonce (o SRI si se valida) para conservar CDN y LCP (PERF-001). Formularios con datos personales o pagos: valorar nonce + dinámico.
7. **Interacción con la biblioteca (análisis propio).** Librerías de animación que inyectan estilos inline (framer-motion, GSAP escriben `style=""` en elementos) — los atributos `style` dependen de `style-src` (`'unsafe-inline'` o `'unsafe-hashes'`; **verificar** en cada caso antes de una CSP estricta). `resolve-lygia` (SCN-001) cargaría código remoto → incompatible con `script-src 'self'` salvo empaquetado local. WebGL con `blob:`/`data:` para texturas → `img-src blob: data:` ya incluido en el ejemplo oficial.
8–9. **Parámetros / código.** Valores del §3 y §5 (de la documentación).
10. **Errores habituales.** HSTS con preload sin preparar subdominios; CSP copiada sin probar (rompe analítica, fuentes o el visor 3D); confiar en `X-XSS-Protection`.
11. **Accesibilidad.** n/a.
12. **Compatibilidad.** Cabeceras estándar; CSP nivel 3 (`strict-dynamic`) en navegadores actuales.
13. **Aplicaciones.** Toda web publicada.
14. **Pruebas.** Comprobar cabeceras en DevTools (Network) o un analizador de cabeceras; consola sin violaciones CSP; modo `Content-Security-Policy-Report-Only` antes de aplicar.
15. **Estado de evidencia.** Documentación oficial leída. §6–7 = análisis propio.
