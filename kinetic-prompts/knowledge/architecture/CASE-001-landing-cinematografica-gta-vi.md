---
id: CASE-001
titulo: Estudio de caso — arquitectura de una landing cinematográfica (clon GTA VI de JavaScript Mastery)
categoria: architecture
estado: INVESTIGADO
evidencia: CODIGO_INSPECCIONADO (estructura y 5 de 10 secciones); vídeo NO visto
versiones: React 19.1, gsap ^3.13.0, @gsap/react ^2.1.2, Tailwind 4.1, Vite 6.3, react-responsive 10
perfil: cinematografico
ultima_revision: 2026-10-26
---

# CASE-001 · Arquitectura de una landing cinematográfica

**Fuente.** https://github.com/adrianhajdin/jsm_gta_vi_landing (commit 56b6e63, 2025-06-20). El README remite al canal de YouTube de JavaScript Mastery y declara como funciones: SplitText, ScrollTrigger, parallax, secciones fijadas, vídeo sincronizado, timelines multisección, máscaras de imagen y carrusel animado. Sin licencia explícita.

## Estructura observada

- `src/App.jsx` registra ScrollTrigger una vez y compone 9 secciones en orden: NavBar, Hero, FirstVideo, Jason, SecondVideo, Lucia, PostCard, Final, Outro.
- Cada sección es un componente con su propio `useGSAP` y sus propias timelines: **una sección = un módulo de movimiento**.
- `constants/index.js` concentra valores responsive (hook `useMaskSettings`).
- Recursos pesados en `/public` (webp, mp4, svg). Total de lógica de secciones: ~460 líneas.

## Patrones reutilizables

1. Secciones fijadas encadenadas que se solapan con márgenes negativos para hacer fundidos entre ellas (VID-001, PX-001).
2. Máscara de logo para el hero (MASK-001).
3. Vídeo como "cámara" controlada por scroll en lugar de 3D (VID-001): más barato de producir que Three.js.
4. Registro único de plugins en el componente raíz (coincide con ST-001).

## Debilidades frente a nuestros criterios de calidad

- Selectores globales sin `scope` en `useGSAP` (GS-001).
- Sin tratamiento de `prefers-reduced-motion` en las secciones revisadas (A11Y-001).
- `alt` ausente o genérico en imágenes; titulares con contenido en imágenes.
- Creación de triggers dependiente del orden de montaje de React: correcta aquí porque el orden de render coincide con el de la página (ST-004).

## Uso recomendado

Referencia de **estructura y ritmo narrativo** para el perfil B, no plantilla de calidad de producción. Para el perfil A (negocio) solo son trasladables PX-001 sutil y revelados de texto.

**Lote 2 (2026-10-26):** revisadas las 5 secciones restantes → [TUT-010](../tutorials/TUT-010-jsm-gta-vi-landing.md). La condición de carrera de `onloadedmetadata` se repite en SecondVideo, PostCard y Final; PostCard combina `autoPlay` con scrub; clases Tailwind inválidas en el hover; Outro anima elementos de otra sección. **Pendiente:** localizar el vídeo oficial del tutorial para registrar timestamps.
