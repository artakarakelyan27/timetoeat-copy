/**
 * useApi — обёртка над $fetch с базой из runtimeConfig.
 *
 * Для серверных рендеров (SSR/SSG) ходит на API_BASE напрямую (без TLS).
 * На клиенте — относительные URL `/api/...`, которые проксирует Caddy.
 *
 * Использование в page.vue:
 *
 *   const { data: recipe } = await useAsyncData(
 *     `recipe-${slug}`,
 *     () => useApi(`/seo/recipes/${slug}`),
 *   );
 */
export function useApi<T = unknown>(path: string, opts?: any) {
	const config = useRuntimeConfig();

	const base = import.meta.server ? config.apiBase : '';
	const url = `${base}/api${path}`;

	return $fetch<T>(url, opts);
}
