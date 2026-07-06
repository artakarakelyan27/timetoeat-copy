import { _ as __nuxt_component_0 } from './Breadcrumbs-DSi9QbCQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, withAsyncContext, unref, withCtx, createVNode, toDisplayString, createTextVNode, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrRenderList, ssrInterpolate } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/server-renderer/index.mjs';
import { u as useAsyncData } from './asyncData-DEJTKb-b.mjs';
import { u as useSeoHead } from './useSeoHead-Cf0asDsx.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import './server.mjs';
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
import 'file:///var/www/time-to-eat-copy/Front/node_modules/ufo/dist/index.mjs';
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
    const { data: zameny } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("zameny-list", () => $fetch("/api/_content/zameny"))), __temp = await __temp, __restore(), __temp);
    const { data: sroki } = ([__temp, __restore] = withAsyncContext(() => useAsyncData("sroki-list", () => $fetch("/api/_content/srok-khraneniya"))), __temp = await __temp, __restore(), __temp);
    useSeoHead({
      title: "\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432: \u0437\u0430\u043C\u0435\u043D\u044B \u0438 \u0441\u0440\u043E\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F",
      description: "\u0427\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442 \u0438 \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043E\u043D \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u0432 \u0445\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u0438\u043A\u0435 \u0438\u043B\u0438 \u043C\u043E\u0440\u043E\u0437\u0438\u043B\u043A\u0435. \u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0435 \u043E\u0442\u0432\u0435\u0442\u044B \u0443 \u043F\u043B\u0438\u0442\u044B.",
      path: "/spravochnik",
      ogSlug: "spravochnik"
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Breadcrumbs = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<article${ssrRenderAttrs(_attrs)} data-v-9536c778>`);
      _push(ssrRenderComponent(_component_Breadcrumbs, { items: [{ label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", to: "/" }, { label: "\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A" }] }, null, _parent));
      _push(`<h1 data-v-9536c778>\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432</h1><p class="lead" data-v-9536c778> \u0417\u0430\u043C\u0435\u043D\u044B \u0438\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u043E\u0432, \u0441\u0440\u043E\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F, \u043F\u0440\u0438\u0437\u043D\u0430\u043A\u0438 \u043F\u043E\u0440\u0447\u0438. \u041A\u043E\u0440\u043E\u0442\u043A\u0438\u0435 \u043E\u0442\u0432\u0435\u0442\u044B \u043D\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u044B, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0432\u043E\u0437\u043D\u0438\u043A\u0430\u044E\u0442 \u0443 \u043F\u043B\u0438\u0442\u044B \u043A\u0430\u0436\u0434\u0443\u044E \u043D\u0435\u0434\u0435\u043B\u044E. </p><section aria-labelledby="zameny-h" data-v-9536c778><h2 id="zameny-h" data-v-9536c778>\u0427\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0434\u0443\u043A\u0442</h2><p class="muted" data-v-9536c778>\u0415\u0441\u043B\u0438 \u0432\u043D\u0435\u0437\u0430\u043F\u043D\u043E \u043D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u044F\u0438\u0446, \u0441\u043C\u0435\u0442\u0430\u043D\u044B \u0438\u043B\u0438 \u043C\u0443\u043A\u0438 \u2014 \u043F\u043E\u0441\u043C\u043E\u0442\u0440\u0438 \u0437\u0430\u043C\u0435\u043D\u044B \u043F\u043E \u0442\u0438\u043F\u0430\u043C \u0431\u043B\u044E\u0434.</p><ul class="ref-list" data-v-9536c778><!--[-->`);
      ssrRenderList(unref(zameny), (item) => {
        _push(`<li data-v-9536c778>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/spravochnik/zameny/${item.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="ref-emoji" aria-hidden="true" data-v-9536c778${_scopeId}>${ssrInterpolate(item.emoji)}</span> \u0427\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C ${ssrInterpolate(item.name.toLowerCase())}`);
            } else {
              return [
                createVNode("span", {
                  class: "ref-emoji",
                  "aria-hidden": "true"
                }, toDisplayString(item.emoji), 1),
                createTextVNode(" \u0427\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C " + toDisplayString(item.name.toLowerCase()), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></section><section aria-labelledby="srok-h" data-v-9536c778><h2 id="srok-h" data-v-9536c778>\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F \u043F\u0440\u043E\u0434\u0443\u043A\u0442</h2><p class="muted" data-v-9536c778>\u0421\u0440\u043E\u043A\u0438 \u0432 \u0445\u043E\u043B\u043E\u0434\u0438\u043B\u044C\u043D\u0438\u043A\u0435, \u043C\u043E\u0440\u043E\u0437\u0438\u043B\u043A\u0435, \u043F\u0440\u0438 \u043A\u043E\u043C\u043D\u0430\u0442\u043D\u043E\u0439 \u0442\u0435\u043C\u043F\u0435\u0440\u0430\u0442\u0443\u0440\u0435 + \u043A\u0430\u043A \u043F\u043E\u043D\u044F\u0442\u044C, \u0447\u0442\u043E \u0438\u0441\u043F\u043E\u0440\u0442\u0438\u043B\u043E\u0441\u044C.</p><ul class="ref-list" data-v-9536c778><!--[-->`);
      ssrRenderList(unref(sroki), (item) => {
        _push(`<li data-v-9536c778>`);
        _push(ssrRenderComponent(_component_NuxtLink, {
          to: `/spravochnik/srok-khraneniya/${item.slug}`
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<span class="ref-emoji" aria-hidden="true" data-v-9536c778${_scopeId}>${ssrInterpolate(item.emoji)}</span> \u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F ${ssrInterpolate(item.name.toLowerCase())}`);
            } else {
              return [
                createVNode("span", {
                  class: "ref-emoji",
                  "aria-hidden": "true"
                }, toDisplayString(item.emoji), 1),
                createTextVNode(" \u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F " + toDisplayString(item.name.toLowerCase()), 1)
              ];
            }
          }),
          _: 2
        }, _parent));
        _push(`</li>`);
      });
      _push(`<!--]--></ul></section></article>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/spravochnik/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-9536c778"]]);

export { index as default };
//# sourceMappingURL=index-CSp_E45o.mjs.map
