import { _ as __nuxt_component_0 } from './Breadcrumbs-DSi9QbCQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, withAsyncContext, unref, withCtx, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
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
    const { data: ingredients } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "iz-list",
      () => $fetch("/api/_content/iz")
    )), __temp = await __temp, __restore(), __temp);
    useSeoHead({
      title: "\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0438\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u043E\u0432 \u2014 \u0437\u0430\u043C\u0435\u043D\u044B, \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435, \u0440\u0435\u0446\u0435\u043F\u0442\u044B",
      description: "\u041F\u043E\u043B\u043D\u044B\u0439 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432: \u0447\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C, \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0432 \u0445\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u0438\u043A\u0435 \u0438 \u043C\u043E\u0440\u043E\u0437\u0438\u043B\u043A\u0435, \u0447\u0442\u043E \u043F\u0440\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0438\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432.",
      path: "/iz",
      ogSlug: "iz"
    });
    const config = useRuntimeConfig().public;
    useHead({
      script: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0438\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u043E\u0432",
            url: `${config.siteUrl}/iz`,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: (ingredients.value || []).map((i, idx) => ({
                "@type": "ListItem",
                position: idx + 1,
                url: `${config.siteUrl}/iz/${i.slug}`,
                name: i.name
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
      _push(`<article${ssrRenderAttrs(_attrs)} data-v-3b6af274>`);
      _push(ssrRenderComponent(_component_Breadcrumbs, { items: [{ label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", to: "/" }, { label: "\u0418\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u044B" }] }, null, _parent));
      _push(`<h1 data-v-3b6af274>\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0438\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u043E\u0432</h1><p class="lead" data-v-3b6af274> \u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u0430 \u0441\u043E\u0431\u0440\u0430\u043D\u043E \u0432\u0441\u0451, \u0447\u0442\u043E \u043D\u0443\u0436\u043D\u043E \u0437\u043D\u0430\u0442\u044C \u0443 \u043F\u043B\u0438\u0442\u044B: \u0447\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C, \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F, \u0447\u0442\u043E \u043F\u0440\u0438\u0433\u043E\u0442\u043E\u0432\u0438\u0442\u044C \u0438\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432. \u041F\u043E \u043C\u0435\u0440\u0435 \u043F\u043E\u044F\u0432\u043B\u0435\u043D\u0438\u044F \u0440\u0435\u0446\u0435\u043F\u0442\u043E\u0432 \u0438\u0437 \u0411\u0414 \u2014 \u0434\u043E\u0431\u0430\u0432\u0438\u043C \u043F\u0440\u044F\u043C\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u0438 \u0441\u044E\u0434\u0430. </p>`);
      if ((_a = unref(ingredients)) == null ? void 0 : _a.length) {
        _push(`<section aria-label="\u0421\u043F\u0438\u0441\u043E\u043A \u0438\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u043E\u0432" data-v-3b6af274><div class="ing-grid" data-v-3b6af274><!--[-->`);
        ssrRenderList(unref(ingredients), (i) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: i.slug,
            to: `/iz/${i.slug}`,
            class: "ing-card"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<span class="ing-card__emoji" aria-hidden="true" data-v-3b6af274${_scopeId}>${ssrInterpolate(i.emoji)}</span><div class="ing-card__body" data-v-3b6af274${_scopeId}><h2 data-v-3b6af274${_scopeId}>${ssrInterpolate(i.name)}</h2><p class="ing-card__tags" data-v-3b6af274${_scopeId}>`);
                if (i.hasZameny) {
                  _push2(`<span class="tag tag--green" data-v-3b6af274${_scopeId}>\u0437\u0430\u043C\u0435\u043D\u044B</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (i.hasSrokKhraneniya) {
                  _push2(`<span class="tag tag--blue" data-v-3b6af274${_scopeId}>\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435</span>`);
                } else {
                  _push2(`<!---->`);
                }
                if (i.hasOstatki) {
                  _push2(`<span class="tag tag--amber" data-v-3b6af274${_scopeId}>\u043E\u0441\u0442\u0430\u0442\u043A\u0438</span>`);
                } else {
                  _push2(`<!---->`);
                }
                _push2(`</p></div>`);
              } else {
                return [
                  createVNode("span", {
                    class: "ing-card__emoji",
                    "aria-hidden": "true"
                  }, toDisplayString(i.emoji), 1),
                  createVNode("div", { class: "ing-card__body" }, [
                    createVNode("h2", null, toDisplayString(i.name), 1),
                    createVNode("p", { class: "ing-card__tags" }, [
                      i.hasZameny ? (openBlock(), createBlock("span", {
                        key: 0,
                        class: "tag tag--green"
                      }, "\u0437\u0430\u043C\u0435\u043D\u044B")) : createCommentVNode("", true),
                      i.hasSrokKhraneniya ? (openBlock(), createBlock("span", {
                        key: 1,
                        class: "tag tag--blue"
                      }, "\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435")) : createCommentVNode("", true),
                      i.hasOstatki ? (openBlock(), createBlock("span", {
                        key: 2,
                        class: "tag tag--amber"
                      }, "\u043E\u0441\u0442\u0430\u0442\u043A\u0438")) : createCommentVNode("", true)
                    ])
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div></section>`);
      } else {
        _push(`<!---->`);
      }
      _push(`<div class="cta-block" data-v-3b6af274><p data-v-3b6af274><strong data-v-3b6af274>\u041D\u0443\u0436\u0435\u043D \u0440\u0435\u0446\u0435\u043F\u0442 \u043F\u043E\u0434 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0439 \u043F\u0440\u043E\u0434\u0443\u043A\u0442?</strong></p><a href="/onboarding" class="btn-cta" data-v-3b6af274>\u041F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u043C\u0435\u043D\u044E \u0437\u0430 60 \u0441\u0435\u043A</a></div></article>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/iz/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3b6af274"]]);

export { index as default };
//# sourceMappingURL=index-w5os9wNO.mjs.map
