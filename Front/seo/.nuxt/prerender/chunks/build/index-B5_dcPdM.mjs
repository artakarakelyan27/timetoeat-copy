import { _ as __nuxt_component_0 } from './Breadcrumbs-DSi9QbCQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, withAsyncContext, unref, withCtx, createVNode, toDisplayString, openBlock, createBlock, createTextVNode, createCommentVNode, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/server-renderer/index.mjs';
import { u as useAsyncData } from './asyncData-DEJTKb-b.mjs';
import { u as useSeoHead } from './useSeoHead-Cf0asDsx.mjs';
import { h as useRuntimeConfig, u as useHead } from './server.mjs';
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
  __name: "index",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const { data: menus } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "menus-list",
      () => $fetch("/api/_content/menyu")
    )), __temp = await __temp, __restore(), __temp);
    useSeoHead({
      title: "\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E \u2014 \u0433\u043E\u0442\u043E\u0432\u044B\u0435 \u043F\u043E\u0434\u0431\u043E\u0440\u043A\u0438 \u0441 \u041A\u0411\u0416\u0423 \u0438 \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u043F\u043E\u043A\u0443\u043F\u043E\u043A",
      description: "\u0413\u043E\u0442\u043E\u0432\u044B\u0435 7-\u0434\u043D\u0435\u0432\u043D\u044B\u0435 \u043C\u0435\u043D\u044E \u0434\u043B\u044F \u0441\u0435\u043C\u044C\u0438, \u041F\u041F \u0438 \u0431\u044E\u0434\u0436\u0435\u0442\u043D\u043E\u0433\u043E \u043F\u0438\u0442\u0430\u043D\u0438\u044F. \u0421 \u041A\u0411\u0416\u0423, \u0432\u0440\u0435\u043C\u0435\u043D\u0435\u043C \u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u043F\u043E \u0434\u043D\u044F\u043C \u0438 \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u043F\u043E\u043A\u0443\u043F\u043E\u043A. \u041E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438 \u0437\u0430 \u043C\u0438\u043D\u0443\u0442\u0443.",
      path: "/menyu-na-nedelyu",
      ogSlug: "menyu-na-nedelyu"
    });
    const config = useRuntimeConfig().public;
    useHead({
      script: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E",
            url: `${config.siteUrl}/menyu-na-nedelyu`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: (menus.value || []).map((m, i) => ({
                "@type": "ListItem",
                position: i + 1,
                url: `${config.siteUrl}/menyu-na-nedelyu/${m.slug}`,
                name: m.title
              }))
            }
          })
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      var _a;
      const _component_Breadcrumbs = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<article${ssrRenderAttrs(_attrs)} data-v-9779689d>`);
      _push(ssrRenderComponent(_component_Breadcrumbs, { items: [{ label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", to: "/" }, { label: "\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E" }] }, null, _parent));
      _push(`<h1 data-v-9779689d>\u0413\u043E\u0442\u043E\u0432\u043E\u0435 \u043C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E</h1><p class="lead" data-v-9779689d> \u041F\u043E\u043B\u043D\u043E\u0435 7-\u0434\u043D\u0435\u0432\u043D\u043E\u0435 \u043C\u0435\u043D\u044E \u0441 \u041A\u0411\u0416\u0423, \u0440\u0435\u0430\u043B\u044C\u043D\u044B\u043C \u0432\u0440\u0435\u043C\u0435\u043D\u0435\u043C \u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u043F\u043E \u0434\u043D\u044F\u043C, \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u043F\u043E\u043A\u0443\u043F\u043E\u043A \u0438 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0430\u043C\u0438 \xAB\u0434\u043E\u0441\u0442\u0430\u043D\u044C \u0438\u0437 \u043C\u043E\u0440\u043E\u0437\u0438\u043B\u043A\u0438\xBB. \u041F\u043E\u0434\u0431\u0438\u0440\u0430\u0439 \u043F\u043E \u0441\u0435\u0433\u043C\u0435\u043D\u0442\u0443 \u0438 \u0441\u0440\u0430\u0437\u0443 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0439 \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438 \u0437\u0430 \u043C\u0438\u043D\u0443\u0442\u0443 \u2014 \u0442\u0430\u043C \u0436\u0435 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0441\u043E\u0431\u0438\u0440\u0430\u0435\u0442\u0441\u044F \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u043A\u0443\u043F\u043E\u043A. </p>`);
      if ((_a = unref(menus)) == null ? void 0 : _a.length) {
        _push(`<section class="menu-grid" aria-label="\u0413\u043E\u0442\u043E\u0432\u044B\u0435 \u043C\u0435\u043D\u044E" data-v-9779689d><!--[-->`);
        ssrRenderList(unref(menus), (m) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: m.slug,
            to: `/menyu-na-nedelyu/${m.slug}`,
            class: "menu-card"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<div class="menu-card__emoji" aria-hidden="true" data-v-9779689d${_scopeId}>${ssrInterpolate(m.emoji)}</div><div class="menu-card__body" data-v-9779689d${_scopeId}><h2 data-v-9779689d${_scopeId}>${ssrInterpolate(m.title)}</h2><p class="menu-card__audience" data-v-9779689d${_scopeId}>${ssrInterpolate(m.audience)}</p><ul class="menu-card__meta" data-v-9779689d${_scopeId}>`);
                if (m.avg_kcal) {
                  _push2(`<li data-v-9779689d${_scopeId}><strong data-v-9779689d${_scopeId}>${ssrInterpolate(m.avg_kcal)}</strong> \u043A\u043A\u0430\u043B/\u0434\u0435\u043D\u044C</li>`);
                } else {
                  _push2(`<!---->`);
                }
                if (m.weekly_budget_hint) {
                  _push2(`<li data-v-9779689d${_scopeId}>${ssrInterpolate(m.weekly_budget_hint)}</li>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</ul><p class="menu-card__short" data-v-9779689d${_scopeId}>${ssrInterpolate(m.short_answer.slice(0, 160))}...</p></div>`);
              } else {
                return [
                  createVNode("div", {
                    class: "menu-card__emoji",
                    "aria-hidden": "true"
                  }, toDisplayString(m.emoji), 1),
                  createVNode("div", { class: "menu-card__body" }, [
                    createVNode("h2", null, toDisplayString(m.title), 1),
                    createVNode("p", { class: "menu-card__audience" }, toDisplayString(m.audience), 1),
                    createVNode("ul", { class: "menu-card__meta" }, [
                      m.avg_kcal ? (openBlock(), createBlock("li", { key: 0 }, [
                        createVNode("strong", null, toDisplayString(m.avg_kcal), 1),
                        createTextVNode(" \u043A\u043A\u0430\u043B/\u0434\u0435\u043D\u044C")
                      ])) : createCommentVNode("", true),
                      m.weekly_budget_hint ? (openBlock(), createBlock("li", { key: 1 }, toDisplayString(m.weekly_budget_hint), 1)) : createCommentVNode("", true)
                    ]),
                    createVNode("p", { class: "menu-card__short" }, toDisplayString(m.short_answer.slice(0, 160)) + "...", 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<section class="methodology" data-v-9779689d><h2 data-v-9779689d>\u041A\u0430\u043A \u043C\u044B \u0441\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u043C \u043C\u0435\u043D\u044E</h2><p data-v-9779689d> \u0410\u043B\u0433\u043E\u0440\u0438\u0442\u043C \u043E\u0442\u0431\u0438\u0440\u0430\u0435\u0442 \u0440\u0435\u0446\u0435\u043F\u0442\u044B \u043F\u043E \u0442\u0440\u0451\u043C \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u044F\u043C: \u0440\u043E\u0432\u043D\u044B\u0439 \u041A\u0411\u0416\u0423 \u0437\u0430 \u0434\u0435\u043D\u044C, \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E\u0435 \u043F\u0435\u0440\u0435\u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u0438\u0435 \u0438\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u043E\u0432 \u043C\u0435\u0436\u0434\u0443 \u0434\u043D\u044F\u043C\u0438 (\u043A\u043E\u0440\u043E\u0447\u0435 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u043A\u0443\u043F\u043E\u043A) \u0438 \u0440\u0435\u0430\u043B\u0438\u0441\u0442\u0438\u0447\u043D\u044B\u0435 \u0442\u0430\u0439\u043C\u0438\u043D\u0433\u0438 \u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u0432 \u0431\u0443\u0434\u043D\u0438. \u041D\u0438\u043A\u0430\u043A\u0438\u0445 \xAB10-\u043C\u0438\u043D\u0443\u0442\u043D\u044B\u0445\xBB \u0440\u0435\u0446\u0435\u043F\u0442\u043E\u0432 \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0432 \u0440\u0435\u0430\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u0437\u0430\u043D\u0438\u043C\u0430\u044E\u0442 40. \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u2014 `);
      _push(ssrRenderComponent(_component_NuxtLink, { to: "/o-proekte" }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`\u0432 \u043C\u0435\u0442\u043E\u0434\u043E\u043B\u043E\u0433\u0438\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430`);
          } else {
            return [
              createTextVNode("\u0432 \u043C\u0435\u0442\u043E\u0434\u043E\u043B\u043E\u0433\u0438\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0430")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`. </p></section><div class="cta-block" data-v-9779689d><p data-v-9779689d><strong data-v-9779689d>\u0425\u043E\u0447\u0435\u0448\u044C \u043C\u0435\u043D\u044E \u043F\u043E\u0434 \u0441\u0432\u043E\u044E \u0441\u0435\u043C\u044C\u044E, \u0434\u0438\u0435\u0442\u0443 \u0438\u043B\u0438 \u0431\u044E\u0434\u0436\u0435\u0442 \u2014 \u0442\u043E\u0447\u0435\u0447\u043D\u043E?</strong></p><a href="/" class="btn-cta" data-v-9779689d>\u0421\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043C\u0435\u043D\u044E \u0437\u0430 60 \u0441\u0435\u043A</a><small data-v-9779689d>\u0417\u0430 \u043C\u0438\u043D\u0443\u0442\u0443 \u0430\u043B\u0433\u043E\u0440\u0438\u0442\u043C \u0441\u043E\u0431\u0435\u0440\u0451\u0442 \u0443\u043D\u0438\u043A\u0430\u043B\u044C\u043D\u043E\u0435 \u043C\u0435\u043D\u044E \u043F\u043E\u0434 \u0442\u0432\u043E\u0438 \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440\u044B \u0438 \u0441\u0440\u0430\u0437\u0443 \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u043A\u0443\u043F\u043E\u043A.</small></div></article>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/menyu-na-nedelyu/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-9779689d"]]);

export { index as default };
//# sourceMappingURL=index-B5_dcPdM.mjs.map
