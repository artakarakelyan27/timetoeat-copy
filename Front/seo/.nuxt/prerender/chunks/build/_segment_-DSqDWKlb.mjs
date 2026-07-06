import { _ as __nuxt_component_0 } from './Breadcrumbs-DSi9QbCQ.mjs';
import { _ as __nuxt_component_0$1 } from './nuxt-link-B4HGCpJi.mjs';
import { defineComponent, withAsyncContext, computed, unref, withCtx, createVNode, toDisplayString, useSSRContext } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/index.mjs';
import { ssrRenderAttrs, ssrRenderComponent, ssrInterpolate, ssrRenderList, ssrRenderClass } from 'file:///var/www/time-to-eat-copy/Front/node_modules/.pnpm/vue@3.5.12_typescript@5.6.2/node_modules/vue/server-renderer/index.mjs';
import { f as useRoute, c as createError, h as useRuntimeConfig, u as useHead } from './server.mjs';
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
  __name: "[segment]",
  __ssrInlineRender: true,
  async setup(__props) {
    var _a;
    let __temp, __restore;
    const route = useRoute();
    const segment = route.params.segment;
    const { data } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      `menyu-${segment}`,
      () => $fetch("/api/_content/menyu", { query: { slug: segment } })
    )), __temp = await __temp, __restore(), __temp);
    if (!data.value) {
      throw createError({ statusCode: 404, statusMessage: "\u041C\u0435\u043D\u044E \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E" });
    }
    const { data: allMenus } = ([__temp, __restore] = withAsyncContext(() => useAsyncData(
      "all-menus",
      () => $fetch("/api/_content/menyu")
    )), __temp = await __temp, __restore(), __temp);
    const otherMenus = computed(
      () => (allMenus.value || []).filter((m) => m.slug !== segment)
    );
    useSeoHead({
      title: data.value.title,
      description: data.value.short_answer.slice(0, 158),
      path: `/menyu-na-nedelyu/${segment}`,
      ogSlug: `menyu-na-nedelyu/${segment}`
    });
    const config = useRuntimeConfig().public;
    const schemas = [];
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: data.value.title,
      description: data.value.short_answer,
      datePublished: data.value.updated,
      dateModified: data.value.updated,
      author: {
        "@type": "Organization",
        name: "\u0412\u0440\u0435\u043C\u044F \u0415\u0441\u0442\u044C",
        url: config.siteUrl
      },
      publisher: {
        "@type": "Organization",
        name: "\u0412\u0440\u0435\u043C\u044F \u0415\u0441\u0442\u044C",
        url: config.siteUrl,
        logo: {
          "@type": "ImageObject",
          url: `${config.siteUrl}/og/default.png`
        }
      }
    });
    const itemList = [];
    let pos = 1;
    for (const d of data.value.days || []) {
      for (const [_key, meal] of Object.entries(d.meals || {})) {
        itemList.push({
          "@type": "ListItem",
          position: pos++,
          name: meal.title,
          description: `${d.name}: ${meal.kcal || meal.kcal_per_person || ""} \u043A\u043A\u0430\u043B`
        });
      }
    }
    schemas.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: itemList
    });
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
    useHead({
      script: schemas.map((s) => ({ type: "application/ld+json", children: JSON.stringify(s) }))
    });
    function formatDate(d) {
      if (!d) return "";
      return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
    }
    const MEAL_LABELS = {
      breakfast: "\u0417\u0430\u0432\u0442\u0440\u0430\u043A",
      snack1: "\u041F\u0435\u0440\u0435\u043A\u0443\u0441 1",
      lunch: "\u041E\u0431\u0435\u0434",
      snack2: "\u041F\u0435\u0440\u0435\u043A\u0443\u0441 2",
      snack: "\u041F\u0435\u0440\u0435\u043A\u0443\u0441",
      dinner: "\u0423\u0436\u0438\u043D"
    };
    function mealLabel(key) {
      return MEAL_LABELS[String(key)] || String(key);
    }
    function mealClass(key) {
      const k = String(key);
      if (k === "breakfast") return "breakfast";
      if (k === "lunch") return "lunch";
      if (k === "dinner") return "dinner";
      return "snack";
    }
    return (_ctx, _push, _parent, _attrs) => {
      var _a2, _b, _c, _d, _e, _f, _g;
      const _component_Breadcrumbs = __nuxt_component_0;
      const _component_NuxtLink = __nuxt_component_0$1;
      if (unref(data)) {
        _push(`<article${ssrRenderAttrs(_attrs)} data-v-8fe85227>`);
        _push(ssrRenderComponent(_component_Breadcrumbs, {
          items: [
            { label: "\u0413\u043B\u0430\u0432\u043D\u0430\u044F", to: "/" },
            { label: "\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E", to: "/menyu-na-nedelyu" },
            { label: unref(data).title.replace("\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E ", "").replace("\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E \u2014 ", "") }
          ]
        }, null, _parent));
        _push(`<header class="menu-head" data-v-8fe85227><div class="menu-head__emoji" aria-hidden="true" data-v-8fe85227>${ssrInterpolate(unref(data).emoji)}</div><div data-v-8fe85227><h1 data-v-8fe85227>${ssrInterpolate(unref(data).title)}</h1><p class="menu-head__audience" data-v-8fe85227><strong data-v-8fe85227>\u0414\u043B\u044F \u043A\u043E\u0433\u043E:</strong> ${ssrInterpolate(unref(data).audience)}</p></div></header><aside class="quick-answer" data-v-8fe85227><p data-v-8fe85227>${ssrInterpolate(unref(data).short_answer)}</p><small data-v-8fe85227>\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: ${ssrInterpolate(formatDate(unref(data).updated))}</small></aside><section class="how-picked" data-v-8fe85227><h2 data-v-8fe85227>\u041A\u0430\u043A \u043C\u044B \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u043B\u0438 \u044D\u0442\u043E \u043C\u0435\u043D\u044E</h2><p data-v-8fe85227>${ssrInterpolate(unref(data).how_we_picked)}</p>`);
        if (unref(data).totals) {
          _push(`<div class="how-picked__stats" data-v-8fe85227>`);
          if (unref(data).totals.avg_kcal || unref(data).totals.avg_kcal_per_person || unref(data).totals.avg_kcal_adult) {
            _push(`<div class="stat" data-v-8fe85227><strong data-v-8fe85227>${ssrInterpolate(unref(data).totals.avg_kcal || unref(data).totals.avg_kcal_per_person || unref(data).totals.avg_kcal_adult)}</strong><span data-v-8fe85227>\u043A\u043A\u0430\u043B \u0432 \u0434\u0435\u043D\u044C</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(data).totals.active_cook_time_total_min) {
            _push(`<div class="stat" data-v-8fe85227><strong data-v-8fe85227>${ssrInterpolate(unref(data).totals.active_cook_time_total_min)}</strong><span data-v-8fe85227>\u043C\u0438\u043D\u0443\u0442 \u0433\u043E\u0442\u043E\u0432\u043A\u0438 \u0437\u0430 \u043D\u0435\u0434\u0435\u043B\u044E</span></div>`);
          } else {
            _push(`<!---->`);
          }
          if (unref(data).weekly_budget_hint) {
            _push(`<div class="stat stat--wide" data-v-8fe85227><strong data-v-8fe85227>\u0411\u044E\u0434\u0436\u0435\u0442:</strong><span data-v-8fe85227>${ssrInterpolate(unref(data).weekly_budget_hint)}</span></div>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</section><div class="cta-block" data-v-8fe85227><p data-v-8fe85227><strong data-v-8fe85227>\u0425\u043E\u0447\u0435\u0448\u044C \u044D\u0442\u043E \u043C\u0435\u043D\u044E \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438 \u0441 \u0433\u043E\u0442\u043E\u0432\u044B\u043C \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u043F\u043E\u043A\u0443\u043F\u043E\u043A?</strong></p><a href="/" class="btn-cta" data-v-8fe85227>\u0421\u043E\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u043C\u0435\u043D\u044E \u0437\u0430 60 \u0441\u0435\u043A</a><small data-v-8fe85227>\u0411\u0435\u0437 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0434\u043E \u043F\u0435\u0440\u0432\u043E\u0433\u043E \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u0430</small></div><section class="days" aria-labelledby="days-h" data-v-8fe85227><h2 id="days-h" data-v-8fe85227>\u041C\u0435\u043D\u044E \u043D\u0430 7 \u0434\u043D\u0435\u0439</h2><!--[-->`);
        ssrRenderList(unref(data).days, (d) => {
          _push(`<div class="day" data-v-8fe85227><header class="day__head" data-v-8fe85227><div class="day__head-main" data-v-8fe85227><h3 data-v-8fe85227>${ssrInterpolate(d.name)}</h3><span class="day__time" data-v-8fe85227>\u23F1 ${ssrInterpolate(d.cook_time_active_min)} \u043C\u0438\u043D \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0439 \u0433\u043E\u0442\u043E\u0432\u043A\u0438</span>`);
          if (d.workout === true) {
            _push(`<span class="day__tag day__tag--workout" data-v-8fe85227>\u0442\u0440\u0435\u043D\u0438\u0440\u043E\u0432\u043A\u0430</span>`);
          } else {
            _push(`<!---->`);
          }
          if (d.cost_estimate_rub) {
            _push(`<span class="day__tag day__tag--cost" data-v-8fe85227>${ssrInterpolate(d.cost_estimate_rub)} \u20BD</span>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</div>`);
          if (d.note) {
            _push(`<p class="day__note" data-v-8fe85227>${ssrInterpolate(d.note)}</p>`);
          } else {
            _push(`<!---->`);
          }
          _push(`</header><ul class="day__meals" data-v-8fe85227><!--[-->`);
          ssrRenderList(d.meals, (meal, key) => {
            _push(`<li class="${ssrRenderClass([`meal--${mealClass(key)}`, "meal"])}" data-v-8fe85227><div class="meal__type-tag" data-v-8fe85227>${ssrInterpolate(mealLabel(key))}</div><div class="meal__body" data-v-8fe85227><h4 data-v-8fe85227>${ssrInterpolate(meal.title)}</h4><p class="meal__meta" data-v-8fe85227>`);
            if (meal.kcal || meal.kcal_per_person) {
              _push(`<span data-v-8fe85227>\u{1F525} ${ssrInterpolate(meal.kcal || meal.kcal_per_person)} \u043A\u043A\u0430\u043B</span>`);
            } else {
              _push(`<!---->`);
            }
            if (meal.protein_g) {
              _push(`<span data-v-8fe85227>\u{1F969} ${ssrInterpolate(meal.protein_g)} \u0433 \u0431\u0435\u043B\u043A\u0430</span>`);
            } else {
              _push(`<!---->`);
            }
            if (meal.time_min) {
              _push(`<span data-v-8fe85227>\u23F1 ${ssrInterpolate(meal.time_min)} \u043C\u0438\u043D</span>`);
            } else {
              _push(`<!---->`);
            }
            if (meal.cost_rub) {
              _push(`<span data-v-8fe85227>\u{1F4B0} ${ssrInterpolate(meal.cost_rub)} \u20BD</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</p>`);
            if (meal.note) {
              _push(`<p class="meal__note" data-v-8fe85227>${ssrInterpolate(meal.note)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div></li>`);
          });
          _push(`<!--]--></ul></div>`);
        });
        _push(`<!--]--></section>`);
        if ((_a2 = unref(data).defrost_schedule) == null ? void 0 : _a2.length) {
          _push(`<section class="schedule" data-v-8fe85227><h2 data-v-8fe85227>\u0427\u0442\u043E \u0438 \u043A\u043E\u0433\u0434\u0430 \u0434\u043E\u0441\u0442\u0430\u0442\u044C \u0438\u0437 \u043C\u043E\u0440\u043E\u0437\u0438\u043B\u043A\u0438</h2><ul data-v-8fe85227><!--[-->`);
          ssrRenderList(unref(data).defrost_schedule, (s, i) => {
            _push(`<li data-v-8fe85227>${ssrInterpolate(s)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_b = unref(data).prep_ahead) == null ? void 0 : _b.length) {
          _push(`<section class="prep" data-v-8fe85227><h2 data-v-8fe85227>\u0427\u0442\u043E \u0433\u043E\u0442\u043E\u0432\u0438\u0442\u0441\u044F \u0432\u043F\u0440\u043E\u043A</h2><ul data-v-8fe85227><!--[-->`);
          ssrRenderList(unref(data).prep_ahead, (s, i) => {
            _push(`<li data-v-8fe85227>${ssrInterpolate(s)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_c = unref(data).hidden_calories) == null ? void 0 : _c.length) {
          _push(`<section class="warnings" data-v-8fe85227><h2 data-v-8fe85227>\u0413\u0434\u0435 \u043F\u0440\u044F\u0447\u0443\u0442\u0441\u044F \u043A\u0430\u043B\u043E\u0440\u0438\u0438</h2><ul data-v-8fe85227><!--[-->`);
          ssrRenderList(unref(data).hidden_calories, (item, i) => {
            _push(`<li data-v-8fe85227>${ssrInterpolate(item)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_d = unref(data).budget_principles) == null ? void 0 : _d.length) {
          _push(`<section class="principles" data-v-8fe85227><h2 data-v-8fe85227>\u0411\u044E\u0434\u0436\u0435\u0442\u043D\u044B\u0435 \u043F\u0440\u0438\u043D\u0446\u0438\u043F\u044B</h2><!--[-->`);
          ssrRenderList(unref(data).budget_principles, (p, i) => {
            _push(`<div class="principle" data-v-8fe85227><h3 data-v-8fe85227>${ssrInterpolate(p.title)}</h3><p data-v-8fe85227>${ssrInterpolate(p.content)}</p></div>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_e = unref(data).do_not_save_on) == null ? void 0 : _e.length) {
          _push(`<section class="warnings warnings--coral" data-v-8fe85227><h2 data-v-8fe85227>\u041D\u0430 \u0447\u0451\u043C \u041D\u0415 \u0441\u0442\u043E\u0438\u0442 \u044D\u043A\u043E\u043D\u043E\u043C\u0438\u0442\u044C</h2><ul data-v-8fe85227><!--[-->`);
          ssrRenderList(unref(data).do_not_save_on, (item, i) => {
            _push(`<li data-v-8fe85227>${ssrInterpolate(item)}</li>`);
          });
          _push(`<!--]--></ul></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_f = unref(data).adjustments) == null ? void 0 : _f.length) {
          _push(`<section class="adjustments" data-v-8fe85227><h2 data-v-8fe85227>\u0427\u0442\u043E \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u0435\u0441\u043B\u0438</h2><!--[-->`);
          ssrRenderList(unref(data).adjustments, (a, i) => {
            _push(`<div class="adjustment" data-v-8fe85227><p class="adjustment__condition" data-v-8fe85227>${ssrInterpolate(a.condition)}</p><p class="adjustment__swap" data-v-8fe85227>${ssrInterpolate(a.swap)}</p></div>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<!---->`);
        }
        if ((_g = unref(data).faq) == null ? void 0 : _g.length) {
          _push(`<section class="faq" data-v-8fe85227><h2 data-v-8fe85227>\u0427\u0430\u0441\u0442\u044B\u0435 \u0432\u043E\u043F\u0440\u043E\u0441\u044B</h2><!--[-->`);
          ssrRenderList(unref(data).faq, (q, i) => {
            _push(`<details data-v-8fe85227><summary data-v-8fe85227>${ssrInterpolate(q.q)}</summary><p data-v-8fe85227>${ssrInterpolate(q.a)}</p></details>`);
          });
          _push(`<!--]--></section>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<section class="cross-links" data-v-8fe85227><h2 data-v-8fe85227>\u0421\u043E\u0441\u0435\u0434\u043D\u0438\u0435 \u043C\u0435\u043D\u044E</h2><div class="cross-links__grid" data-v-8fe85227><!--[-->`);
        ssrRenderList(unref(otherMenus), (other) => {
          _push(ssrRenderComponent(_component_NuxtLink, {
            key: other.slug,
            to: `/menyu-na-nedelyu/${other.slug}`,
            class: "cross-card"
          }, {
            default: withCtx((_, _push2, _parent2, _scopeId) => {
              if (_push2) {
                _push2(`<span class="cross-card__emoji" aria-hidden="true" data-v-8fe85227${_scopeId}>${ssrInterpolate(other.emoji)}</span><div data-v-8fe85227${_scopeId}><h3 data-v-8fe85227${_scopeId}>${ssrInterpolate(other.title.replace("\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E ", "").replace("\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E \u2014 ", ""))}</h3><p data-v-8fe85227${_scopeId}>${ssrInterpolate(other.audience)}</p></div>`);
              } else {
                return [
                  createVNode("span", {
                    class: "cross-card__emoji",
                    "aria-hidden": "true"
                  }, toDisplayString(other.emoji), 1),
                  createVNode("div", null, [
                    createVNode("h3", null, toDisplayString(other.title.replace("\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E ", "").replace("\u041C\u0435\u043D\u044E \u043D\u0430 \u043D\u0435\u0434\u0435\u043B\u044E \u2014 ", "")), 1),
                    createVNode("p", null, toDisplayString(other.audience), 1)
                  ])
                ];
              }
            }),
            _: 2
          }, _parent));
        });
        _push(`<!--]--></div></section><div class="cta-block cta-block--final" data-v-8fe85227><p data-v-8fe85227> \u0427\u0442\u043E\u0431\u044B \u044D\u0442\u043E \u043C\u0435\u043D\u044E \xAB\u0436\u0438\u043B\u043E\xBB \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438 \u0441 \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438\u043C \u0441\u043F\u0438\u0441\u043A\u043E\u043C \u043F\u043E\u043A\u0443\u043F\u043E\u043A \u0438 \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F\u043C\u0438 \xAB\u0434\u043E\u0441\u0442\u0430\u043D\u044C \u0438\u0437 \u043C\u043E\u0440\u043E\u0437\u0438\u043B\u043A\u0438\xBB \u2014 \u043E\u0442\u043A\u0440\u043E\u0439 \u0431\u0435\u0441\u043F\u043B\u0430\u0442\u043D\u043E \u0437\u0430 60 \u0441\u0435\u043A\u0443\u043D\u0434. </p><a href="/" class="btn-cta" data-v-8fe85227>\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0438</a></div></article>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/menyu-na-nedelyu/[segment].vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const _segment_ = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-8fe85227"]]);

export { _segment_ as default };
//# sourceMappingURL=_segment_-DSqDWKlb.mjs.map
