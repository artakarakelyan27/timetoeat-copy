import { defineEventHandler, setHeader } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs';
import { a as useRuntimeConfig } from '../nitro/nitro.mjs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/yaml@2.5.1/node_modules/yaml/dist/index.js';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/destr@2.0.5/node_modules/destr/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/hookable@5.5.3/node_modules/hookable/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/ofetch@1.5.1/node_modules/ofetch/dist/node.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/node-mock-http@1.0.4/node_modules/node-mock-http/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/ufo@1.6.4/node_modules/ufo/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/unstorage@1.17.5_db0@0.3.4_ioredis@5.10.1/node_modules/unstorage/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/unstorage@1.17.5_db0@0.3.4_ioredis@5.10.1/node_modules/unstorage/drivers/fs.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/unstorage@1.17.5_db0@0.3.4_ioredis@5.10.1/node_modules/unstorage/drivers/fs-lite.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/unstorage@1.17.5_db0@0.3.4_ioredis@5.10.1/node_modules/unstorage/drivers/lru-cache.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/ohash@2.0.11/node_modules/ohash/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/klona@2.0.6/node_modules/klona/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/defu@6.1.7/node_modules/defu/dist/defu.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/scule@1.3.0/node_modules/scule/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/unctx@2.5.0/node_modules/unctx/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/radix3@1.1.2/node_modules/radix3/dist/index.mjs';
import 'node:fs';
import 'node:url';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/pathe/dist/index.mjs';

const STATIC_URLS = [
  { loc: "/", priority: 1 },
  { loc: "/o-proekte", priority: 0.6 },
  { loc: "/recepty", priority: 0.9 },
  { loc: "/chto-prigotovit", priority: 0.9 },
  { loc: "/chto-prigotovit/iz-togo-chto-est", priority: 0.95 },
  { loc: "/menyu-na-nedelyu", priority: 0.95 },
  { loc: "/spravochnik", priority: 0.7 },
  { loc: "/iz", priority: 0.75 },
  { loc: "/iz-ostatkov", priority: 0.85 },
  { loc: "/gotovim-vprok", priority: 0.6 },
  { loc: "/blog", priority: 0.5 }
];
const sitemap_xml = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const siteUrl = config.public.siteUrl.replace(/\/$/, "");
  const urls = [...STATIC_URLS];
  for (const [file, prefix] of [
    ["content/reference/zameny.yaml", "/spravochnik/zameny"],
    ["content/reference/srok-khraneniya.yaml", "/spravochnik/srok-khraneniya"],
    ["content/iz-ostatkov.yaml", "/iz-ostatkov"]
  ]) {
    try {
      const text = await readFile(resolve(process.cwd(), file), "utf8");
      const items = parse(text);
      for (const it of items || []) {
        if (!(it == null ? void 0 : it.slug)) continue;
        urls.push({
          loc: `${prefix}/${it.slug}`,
          lastmod: it.updated,
          priority: 0.7
        });
      }
    } catch {
    }
  }
  try {
    const { readdir } = await import('node:fs/promises');
    const menyuDir = resolve(process.cwd(), "content/menyu");
    for (const f of await readdir(menyuDir).catch(() => [])) {
      if (!f.endsWith(".yaml")) continue;
      const text = await readFile(resolve(menyuDir, f), "utf8");
      const data = parse(text);
      if (!(data == null ? void 0 : data.slug)) continue;
      urls.push({
        loc: `/menyu-na-nedelyu/${data.slug}`,
        lastmod: data.updated,
        priority: 0.95
        // главная конверсия
      });
    }
  } catch (err) {
    console.warn("[sitemap] menyu skipped:", err);
  }
  const izSlugs = /* @__PURE__ */ new Set();
  for (const file of [
    "content/reference/zameny.yaml",
    "content/reference/srok-khraneniya.yaml",
    "content/iz-ostatkov.yaml"
  ]) {
    try {
      const text = await readFile(resolve(process.cwd(), file), "utf8");
      const items = parse(text);
      for (const it of items || []) {
        if (it == null ? void 0 : it.linked_ingredient) izSlugs.add(it.linked_ingredient);
        if ((it == null ? void 0 : it.slug) && (file.includes("zameny") || file.includes("srok-khraneniya"))) {
          izSlugs.add(it.slug);
        }
      }
    } catch {
    }
  }
  for (const s of izSlugs) {
    urls.push({ loc: `/iz/${s}`, priority: 0.7 });
  }
  const apiBase = config.apiBase;
  if (apiBase) {
    try {
      const recipes = await $fetch(
        `${apiBase}/api/seo/sitemap`,
        { query: { type: "recipes" } }
      ).catch(() => []);
      for (const r of recipes) {
        if (r.slug) {
          urls.push({ loc: `/recepty/${r.slug}`, lastmod: r.updated_at, priority: 0.7 });
        }
      }
    } catch (err) {
      console.warn("[sitemap] backend skipped:", err);
    }
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(
    (u) => `	<url>
		<loc>${siteUrl}${u.loc}</loc>${u.lastmod ? `
		<lastmod>${u.lastmod}</lastmod>` : ""}${u.priority ? `
		<priority>${u.priority}</priority>` : ""}
	</url>`
  ).join("\n")}
</urlset>`;
  setHeader(event, "Content-Type", "application/xml; charset=utf-8");
  return xml;
});

export { sitemap_xml as default };
//# sourceMappingURL=sitemap.xml.mjs.map
