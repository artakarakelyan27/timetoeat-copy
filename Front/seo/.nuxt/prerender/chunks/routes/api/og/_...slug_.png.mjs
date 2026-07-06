import { defineEventHandler, getRouterParam, setHeader } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs';
import { a as useRuntimeConfig } from '../../../nitro/nitro.mjs';
import satori from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/satori@0.11.2/node_modules/satori/dist/index.js';
import { Resvg } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/@resvg+resvg-js@2.6.2/node_modules/@resvg/resvg-js/index.js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { colors, brand } from 'file:///var/www/time-to-eat-copy/Front/packages/design-tokens/index.js';
import { mealVisual } from 'file:///var/www/time-to-eat-copy/Front/packages/design-tokens/meals.js';
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

let fontsCache = null;
async function loadFonts() {
  if (fontsCache) return fontsCache;
  const base = resolve(process.cwd(), "assets/fonts");
  const [pf, dmRegular, dmBold] = await Promise.all([
    readFile(`${base}/PlayfairDisplay-Bold.ttf`),
    readFile(`${base}/DMSans-Regular.ttf`),
    readFile(`${base}/DMSans-Bold.ttf`)
  ]);
  fontsCache = [
    { name: "Playfair Display", data: pf, weight: 800, style: "normal" },
    { name: "DM Sans", data: dmRegular, weight: 400, style: "normal" },
    { name: "DM Sans", data: dmBold, weight: 700, style: "normal" }
  ];
  return fontsCache;
}
function template(d) {
  const bg = d.bgColor || (d.mealType ? mealVisual(d.mealType).bg : colors.gp);
  const fg = d.mealType ? mealVisual(d.mealType).fg : colors.t1;
  return {
    type: "div",
    props: {
      style: {
        width: "1200px",
        height: "630px",
        display: "flex",
        flexDirection: "column",
        padding: "60px 80px",
        background: bg,
        fontFamily: "DM Sans",
        color: fg,
        position: "relative"
      },
      children: [
        // Верхний бренд-бар
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "14px",
              fontSize: "24px",
              fontWeight: 800,
              fontFamily: "Playfair Display",
              color: colors.gd
            },
            children: [
              // Логомарк
              {
                type: "div",
                props: {
                  style: {
                    width: "40px",
                    height: "40px",
                    borderRadius: "8px",
                    background: brand.gradient,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center"
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { width: "8px", height: "8px", borderRadius: "50%", background: colors.g }
                            }
                          }
                        ]
                      }
                    }
                  ]
                }
              },
              { type: "span", props: { children: "\u0412\u0440\u0435\u043C\u044F \u0415\u0441\u0442\u044C" } }
            ]
          }
        },
        // Основная зона — гигантский emoji + текст
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "50px",
              marginTop: "60px",
              flex: 1
            },
            children: [
              // Emoji-плашка
              d.emoji ? {
                type: "div",
                props: {
                  style: {
                    width: "280px",
                    height: "280px",
                    borderRadius: "32px",
                    background: "#fff",
                    boxShadow: "0 16px 48px rgba(26,46,34,0.18)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "180px",
                    lineHeight: 1,
                    flexShrink: 0
                  },
                  children: [{ type: "span", props: { children: d.emoji } }]
                }
              } : null,
              // Текстовый блок
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    gap: "20px",
                    flex: 1
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "56px",
                          fontWeight: 800,
                          fontFamily: "Playfair Display",
                          lineHeight: 1.15,
                          color: colors.t1
                        },
                        children: [{ type: "span", props: { children: d.title } }]
                      }
                    },
                    d.subtitle && {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "28px",
                          fontWeight: 500,
                          color: colors.t2
                        },
                        children: [{ type: "span", props: { children: d.subtitle } }]
                      }
                    }
                  ].filter(Boolean)
                }
              }
            ].filter(Boolean)
          }
        },
        // Нижний бар — мета-цифры
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "32px",
              fontSize: "24px",
              fontWeight: 700,
              color: colors.gd,
              marginTop: "20px"
            },
            children: [
              d.timeMin ? { type: "div", props: { children: `\u23F1 ${d.timeMin} \u043C\u0438\u043D` } } : null,
              d.kcal ? { type: "div", props: { children: `\u{1F525} ${d.kcal} \u043A\u043A\u0430\u043B` } } : null,
              {
                type: "div",
                props: {
                  style: { marginLeft: "auto", color: colors.t3, fontSize: "20px" },
                  children: "plus-time.ru"
                }
              }
            ].filter(Boolean)
          }
        }
      ]
    }
  };
}
const ____slug__png = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const slugParts = getRouterParam(event, "slug") || "default";
  const segments = String(slugParts).replace(/\.png$/, "").split("/");
  let kind = "default";
  let lookupSlug = "";
  if (segments[0] === "recepty") {
    kind = "recipe";
    lookupSlug = segments[1] || "";
  } else if (segments[0] === "iz" || segments[0] === "iz-ostatkov") {
    kind = "ingredient";
    lookupSlug = segments[1] || "";
  } else if (segments[0] === "menyu-na-nedelyu") {
    kind = "menu";
    lookupSlug = segments[1] || "";
  } else if (segments[0] === "spravochnik") {
    kind = "reference";
    lookupSlug = segments.slice(1).join("/");
  } else if (segments[0] === "chto-prigotovit" || segments[0] === "sezon" || segments[0] === "gotovim-vprok") {
    kind = "hub";
    lookupSlug = segments.slice(1).join("/");
  }
  let data = {
    kind,
    title: "\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E \u0437\u0430 60 \u0441\u0435\u043A\u0443\u043D\u0434",
    subtitle: "plus-time.ru",
    emoji: "\u{1F37D}\uFE0F",
    bgColor: colors.gp
  };
  if (kind !== "default" && lookupSlug) {
    try {
      const fetched = await $fetch(`${config.apiBase}/api/seo/og-data`, {
        query: { kind, slug: lookupSlug }
      });
      if (fetched) data = { ...data, ...fetched, kind };
    } catch (err) {
      console.warn("[og] backend lookup failed", err);
    }
  }
  const fonts = await loadFonts();
  const svg = await satori(template(data), { width: 1200, height: 630, fonts });
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } }).render().asPng();
  setHeader(event, "Content-Type", "image/png");
  setHeader(event, "Cache-Control", "public, max-age=86400, s-maxage=86400, immutable");
  return png;
});

export { ____slug__png as default };
//# sourceMappingURL=_...slug_.png.mjs.map
