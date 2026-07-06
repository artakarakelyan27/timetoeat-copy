import { _ as __nuxt_component_0 } from './Breadcrumbs-DSi9QbCQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, withAsyncContext, computed, unref, withCtx, createVNode, toDisplayString, createTextVNode, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/server-renderer/index.mjs';
import { f as useRoute, c as createError } from './server.mjs';
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
  __name: "[ingredient]",
  __ssrInlineRender: true,
  async setup(__props) {
    let __temp, __restore;
    const route = useRoute();
    const slug = route.params.ingredient;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      `iz-${slug}`,
      () => $fetch("/api/_content/iz", { query: { slug } })
    )), __temp = await __temp, __restore(), __temp);
    if (!data.value) {
      throw createError({ statusCode: 404, statusMessage: "\u0418\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D" });
    }
    const missingCount = computed(() => {
      var _a, _b, _c;
      let n = 3;
      if ((_a = data.value) == null ? void 0 : _a.zamenySlug) n--;
      if ((_b = data.value) == null ? void 0 : _b.srokKhraneniyaSlug) n--;
      if ((_c = data.value) == null ? void 0 : _c.ostatkiSlug) n--;
      return n;
    });
    useSeoHead({
      title: `${data.value.name} \u2014 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A: \u0437\u0430\u043C\u0435\u043D\u044B, \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435, \u0440\u0435\u0446\u0435\u043F\u0442\u044B`,
      description: `\u0421\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u043F\u043E \u0442\u0435\u043C\u0435 \xAB${data.value.name.toLowerCase()}\xBB: \u0447\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C, \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0445\u0440\u0430\u043D\u0438\u0442\u0441\u044F, \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0438\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432. \u041E\u0442 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \xAB\u0412\u0440\u0435\u043C\u044F \u0415\u0441\u0442\u044C\xBB.`,
      path: `/iz/${slug}`,
      ogSlug: `iz/${slug}`
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_Breadcrumbs = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      if (unref(data)) {
        _push(`<article${ssrRenderAttrs(_attrs)} data-v-910b9063>`);
        _push(ssrRenderComponent(_component_Breadcrumbs, {
          items: [
            { label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", to: "/" },
            { label: "\u0418\u043D\u0433\u0440\u0435\u0434\u0438\u0435\u043D\u0442\u044B", to: "/iz" },
            { label: unref(data).name }
          ]
        }, null, _parent));
        _push(`<h1 data-v-910b9063>${ssrInterpolate(unref(data).name)} \u2014 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A</h1><p class="lead" data-v-910b9063> \u041D\u0430 \u044D\u0442\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u0441\u043E\u0431\u0440\u0430\u043D\u043E \u0432\u0441\u0451, \u0447\u0442\u043E \u0443 \u043D\u0430\u0441 \u0435\u0441\u0442\u044C \u043F\u043E \u0442\u0435\u043C\u0435 \xAB${ssrInterpolate(unref(data).name.toLowerCase())}\xBB: \u0437\u0430\u043C\u0435\u043D\u044B \u0432 \u0433\u043E\u0442\u043E\u0432\u043A\u0435, \u0441\u0440\u043E\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u0438 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u0438\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432. \u041F\u043E \u043C\u0435\u0440\u0435 \u043F\u043E\u044F\u0432\u043B\u0435\u043D\u0438\u044F \u0440\u0435\u0446\u0435\u043F\u0442\u043E\u0432 \u0431\u0443\u0434\u0435\u043C \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0442\u044C \u0438\u0445 \u0441\u044E\u0434\u0430 \u0436\u0435. </p><div class="resources" data-v-910b9063>`);
        if (unref(data).zamenySlug) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/spravochnik/zameny/${unref(data).zamenySlug}`,
            class: "resource-card resource-card--zameny"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a, _b;
              if (_push2) {
                _push2(`<span class="resource-card__emoji" aria-hidden="true" data-v-910b9063${_scopeId}>\u{1F504}</span><div data-v-910b9063${_scopeId}><h2 data-v-910b9063${_scopeId}>\u0427\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u2014 ${ssrInterpolate(unref(data).name.toLowerCase())}</h2><p data-v-910b9063${_scopeId}>${ssrInterpolate((_a = unref(data).zamenyShort) == null ? void 0 : _a.slice(0, 180))}\u2026</p></div>`);
              } else {
                return [
                  createVNode("span", {
                    class: "resource-card__emoji",
                    "aria-hidden": "true"
                  }, "\u{1F504}"),
                  createVNode("div", null, [
                    createVNode("h2", null, "\u0427\u0435\u043C \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u2014 " + toDisplayString(unref(data).name.toLowerCase()), 1),
                    createVNode("p", null, toDisplayString((_b = unref(data).zamenyShort) == null ? void 0 : _b.slice(0, 180)) + "\u2026", 1)
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(data).srokKhraneniyaSlug) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/spravochnik/srok-khraneniya/${unref(data).srokKhraneniyaSlug}`,
            class: "resource-card resource-card--srok"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a, _b;
              if (_push2) {
                _push2(`<span class="resource-card__emoji" aria-hidden="true" data-v-910b9063${_scopeId}>\u23F1</span><div data-v-910b9063${_scopeId}><h2 data-v-910b9063${_scopeId}>\u0421\u0440\u043E\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u2014 ${ssrInterpolate(unref(data).name.toLowerCase())}</h2><p data-v-910b9063${_scopeId}>${ssrInterpolate((_a = unref(data).srokKhraneniyaShort) == null ? void 0 : _a.slice(0, 180))}\u2026</p></div>`);
              } else {
                return [
                  createVNode("span", {
                    class: "resource-card__emoji",
                    "aria-hidden": "true"
                  }, "\u23F1"),
                  createVNode("div", null, [
                    createVNode("h2", null, "\u0421\u0440\u043E\u043A\u0438 \u0445\u0440\u0430\u043D\u0435\u043D\u0438\u044F \u2014 " + toDisplayString(unref(data).name.toLowerCase()), 1),
                    createVNode("p", null, toDisplayString((_b = unref(data).srokKhraneniyaShort) == null ? void 0 : _b.slice(0, 180)) + "\u2026", 1)
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        if (unref(data).ostatkiSlug) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: `/iz-ostatkov/${unref(data).ostatkiSlug}`,
            class: "resource-card resource-card--ostatki"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              var _a, _b;
              if (_push2) {
                _push2(`<span class="resource-card__emoji" aria-hidden="true" data-v-910b9063${_scopeId}>\u267B\uFE0F</span><div data-v-910b9063${_scopeId}><h2 data-v-910b9063${_scopeId}>\u0418\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432 \u2014 ${ssrInterpolate(unref(data).name.toLowerCase())}</h2><p data-v-910b9063${_scopeId}>${ssrInterpolate((_a = unref(data).ostatkiShort) == null ? void 0 : _a.slice(0, 180))}\u2026</p></div>`);
              } else {
                return [
                  createVNode("span", {
                    class: "resource-card__emoji",
                    "aria-hidden": "true"
                  }, "\u267B\uFE0F"),
                  createVNode("div", null, [
                    createVNode("h2", null, "\u0418\u0437 \u043E\u0441\u0442\u0430\u0442\u043A\u043E\u0432 \u2014 " + toDisplayString(unref(data).name.toLowerCase()), 1),
                    createVNode("p", null, toDisplayString((_b = unref(data).ostatkiShort) == null ? void 0 : _b.slice(0, 180)) + "\u2026", 1)
                  ])
                ];
              }
            }),
            _: 1
          }, _parent));
        } else {
          _push(`<!---->`);
        }
        _push(`</div>`);
        if (unref(missingCount) > 0) {
          _push(`<section class="future-info" data-v-910b9063><p data-v-910b9063> \u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u0440\u0435\u0446\u0435\u043F\u0442\u043E\u0432 \u043F\u043E\u0434 \u044D\u0442\u043E\u0442 \u043F\u0440\u043E\u0434\u0443\u043A\u0442 \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u043F\u043E\u0437\u0436\u0435 \u2014 \u043D\u0430\u043F\u043E\u043B\u043D\u044F\u0435\u043C \u0431\u0430\u0437\u0443. \u0410 \u043F\u043E\u043A\u0430 \u043F\u043E\u0434\u0431\u0435\u0440\u0438 \u0431\u043B\u044E\u0434\u043E \u0447\u0435\u0440\u0435\u0437 `);
          _push(ssrRenderComponent(_component_NuxtLink, { to: "/chto-prigotovit/iz-togo-chto-est" }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \xAB\u0438\u0437 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u0435\u0441\u0442\u044C\xBB`);
              } else {
                return [
                  createTextVNode("\u0441\u0435\u043B\u0435\u043A\u0442\u043E\u0440 \xAB\u0438\u0437 \u0442\u043E\u0433\u043E, \u0447\u0442\u043E \u0435\u0441\u0442\u044C\xBB")
                ];
              }
            }),
            _: 1
          }, _parent));
          _push(` \u0438\u043B\u0438 \u043E\u0442\u043A\u0440\u043E\u0439 \u0433\u043E\u0442\u043E\u0432\u043E\u0435 \u043C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E. </p></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="cta-block" data-v-910b9063><p data-v-910b9063><strong data-v-910b9063>\u0425\u043E\u0447\u0435\u0448\u044C \u043C\u0435\u043D\u044E \u043F\u043E\u0434 \u0441\u0432\u043E\u0438 \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u044B \u2014 \u0431\u0435\u0437 \u043F\u043E\u0434\u0431\u043E\u0440\u0430 \u043A\u0430\u0436\u0434\u044B\u0439 \u0434\u0435\u043D\u044C?</strong></p><a href="/onboarding" class="btn-cta" data-v-910b9063>\u0421\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043C\u0435\u043D\u044E \u0437\u0430 60 \u0441\u0435\u043A</a><small data-v-910b9063>\u0410\u043B\u0433\u043E\u0440\u0438\u0442\u043C \u0441\u043E\u0431\u0435\u0440\u0451\u0442 \u043C\u0435\u043D\u044E \u0441 \u0443\u0447\u0451\u0442\u043E\u043C \u043F\u0440\u043E\u0434\u0443\u043A\u0442\u043E\u0432, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u0442\u044B \u043B\u044E\u0431\u0438\u0448\u044C.</small></div></article>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/iz/[ingredient].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _ingredient_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-910b9063"]]);

export { _ingredient_ as default };
//# sourceMappingURL=_ingredient_-sMUK49k3.mjs.map
