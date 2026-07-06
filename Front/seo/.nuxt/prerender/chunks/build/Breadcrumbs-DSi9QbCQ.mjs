import { _ as __nuxt_component_0$1 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, mergeProps, withCtx, createTextVNode, toDisplayString, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderList, ssrRenderComponent, ssrInterpolate } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/server-renderer/index.mjs';
import { h as useRuntimeConfig, u as useHead } from './server.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "Breadcrumbs",
  __ssrInlineRender: true,
  props: {
    items: {}
  },
  setup(__props) {
    const props = __props;
    const config = useRuntimeConfig().public;
    const siteUrl = config.siteUrl;
    useHead({
      script: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: props.items.map((it, idx) => ({
              "@type": "ListItem",
              position: idx + 1,
              name: it.label,
              item: it.to ? `${siteUrl}${it.to}` : void 0
            }))
          })
        }
      ]
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0$1;
      _push(`<nav${ssrRenderAttrs(mergeProps({
        class: "crumbs",
        "aria-label": "\u0425\u043B\u0435\u0431\u043D\u044B\u0435 \u043A\u0440\u043E\u0448\u043A\u0438"
      }, _attrs))} data-v-dce627e3><ol class="crumbs__list" data-v-dce627e3><!--[-->`);
      ssrRenderList(_ctx.items, (item, i) => {
        _push(`<li data-v-dce627e3>`);
        if (item.to && i < _ctx.items.length - 1) {
          _push(ssrRenderComponent(_component_NuxtLink, {
            to: item.to
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`${ssrInterpolate(item.label)}`);
              } else {
                return [
                  createTextVNode(toDisplayString(item.label), 1)
                ];
              }
            }),
            _: 2
          }, _parent));
        } else {
          _push(`<span data-v-dce627e3>${ssrInterpolate(item.label)}</span>`);
        }
        if (i < _ctx.items.length - 1) {
          _push(`<span class="crumbs__sep" aria-hidden="true" data-v-dce627e3>/</span>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</li>`);
      });
      _push(`<!--]--></ol></nav>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Breadcrumbs.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-dce627e3"]]);

export { __nuxt_component_0 as _ };
//# sourceMappingURL=Breadcrumbs-DSi9QbCQ.mjs.map
