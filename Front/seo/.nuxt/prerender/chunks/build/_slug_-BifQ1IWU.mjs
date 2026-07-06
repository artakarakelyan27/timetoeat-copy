import { _ as __nuxt_component_0 } from './Breadcrumbs-DSi9QbCQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, withAsyncContext, computed, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/server-renderer/index.mjs';
import { f as useRoute, c as createError, u as useHead } from './server.mjs';
import { u as useAsyncData } from './asyncData-DEJTKb-b.mjs';
import { u as useSeoHead } from './useSeoHead-Cf0asDsx.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/ufo/dist/index.mjs';
import 'node:http';
import 'node:https';
import 'node:zlib';
import 'node:stream';
import 'node:buffer';
import 'node:util';
import 'node:url';
import 'node:net';
import 'node:fs';
import 'node:path';
import '../_/renderer.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue-bundle-renderer@2.2.0/node_modules/vue-bundle-renderer/dist/runtime.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/h3@1.15.11/node_modules/h3/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/devalue@5.8.0/node_modules/devalue/index.js';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/ufo@1.6.4/node_modules/ufo/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.34_typescript@5.6.2/node_modules/vue/server-renderer/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/@unhead+ssr@1.11.20/node_modules/@unhead/ssr/dist/index.mjs';
import '../nitro/nitro.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/destr@2.0.5/node_modules/destr/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/hookable@5.5.3/node_modules/hookable/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/ofetch@1.5.1/node_modules/ofetch/dist/node.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/node-mock-http@1.0.4/node_modules/node-mock-http/dist/index.mjs';
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
import 'file:///var/www/time-to-eat-copy/Front/node_modules/pathe/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/unhead@1.11.20/node_modules/unhead/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.34_typescript@5.6.2/node_modules/vue/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/@unhead+shared@1.11.20/node_modules/@unhead/shared/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/hookable/dist/index.mjs';
import 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue-router@4.4.5_vue@3.5.12_typescript@5.6.2_/node_modules/vue-router/dist/vue-router.node.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "[slug]",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    const route = useRoute();
    const slug = route.params.slug;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      `ostatki-${slug}`,
      () => $fetch("/api/_content/iz-ostatkov", { query: { slug } })
    )), __temp = await __temp, __restore(), __temp);
    if (!data.value) throw createError({ statusCode: 404, statusMessage: "\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
    const { data: ingMeta } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData(`ostatki-${slug}-ing`, async () => {
      var _a2;
      const li = (_a2 = data.value) == null ? void 0 : _a2.linked_ingredient;
      if (!li) return null;
      try {
        return await $fetch("/api/_content/iz", { query: { slug: li } });
      } catch {
        return null;
      }
    })), __temp = await __temp, __restore(), __temp);
    const titleText = computed(() => `\u0427\u0442\u043E \u043F\u0440\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0438\u0437 ${data.value.name}`);
    useSeoHead({
      title: `\u0427\u0442\u043E \u043F\u0440\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0438\u0437 ${data.value.name} \u2014 \u0440\u0435\u0446\u0435\u043F\u0442\u044B \u0437\u0430 5\u201320 \u043C\u0438\u043D\u0443\u0442`,
      description: data.value.short_answer.slice(0, 158),
      path: `/iz-ostatkov/${slug}`,
      ogSlug: `iz-ostatkov/${slug}`
    });
    const schemas = [];
    for (const scen of data.value.scenarios || []) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: scen.title,
        totalTime: parseTimeToISO(scen.time),
        step: scen.steps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text: s
        }))
      });
    }
    if ((_a = data.value.faq) == null ? void 0 : _a.length) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.value.faq.map((q) => ({
          "@type": "Question",
          name: q.q,
          acceptedAnswer: { "@type": "Answer", text: stripMarkdown(q.a) }
        }))
      });
    }
    useHead({
      script: schemas.map((s) => ({ type: "application/ld+json", children: JSON.stringify(s) }))
    });
    function formatDate(d) {
      if (!d) return "";
      return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    }
    function parseTimeToISO(t) {
      const m = t.match(/(\d+)\s*мин/);
      return m ? `PT${m[1]}M` : "";
    }
    function renderInlineLinks(text) {
      return text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    }
    function stripMarkdown(text) {
      return text.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b, _c, _d, _e;
      const _component_Breadcrumbs = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      if (unref(data)) {
        _push(`<article${ssrRenderAttrs(_attrs)} data-v-bbc360ee>`);
        _push(ssrRenderComponent(_component_Breadcrumbs, {
          items: [
            { label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", to: "/" },
            { label: "\u0418\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432", to: "/iz-ostatkov" },
            { label: unref(data).source_name }
          ]
        }, null, _parent));
        _push(`<h1 data-v-bbc360ee>${ssrInterpolate(unref(titleText))}</h1><aside class="quick-answer" data-v-bbc360ee><p data-v-bbc360ee>${ssrInterpolate(unref(data).short_answer)}</p><small data-v-bbc360ee>\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${ssrInterpolate(formatDate(unref(data).updated))}</small></aside><section aria-labelledby="scenarios-h" data-v-bbc360ee><h2 id="scenarios-h" data-v-bbc360ee>\u0427\u0442\u043E \u0440\u0435\u0430\u043B\u044C\u043D\u043E \u043F\u0440\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C</h2><!--[-->`);
        ssrRenderList(unref(data).scenarios, (s, i) => {
          _push(`<div class="scenario" data-v-bbc360ee><div class="scenario__head" data-v-bbc360ee><h3 data-v-bbc360ee>${ssrInterpolate(s.title)}</h3><span class="scenario__time" data-v-bbc360ee>${ssrInterpolate(s.time)}</span></div><p class="scenario__need" data-v-bbc360ee><strong data-v-bbc360ee>\u041F\u043E\u043D\u0430\u0434\u043E\u0431\u0438\u0442\u0441\u044F:</strong> ${ssrInterpolate(s.need)}</p><ol class="scenario__steps" data-v-bbc360ee><!--[-->`);
          ssrRenderList(s.steps, (step, j) => {
            _push(`<li data-v-bbc360ee>${ssrInterpolate(step)}</li>`);
          });
          _push(`<!--]--></ol></div>`);
        });
        _push(`<!--]--></section>`);
        if ((_a2 = unref(data).donts) == null ? void 0 : _a2.length) {
          _push(`<section class="donts" aria-labelledby="donts-h" data-v-bbc360ee><h2 id="donts-h" data-v-bbc360ee>\u0427\u0435\u0433\u043E \u0442\u043E\u0447\u043D\u043E \u043D\u0435 \u0434\u0435\u043B\u0430\u0442\u044C</h2><ul data-v-bbc360ee><!--[-->`);
          ssrRenderList(unref(data).donts, (d, i) => {
            _push(`<li data-v-bbc360ee>${ssrInterpolate(d)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_b = unref(data).faq) == null ? void 0 : _b.length) {
          _push(`<section class="faq" aria-labelledby="faq-h" data-v-bbc360ee><h2 id="faq-h" data-v-bbc360ee>\u0427\u0430\u0441\u0442\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B</h2><!--[-->`);
          ssrRenderList(unref(data).faq, (q, i) => {
            var _a3;
            _push(`<details data-v-bbc360ee><summary data-v-bbc360ee>${ssrInterpolate(q.q)}</summary><p data-v-bbc360ee>${(_a3 = renderInlineLinks(q.a)) != null ? _a3 : ""}</p></details>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="cross-links" data-v-bbc360ee><h2 data-v-bbc360ee>\u041F\u043E\u043B\u0435\u0437\u043D\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438</h2><ul data-v-bbc360ee><li data-v-bbc360ee> \u041F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u0440\u0435\u0446\u0435\u043F\u0442 \u0438\u0437 \u0434\u0440\u0443\u0433\u0438\u0445 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432 \u2014 `);
        _push(ssrRenderComponent(_component_NuxtLink, { to: "/chto-prigotovit/iz-togo-chto-est" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \xAB\u0438\u0437 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u0435\u0441\u0442\u044C \u0434\u043E\u043C\u0430\xBB`);
            } else {
              return [
                createTextVNode("\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \xAB\u0438\u0437 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u0435\u0441\u0442\u044C \u0434\u043E\u043C\u0430\xBB")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li>`);
        if ((_c = unref(ingMeta)) == null ? void 0 : _c.slug) {
          _push(`<li data-v-bbc360ee> \u0412\u0441\u0451 \u043F\u0440\u043E \u044D\u0442\u043E\u0442 \u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u2014 `);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/iz/${unref(ingMeta).slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`/iz/${ssrInterpolate(unref(ingMeta).slug)}`);
              } else {
                return [
                  createTextVNode("/iz/" + toDisplayString(unref(ingMeta).slug), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</li>`);
        } else {
          _push(`<!---->`);
        }
        if ((_d = unref(ingMeta)) == null ? void 0 : _d.hasSrokKhraneniya) {
          _push(`<li data-v-bbc360ee> \u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u2014 `);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/spravochnik/srok-khraneniya/${unref(ingMeta).slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`\u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F`);
              } else {
                return [
                  createTextVNode("\u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</li>`);
        } else {
          _push(`<!---->`);
        }
        if ((_e = unref(ingMeta)) == null ? void 0 : _e.hasZameny) {
          _push(`<li data-v-bbc360ee> \u0427\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u2014 `);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/spravochnik/zameny/${unref(ingMeta).slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`\u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0437\u0430\u043C\u0435\u043D`);
              } else {
                return [
                  createTextVNode("\u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0437\u0430\u043C\u0435\u043D")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</ul></section><div class="cta-block" data-v-bbc360ee><p data-v-bbc360ee>\u0427\u0442\u043E\u0431\u044B \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432 \u0431\u044B\u043B\u043E \u043C\u0435\u043D\u044C\u0448\u0435 \u2014 \u0441\u043E\u0431\u0435\u0440\u0438 \u043C\u0435\u043D\u044E \u043F\u043E\u0434 \u0441\u0432\u043E\u0439 \u0445\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u0438\u043A.</p><a href="/" class="btn-cta" data-v-bbc360ee>\u0421\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043C\u0435\u043D\u044E \u0437\u0430 60 \u0441\u0435\u043A</a><small data-v-bbc360ee>\u0410\u043B\u0433\u043E\u0440\u0438\u0442\u043C \u043F\u0435\u0440\u0435\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0438\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u044B \u043C\u0435\u0436\u0434\u0443 \u0434\u043D\u044F\u043C\u0438 \u2014 \u043C\u0435\u043D\u044C\u0448\u0435 \u043E\u0442\u0445\u043E\u0434\u043E\u0432</small></div></article>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/iz-ostatkov/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-bbc360ee"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-BifQ1IWU.mjs.map
