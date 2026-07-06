import { defineEventHandler, getQuery, createError } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs';
import { l as loadYaml } from '../../../_/load-content.mjs';
import 'node:fs/promises';
import 'node:path';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/yaml@2.5.1/node_modules/yaml/dist/index.js';

const izOstatkov_get = defineEventHandler(async (event) => {
  const slug = getQuery(event).slug;
  const data = await loadYaml("iz-ostatkov.yaml");
  if (slug) {
    const item = data.find((x) => x.slug === slug);
    if (!item) throw createError({ statusCode: 404, statusMessage: "Not found" });
    return item;
  }
  return data.map((x) => ({
    slug: x.slug,
    name: x.name,
    source_name: x.source_name,
    emoji: x.emoji,
    short_answer: x.short_answer
  }));
});

export { izOstatkov_get as default };
//# sourceMappingURL=iz-ostatkov.get.mjs.map
