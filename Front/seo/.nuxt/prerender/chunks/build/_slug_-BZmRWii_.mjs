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
    var _a, _b;
    let __temp, __restore;
    const route = useRoute();
    const slug = route.params.slug;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      `srok-${slug}`,
      () => $fetch("/api/_content/srok-khraneniya", { query: { slug } })
    )), __temp = await __temp, __restore(), __temp);
    if (!data.value) throw createError({ statusCode: 404, statusMessage: "\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
    const { data: ingMeta } = ([__temp, __restore] = withAsyncContext(async () => useAsyncData(`srok-${slug}-ing`, async () => {
      var _a2;
      const li = (_a2 = data.value) == null ? void 0 : _a2.linked_ingredient;
      if (!li) return null;
      try {
        return await $fetch("/api/_content/iz", { query: { slug: li } });
      } catch {
        return null;
      }
    })), __temp = await __temp, __restore(), __temp);
    useSeoHead({
      title: `${data.value.name}: \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u2014 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A`,
      description: data.value.short_answer.slice(0, 158),
      path: `/spravochnik/srok-khraneniya/${slug}`,
      ogSlug: `spravochnik/srok-khraneniya/${slug}`
    });
    const schemas = [];
    if ((_a = data.value.faq) == null ? void 0 : _a.length) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: data.value.faq.map((q) => ({
          "@type": "Question",
          name: q.q,
          acceptedAnswer: { "@type": "Answer", text: q.a }
        }))
      });
    }
    if ((_b = data.value.how_to_freeze) == null ? void 0 : _b.length) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `\u0417\u0430\u043C\u043E\u0440\u043E\u0437\u043A\u0430: ${data.value.name}`,
        step: data.value.how_to_freeze.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          text: s
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
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b2, _c, _d, _e, _f;
      const _component_Breadcrumbs = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      if (unref(data)) {
        _push(`<article${ssrRenderAttrs(_attrs)} data-v-3a4a9862>`);
        _push(ssrRenderComponent(_component_Breadcrumbs, {
          items: [
            { label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", to: "/" },
            { label: "\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A", to: "/spravochnik" },
            { label: "\u0421\u0440\u043E\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F" },
            { label: unref(data).name }
          ]
        }, null, _parent));
        _push(`<h1 data-v-3a4a9862>${ssrInterpolate(unref(data).name)}: \u0441\u0440\u043E\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0438 \u043F\u0440\u0438\u0437\u043D\u0430\u043A\u0438 \u043F\u043E\u0440\u0447\u0438</h1><aside class="quick-answer" data-v-3a4a9862><p data-v-3a4a9862>${ssrInterpolate(unref(data).short_answer)}</p><small data-v-3a4a9862>\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${ssrInterpolate(formatDate(unref(data).updated))}</small></aside><section aria-labelledby="storage-h" data-v-3a4a9862><h2 id="storage-h" data-v-3a4a9862>\u0423\u0441\u043B\u043E\u0432\u0438\u044F \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F</h2><table class="storage-table" role="table" data-v-3a4a9862><thead data-v-3a4a9862><tr data-v-3a4a9862><th scope="col" data-v-3a4a9862>\u0413\u0434\u0435</th><th scope="col" data-v-3a4a9862>\u0422\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0430</th><th scope="col" data-v-3a4a9862>\u0421\u0440\u043E\u043A</th></tr></thead><tbody data-v-3a4a9862><!--[-->`);
        ssrRenderList(unref(data).storage, (s, i) => {
          _push(`<tr data-v-3a4a9862><td data-v-3a4a9862>${ssrInterpolate(s.where)} `);
          if (s.notes) {
            _push(`<small class="storage-notes" data-v-3a4a9862>${ssrInterpolate(s.notes)}</small>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</td><td data-v-3a4a9862>${ssrInterpolate(s.temperature)}</td><td data-v-3a4a9862><strong data-v-3a4a9862>${ssrInterpolate(s.duration)}</strong></td></tr>`);
        });
        _push(`<!--]--></tbody></table></section>`);
        if ((_a2 = unref(data).spoilage_signs) == null ? void 0 : _a2.length) {
          _push(`<section aria-labelledby="spoilage-h" data-v-3a4a9862><h2 id="spoilage-h" data-v-3a4a9862>\u041F\u0440\u0438\u0437\u043D\u0430\u043A\u0438 \u043F\u043E\u0440\u0447\u0438</h2><ul class="spoilage-list" data-v-3a4a9862><!--[-->`);
          ssrRenderList(unref(data).spoilage_signs, (s, i) => {
            _push(`<li data-v-3a4a9862>${ssrInterpolate(s)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_b2 = unref(data).how_to_freeze) == null ? void 0 : _b2.length) {
          _push(`<section aria-labelledby="freeze-h" data-v-3a4a9862><h2 id="freeze-h" data-v-3a4a9862>\u041A\u0430\u043A \u043F\u0440\u0430\u0432\u0438\u043B\u044C\u043D\u043E \u0437\u0430\u043C\u043E\u0440\u043E\u0437\u0438\u0442\u044C</h2><ol class="freeze-list" data-v-3a4a9862><!--[-->`);
          ssrRenderList(unref(data).how_to_freeze, (step, i) => {
            _push(`<li data-v-3a4a9862>${ssrInterpolate(step)}</li>`);
          });
          _push(`<!--]--></ol></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_c = unref(data).faq) == null ? void 0 : _c.length) {
          _push(`<section class="faq" aria-labelledby="faq-h" data-v-3a4a9862><h2 id="faq-h" data-v-3a4a9862>\u0427\u0430\u0441\u0442\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B</h2><!--[-->`);
          ssrRenderList(unref(data).faq, (q, i) => {
            _push(`<details data-v-3a4a9862><summary data-v-3a4a9862>${ssrInterpolate(q.q)}</summary><p data-v-3a4a9862>${ssrInterpolate(q.a)}</p></details>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="cross-links" data-v-3a4a9862><h2 data-v-3a4a9862>\u041F\u043E\u043B\u0435\u0437\u043D\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438</h2><ul data-v-3a4a9862>`);
        if ((_d = unref(ingMeta)) == null ? void 0 : _d.slug) {
          _push(`<li data-v-3a4a9862> \u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043F\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0443 \u2014 `);
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
        if ((_e = unref(ingMeta)) == null ? void 0 : _e.hasZameny) {
          _push(`<li data-v-3a4a9862> \u0427\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u2014 `);
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
        if ((_f = unref(ingMeta)) == null ? void 0 : _f.hasOstatki) {
          _push(`<li data-v-3a4a9862> \u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0438\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432 \u2014 `);
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
        _push(`</ul></section><div class="cta-block" data-v-3a4a9862><p data-v-3a4a9862>\u041D\u0435 \u0445\u043E\u0447\u0435\u0448\u044C \u0434\u0443\u043C\u0430\u0442\u044C, \u0447\u0442\u043E \u043F\u043E\u0440\u0442\u0438\u0442\u0441\u044F \u2014 \u0430 \u0447\u0442\u043E \u0441\u0432\u0435\u0436\u0435\u0435? \u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E \u0441 \u0443\u0447\u0451\u0442\u043E\u043C \u0441\u0440\u043E\u043A\u043E\u0432.</p><a href="/" class="btn-cta" data-v-3a4a9862>\u0421\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043C\u0435\u043D\u044E \u0437\u0430 60 \u0441\u0435\u043A</a></div></article>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/spravochnik/srok-khraneniya/[slug].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _slug_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3a4a9862"]]);

export { _slug_ as default };
//# sourceMappingURL=_slug_-BZmRWii_.mjs.map
