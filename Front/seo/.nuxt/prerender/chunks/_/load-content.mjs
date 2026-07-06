import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/yaml@2.5.1/node_modules/yaml/dist/index.js';

const CACHE = /* @__PURE__ */ new Map();
async function loadYaml(relPath) {
  if (CACHE.has(relPath)) return CACHE.get(relPath);
  const full = resolve(process.cwd(), "content", relPath);
  const text = await readFile(full, "utf8");
  const parsed = parse(text);
  return parsed;
}

export { loadYaml as l };
//# sourceMappingURL=load-content.mjs.map
