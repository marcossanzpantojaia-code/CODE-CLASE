// Copia las demos y los vídeos de content/ a public/contenido/ para que Next los sirva como
// estáticos (con soporte de Range, que Safari necesita para el vídeo). Solo se copian las
// carpetas preview/ y media/ de cada elemento; item.json y prompt.md se leen en el servidor.
// Uso: node scripts/sync-content.mjs [--watch]
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, watch } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const source = join(root, "content");
const target = join(root, "public", "contenido");
const SECTIONS = ["animaciones", "webs"];
const PUBLIC_DIRS = ["preview", "media"];

function sync() {
  rmSync(target, { recursive: true, force: true });
  let copied = 0;
  for (const section of SECTIONS) {
    const dir = join(source, section);
    if (!existsSync(dir)) continue;
    for (const slug of readdirSync(dir, { withFileTypes: true })) {
      if (!slug.isDirectory() || !/^[a-z0-9-]+$/.test(slug.name)) continue;
      for (const sub of PUBLIC_DIRS) {
        const from = join(dir, slug.name, sub);
        if (!existsSync(from)) continue;
        const to = join(target, section, slug.name, sub);
        mkdirSync(to, { recursive: true });
        cpSync(from, to, { recursive: true });
        copied++;
      }
    }
  }
  return copied;
}

console.log(`contenido: ${sync()} carpetas copiadas a public/contenido`);

if (process.argv.includes("--watch")) {
  let timer;
  watch(source, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => console.log(`contenido: ${sync()} carpetas copiadas de nuevo`), 150);
  });
  console.log("contenido: vigilando content/ …");
}
