import type { ComputedRef, MaybeRef } from 'vue'
export type LayoutKey = "default"
declare module "../../../node_modules/.pnpm/nuxt@3.13.2_@parcel+watcher@2.5.6_@types+node@22.7.4_db0@0.3.4_ioredis@5.10.1_lightning_4d6c68a1855b9ba02a2e67c7168efc5c/node_modules/nuxt/dist/pages/runtime/composables" {
  interface PageMeta {
    layout?: MaybeRef<LayoutKey | false> | ComputedRef<LayoutKey | false>
  }
}