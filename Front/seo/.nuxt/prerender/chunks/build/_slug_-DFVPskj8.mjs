import { _ as __nuxt_component_0 } from './Breadcrumbs-DSi9QbCQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, withAsyncContext, unref, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
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
    let __temp, __restore;
    const route = useRoute();
    const slug = route.params.slug;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      `zameny-${slug}`,
      () => $fetch("/api/_content/zameny", { query: { slug } })
    )), __temp = await __temp, __restore(), __temp);
    if (!data.value) throw createError({ statusCode: 404, statusMessage: "\u0417\u0430\u043C\u0435\u043D\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430" });
    const { data: ingMeta } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData(`zameny-${slug}-ing`, async () => {
      var _a;
      const li = (_a = data.value) == null ? void 0 : _a.linked_ingredient;
      if (!li) return null;
      try {
        return await $fetch("/api/_content/iz", { query: { slug: li } });
      } catch {
        return null;
      }
    })), __temp = await __temp, __restore(), __temp);
    useSeoHead({
      title: `${data.value.name}: \u0447\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0432 \u0433\u043E\u0442\u043E\u0432\u043A\u0435 \u2014 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A`,
      description: data.value.short_answer.slice(0, 158),
      path: `/spravochnik/zameny/${slug}`,
      ogSlug: `spravochnik/zameny/${slug}`
    });
    useHead({
      script: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: (data.value.faq || []).map((q) => ({
              "@type": "Question",
              name: q.q,
              acceptedAnswer: { "@type": "Answer", text: q.a }
            }))
          })
        }
      ]
    });
    function formatDate(d) {
      if (!d) return "";
      const date = new Date(d);
      return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a, _b, _c, _d;
      const _component_Breadcrumbs = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      if (unref(data)) {
        _push(`<article${ssrRenderAttrs(_attrs)} data-v-7b92eebf>`);
        _push(ssrRenderComponent(_component_Breadcrumbs, {
          items: [
            { label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", to: "/" },
            { label: "\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A", to: "/spravochnik" },
            { label: "\u0417\u0430\u043C\u0435\u043D\u044B" },
            { label: unref(data).name }
          ]
        }, null, _parent));
        _push(`<h1 data-v-7b92eebf>${ssrInterpolate(unref(data).name)}: \u0447\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0432 \u0433\u043E\u0442\u043E\u0432\u043A\u0435</h1><aside class="quick-answer" aria-label="\u041A\u0440\u0430\u0442\u043A\u0438\u0439 \u043E\u0442\u0432\u0435\u0442" data-v-7b92eebf><p data-v-7b92eebf>${ssrInterpolate(unref(data).short_answer)}</p><small data-v-7b92eebf>\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${ssrInterpolate(formatDate(unref(data).updated))}</small></aside><section aria-labelledby="cases-h" data-v-7b92eebf><h2 id="cases-h" data-v-7b92eebf>\u0417\u0430\u043C\u0435\u043D\u044B \u043F\u043E \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0443 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u044F</h2><!--[-->`);
        ssrRenderList(unref(data).cases, (c, i) => {
          _push(`<div class="case" data-v-7b92eebf><h3 data-v-7b92eebf>${ssrInterpolate(c.use_in)}</h3><p class="case__replace" data-v-7b92eebf><strong data-v-7b92eebf>\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C:</strong> ${ssrInterpolate(c.replace)}</p>`);
          if (c.note) {
            _push(`<p class="case__note" data-v-7b92eebf>${ssrInterpolate(c.note)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        });
        _push(`<!--]--></section>`);
        if ((_a = unref(data).faq) == null ? void 0 : _a.length) {
          _push(`<section class="faq" aria-labelledby="faq-h" data-v-7b92eebf><h2 id="faq-h" data-v-7b92eebf>\u0427\u0430\u0441\u0442\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B</h2><!--[-->`);
          ssrRenderList(unref(data).faq, (q, i) => {
            _push(`<details data-v-7b92eebf><summary data-v-7b92eebf>${ssrInterpolate(q.q)}</summary><p data-v-7b92eebf>${ssrInterpolate(q.a)}</p></details>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="cross-links" data-v-7b92eebf><h2 data-v-7b92eebf>\u041F\u043E\u043B\u0435\u0437\u043D\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438</h2><ul data-v-7b92eebf>`);
        if ((_b = unref(ingMeta)) == null ? void 0 : _b.slug) {
          _push(`<li data-v-7b92eebf> \u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043F\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0443 \u2014 `);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/iz/${unref(ingMeta).slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(unref(data).name)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(unref(data).name), 1)
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</li>`);
        } else {
          _push(`<!---->`);
        }
        if ((_c = unref(ingMeta)) == null ? void 0 : _c.hasSrokKhraneniya) {
          _push(`<li data-v-7b92eebf> \u0421\u0440\u043E\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u2014 `);
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
        if ((_d = unref(ingMeta)) == null ? void 0 : _d.hasOstatki) {
          _push(`<li data-v-7b92eebf> \u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0438\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432 \u2014 `);
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/iz-ostatkov/${unref(ingMeta).slug}`
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C`);
              } else {
                return [
                  createTextVNode("\u0441\u043C\u043E\u0442\u0440\u0435\u0442\u044C")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(`</li>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<li data-v-7b92eebf> \u041F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u0431\u043B\u044E\u0434\u043E \u0438\u0437 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u0435\u0441\u0442\u044C \u0434\u043E\u043C\u0430 \u2014 `);
        _push(ssrRenderComponent(_component_NuxtLink, { to: "/chto-prigotovit/iz-togo-chto-est" }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432`);
            } else {
              return [
                createTextVNode("\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</li></ul></section><div class="cta-block" data-v-7b92eebf><p data-v-7b92eebf>\u041D\u0435 \u0445\u043E\u0447\u0435\u0448\u044C \u043F\u043E\u0434\u0431\u0438\u0440\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u043D\u044B \u0432\u0440\u0443\u0447\u043D\u0443\u044E \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C?</p><a href="/" class="btn-cta" data-v-7b92eebf>\u0421\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E</a><small data-v-7b92eebf>\u0423\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u043C \u0430\u043B\u043B\u0435\u0440\u0433\u0438\u0438 \u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u044B, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u043F\u043E\u0434 \u0440\u0443\u043A\u043E\u0439</small></div></article>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/spravochnik/zameny/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-7b92eebf"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-DFVPskj8.mjs.map
