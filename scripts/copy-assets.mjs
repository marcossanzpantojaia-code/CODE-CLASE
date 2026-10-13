// Copies non-TypeScript runtime assets (SQL migrations) into dist/.
import { cp, mkdir } from 'node:fs/promises';

await mkdir('dist/db/migrations', { recursive: true });
await cp('src/db/migrations', 'dist/db/migrations', { recursive: true });
