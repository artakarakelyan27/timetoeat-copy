import { defineEventHandler, getQuery, createError } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs';
import { l as loadYaml } from '../../../_/load-content.mjs';
import 'node:fs/promises';
import 'node:path';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/yaml@2.5.1/node_modules/yaml/dist/index.js';

const KNOWN_SLUGS = ["dlya-semi", "pp", "byudzhetnoe"];
const menyu_get = defineEventHandler(async (event) => {
  var _a, _b, _c;
  const slug = getQuery(event).slug;
  if (slug) {
    if (!KNOWN_SLUGS.includes(slug)) {
      throw createError({ statusCode: 404, statusMessage: "\u041C\u0435\u043D\u044E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
    }
    const data = await loadYaml(`menyu/${slug}.yaml`);
    return data;
  }
  const out = [];
  for (const s of KNOWN_SLUGS) {
    try {
      const d = await loadYaml(`menyu/${s}.yaml`);
      out.push({
        slug: d.slug,
        title: d.title,
        emoji: d.emoji,
        short_answer: d.short_answer,
        audience: d.audience,
        avg_kcal: ((_a = d.totals) == null ? void 0 : _a.avg_kcal) || ((_b = d.totals) == null ? void 0 : _b.avg_kcal_per_person) || ((_c = d.totals) == null ? void 0 : _c.avg_kcal_adult),
        weekly_budget_hint: d.weekly_budget_hint,
        updated: d.updated
      });
    } catch {
    }
  }
  return out;
});

export { menyu_get as default };
//# sourceMappingURL=menyu.get.mjs.map
