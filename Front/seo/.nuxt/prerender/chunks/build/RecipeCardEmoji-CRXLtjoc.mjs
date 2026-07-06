import { _ as __nuxt_component_0 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, computed, mergeProps, withCtx, unref, createVNode, toDisplayString, openBlock, createBlock, createCommentVNode, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
import { ssrRenderComponent, ssrRenderStyle, ssrInterpolate } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/server-renderer/index.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';

const meals = {
  breakfast: {
    bg: "#FEF3C7",
    fg: "#633806",
    dot: "#D97706",
    label: "\u0417\u0430\u0432\u0442\u0440\u0430\u043A",
    emojiHint: "\u2600\uFE0F"
  },
  lunch: {
    bg: "#EBF8F1",
    fg: "#085041",
    dot: "#1D9E75",
    label: "\u041E\u0431\u0435\u0434",
    emojiHint: "\u{1F372}"
  },
  dinner: {
    bg: "#EEEDFE",
    fg: "#3C3489",
    dot: "#7F77DD",
    label: "\u0423\u0436\u0438\u043D",
    emojiHint: "\u{1F37D}\uFE0F"
  },
  snack: {
    bg: "#E6F1FB",
    fg: "#0C447C",
    dot: "#378ADD",
    label: "\u041F\u0435\u0440\u0435\u043A\u0443\u0441",
    emojiHint: "\u{1F34E}"
  }
};
function mealVisual(mealType) {
  const normalized = (mealType || "").toLowerCase().trim();
  switch (normalized) {
    case "\u0437\u0430\u0432\u0442\u0440\u0430\u043A":
    case "breakfast":
      return meals.breakfast;
    case "\u043E\u0431\u0435\u0434":
    case "lunch":
      return meals.lunch;
    case "\u0443\u0436\u0438\u043D":
    case "dinner":
      return meals.dinner;
    case "\u043F\u0435\u0440\u0435\u043A\u0443\u0441":
    case "snack":
      return meals.snack;
    default:
      return meals.lunch;
  }
}
const defaultBg = "#E4F5EA";
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "RecipeCardEmoji",
  __ssrInlineRender: true,
  props: {
    recipe: {}
  },
  setup(__props) {
    const props = __props;
    const mealLabel = computed(() => {
      if (!props.recipe.meal_type) return null;
      return mealVisual(props.recipe.meal_type).label;
    });
    const mealStyle = computed(() => {
      if (!props.recipe.meal_type) return {};
      const v = mealVisual(props.recipe.meal_type);
      return { background: v.bg, color: v.fg };
    });
    return (_ctx, _push, _parent, _attrs) => {
      const _component_NuxtLink = __nuxt_component_0;
      _push(ssrRenderComponent(_component_NuxtLink, mergeProps({
        to: `/recepty/${_ctx.recipe.slug}`,
        class: "recipe-card-emoji"
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div class="recipe-card-emoji__hero" style="${ssrRenderStyle({ background: _ctx.recipe.bg_color || defaultBg })}" data-v-3291554d${_scopeId}><span aria-hidden="true" data-v-3291554d${_scopeId}>${ssrInterpolate(_ctx.recipe.emoji || "\u{1F37D}\uFE0F")}</span></div><div class="recipe-card-emoji__body" data-v-3291554d${_scopeId}><h3 class="recipe-card-emoji__title" data-v-3291554d${_scopeId}>${ssrInterpolate(_ctx.recipe.name)}</h3><p class="recipe-card-emoji__meta" data-v-3291554d${_scopeId}>`);
            if (_ctx.recipe.time_minutes) {
              _push2(`<span data-v-3291554d${_scopeId}>\u23F1 ${ssrInterpolate(_ctx.recipe.time_minutes)} \u043C\u0438\u043D</span>`);
            } else {
              _push2(`<!---->`);
            }
            if (_ctx.recipe.kcal) {
              _push2(`<span data-v-3291554d${_scopeId}>\u{1F525} ${ssrInterpolate(_ctx.recipe.kcal)} \u043A\u043A\u0430\u043B</span>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(mealLabel)) {
              _push2(`<span class="meal-tag" style="${ssrRenderStyle(unref(mealStyle))}" data-v-3291554d${_scopeId}>${ssrInterpolate(unref(mealLabel))}</span>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</p></div>`);
          } else {
            return [
              createVNode("div", {
                class: "recipe-card-emoji__hero",
                style: { background: _ctx.recipe.bg_color || defaultBg }
              }, [
                createVNode("span", { "aria-hidden": "true" }, toDisplayString(_ctx.recipe.emoji || "\u{1F37D}\uFE0F"), 1)
              ], 4),
              createVNode("div", { class: "recipe-card-emoji__body" }, [
                createVNode("h3", { class: "recipe-card-emoji__title" }, toDisplayString(_ctx.recipe.name), 1),
                createVNode("p", { class: "recipe-card-emoji__meta" }, [
                  _ctx.recipe.time_minutes ? (openBlock(), createBlock("span", { key: 0 }, "\u23F1 " + toDisplayString(_ctx.recipe.time_minutes) + " \u043C\u0438\u043D", 1)) : createCommentVNode("", true),
                  _ctx.recipe.kcal ? (openBlock(), createBlock("span", { key: 1 }, "\u{1F525} " + toDisplayString(_ctx.recipe.kcal) + " \u043A\u043A\u0430\u043B", 1)) : createCommentVNode("", true),
                  unref(mealLabel) ? (openBlock(), createBlock("span", {
                    key: 2,
                    class: "meal-tag",
                    style: unref(mealStyle)
                  }, toDisplayString(unref(mealLabel)), 5)) : createCommentVNode("", true)
                ])
              ])
            ];
          }
        }),
        _: 1
      }, _parent));
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/RecipeCardEmoji.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const __nuxt_component_1 = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-3291554d"]]);

export { __nuxt_component_1 as _, mealVisual as m };
//# sourceMappingURL=RecipeCardEmoji-CRXLtjoc.mjs.map
