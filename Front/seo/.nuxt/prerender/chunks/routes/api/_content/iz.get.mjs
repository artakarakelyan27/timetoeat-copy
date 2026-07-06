import { defineEventHandler, getQuery, createError } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs';
import { l as loadYaml } from '../../../_/load-content.mjs';
import 'node:fs/promises';
import 'node:path';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/yaml@2.5.1/node_modules/yaml/dist/index.js';

async function collectKnownSlugs() {
  const slugs = /* @__PURE__ */ new Set();
  for (const file of [
    "reference/zameny.yaml",
    "reference/srok-khraneniya.yaml"
  ]) {
    try {
      const items = await loadYaml(file);
      for (const it of items || []) {
        if (it.linked_ingredient) slugs.add(it.linked_ingredient);
        if (it.slug) slugs.add(it.slug);
      }
    } catch {
    }
  }
  try {
    const ostatki = await loadYaml("iz-ostatkov.yaml");
    for (const it of ostatki || []) {
      if (it.linked_ingredient) slugs.add(it.linked_ingredient);
    }
  } catch {
  }
  return slugs;
}
async function buildIngredient(slug) {
  const known = await collectKnownSlugs();
  if (!known.has(slug)) return null;
  const out = {
    slug,
    name: slug,
    emoji: "\u{1F958}",
    zamenySlug: null,
    zamenyShort: null,
    srokKhraneniyaSlug: null,
    srokKhraneniyaShort: null,
    ostatkiSlug: null,
    ostatkiShort: null
  };
  try {
    const zameny = await loadYaml("reference/zameny.yaml");
    const z = zameny.find((x) => x.slug === slug || x.linked_ingredient === slug);
    if (z) {
      out.zamenySlug = z.slug;
      out.zamenyShort = z.short_answer || null;
      out.name = z.name || out.name;
      out.emoji = z.emoji || out.emoji;
    }
  } catch {
  }
  try {
    const sk = await loadYaml("reference/srok-khraneniya.yaml");
    const s = sk.find((x) => x.slug === slug || x.linked_ingredient === slug);
    if (s) {
      out.srokKhraneniyaSlug = s.slug;
      out.srokKhraneniyaShort = s.short_answer || null;
      if (out.name === slug) out.name = s.name;
      if (out.emoji === "\u{1F958}") out.emoji = s.emoji;
    }
  } catch {
  }
  try {
    const ostatki = await loadYaml("iz-ostatkov.yaml");
    const o = ostatki.find((x) => x.linked_ingredient === slug);
    if (o) {
      out.ostatkiSlug = o.slug;
      out.ostatkiShort = o.short_answer || null;
      if (out.name === slug) out.name = o.source_name || o.name;
      if (out.emoji === "\u{1F958}") out.emoji = o.emoji;
    }
  } catch {
  }
  return out;
}
const iz_get = defineEventHandler(async (event) => {
  const slug = getQuery(event).slug;
  if (slug) {
    const data = await buildIngredient(slug);
    if (!data) {
      throw createError({ statusCode: 404, statusMessage: "\u0418\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
    }
    return data;
  }
  const known = await collectKnownSlugs();
  const list = [];
  for (const s of known) {
    const info = await buildIngredient(s);
    if (info) list.push(info);
  }
  list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  return list;
});

export { iz_get as default };
//# sourceMappingURL=iz.get.mjs.map
