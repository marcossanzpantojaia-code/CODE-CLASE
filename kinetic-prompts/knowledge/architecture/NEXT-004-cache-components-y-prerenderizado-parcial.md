---
id: NEXT-004
titulo: Next.js 16 — Cache Components ("use cache", cacheLife, cacheTag), prerenderizado parcial con Suspense, APIs de petición y cómo estructurar una web comercial para que la carcasa estática salga del CDN
categoria: architecture
estado: INVESTIGADO
evidencia: DOCUMENTACION_OFICIAL_ANALIZADA (nextjs.org/docs/app/getting-started/caching, actualizada el 2026-10-06)
versiones: Next.js 16 (Cache Components desde 16.0.0); `partialPrefetching` como opción aparte
perfil: comercial (también B si usa Next.js)
ultima_revision: 2026-10-27
---

# NEXT-004 · Cache Components y prerenderizado parcial

1. **Nombre y finalidad.** Decidir qué partes de una página Next.js se sirven como HTML estático desde el CDN (rápido para LCP y SEO local) y cuáles se transmiten en cada petición (disponibilidad de citas, sesión). Completa NEXT-001/002/003 y SEC-003, que no trataban la caché del modelo nuevo.
2. **Fuente.** https://nextjs.org/docs/app/getting-started/caching (y referencias enlazadas: `use cache`, `cacheLife`, `cacheComponents`, `partialPrefetching`).
3. **Ubicación.** Secciones *Enabling*, *Usage*, *Streaming uncached data*, *Working with runtime APIs*, *Random values*, *Prerendering*, *Maximizing the static shell*, *Where cached content is stored*, *Bots and crawlers*.
4. **Resultado.** Página con carcasa estática (cabecera, servicios, precios cacheados, *fallbacks*) y huecos que llegan en *streaming*.
5. **Explicación técnica [doc].**
   - **Activar:** `cacheComponents: true` y `partialPrefetching: true` en `next.config.ts` (las apps nuevas con `create-next-app` ya los traen; dejar `partialPrefetching` sin valor da un aviso; ambas opciones desaparecerán en la próxima versión mayor, activas siempre). Con Cache Components, los Route Handlers `GET` siguen el mismo modelo de prerenderizado.
   - **`'use cache'`** al inicio de una función asíncrona (nivel datos) o de un componente/página (nivel UI); al inicio de un archivo cachea todas sus exportaciones. Argumentos y valores capturados forman parte de la **clave de caché**. Recomendado acompañarlo siempre de **`cacheLife('hours')`** (u otro perfil); sin él se aplica `default`. `cacheTag('posts')` para revalidar por etiqueta (ver *Revalidating*).
   - **Datos sin caché o APIs de petición** (`cookies`, `headers`, `searchParams`, `params` no conocidos): dentro de **`<Suspense>`**; el *fallback* forma parte de la carcasa y el contenido llega por *streaming*. Sin Suspense, el *overlay* de desarrollo muestra el aviso **blocking-route**. Leer `cookies()` **ya no vuelve dinámica toda la ruta** (a diferencia del modelo anterior).
   - **`'use cache: private'`** para funciones que leen cookies/cabeceras y pueden entrar en un *prefetch*; **`'use cache: remote'`** para caché duradera compartida entre instancias (compensa solo con tasa de acierto alta). Por defecto la caché en tiempo de ejecución es **en memoria por instancia** (efímera en *serverless*). Todas las cachés son **por despliegue** (la clave incluye el id de build).
   - **Valores aleatorios y hora** (`Math.random()`, `Date.now()`, `crypto.randomUUID()`): o `await connection()` + `<Suspense>` (un valor por petición) o `'use cache'` (uno compartido). `performance.now()` no se vigila.
   - **Valores predecibles** (imports, `fs.readFileSync`, cálculos puros, SQLite síncrono) se prerenderizan solos; lecturas asíncronas fijas (configuración, fuentes) → **a nivel de módulo**.
   - **Maximizar la carcasa:** esperar `params`/`cookies()` lo **más abajo** posible del árbol (pasar la promesa hacia abajo y resolverla dentro de un Suspense) para que el *layout* siga siendo estático.
   - **Bots:** Next.js detecta algunos rastreadores por *user agent* y les renderiza la página completa en la petición (para que vean los metadatos en `<head>`); las fuentes de datos del build deben existir también en tiempo de ejecución o esos bots reciben un 500.
6. **Dependencias.** Next.js 16 con App Router, React 19.
7. **Procedimiento para una web comercial (adaptación; no ejecutada).**
   1. Servicios, precios, horario y textos del CMS → funciones `'use cache'` + `cacheLife('hours')` + `cacheTag('servicios')`; revalidar la etiqueta al publicar en el CMS.
   2. Disponibilidad de citas, saludo con sesión, carrito → componentes con `<Suspense fallback>` (o `connection()`), nunca cacheados con datos de otro usuario (SEC-003).
   3. JSON-LD `LocalBusiness` y metadatos (SEO-002) a partir de datos cacheados, para que estén en la carcasa y en la respuesta a bots.
   4. *Fallbacks* con el tamaño final reservado (CLS, PERF-001).
   5. Animaciones GSAP solo en componentes cliente dentro de la carcasa (NEXT-001, GS-001).
8. **Parámetros.** Perfiles de `cacheLife` (`hours` en los ejemplos), etiquetas, variantes `private`/`remote`.
9. **Código (adaptación de los ejemplos de la doc; no ejecutada):**
   ```tsx
   import { cacheLife, cacheTag } from 'next/cache'
   async function Servicios() { 'use cache'; cacheLife('hours'); cacheTag('servicios')
     const s = await cms.servicios(); return <ul>{s.map(x => <li key={x.id}>{x.nombre} · {x.precio} €</li>)}</ul> }
   export default function Page() {
     return (<><h1>Barbería en Chamberí</h1><Servicios />
       <Suspense fallback={<p style={{minHeight: 120}}>Cargando disponibilidad…</p>}><Disponibilidad /></Suspense></>) }
   ```
10. **Errores habituales.** Cachear datos dependientes de la sesión con `'use cache'` normal (fuga entre usuarios — usar el patrón de pasar el valor como argumento o `private`); leer `params` en el *layout* raíz (toda la ruta dinámica); `Date.now()` en el render; olvidar `partialPrefetching`; confiar en la caché en memoria en *serverless*.
11. **Rendimiento / a11y.** La carcasa estática desde CDN favorece LCP; *fallbacks* accesibles (texto, no solo animación) y sin saltos.
12. **Compatibilidad.** Next.js 16+; el modelo anterior está en la guía "Caching and Revalidating (Previous Model)".
13. **Aplicaciones.** Barbería o clínica con reservas, catálogo de servicios, blog del negocio.
14. **Pruebas.** `next build` sin avisos *blocking-route*; ver el HTML inicial (servicios y JSON-LD presentes); dos sesiones distintas no ven datos ajenos; revalidación por etiqueta tras editar en el CMS.
15. **Estado.** Documentación oficial leída; nada ejecutado.
