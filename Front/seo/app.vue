<template>
	<div>
		<a class="skip-link" href="#main">Перейти к содержимому</a>
		<NuxtLayout>
			<NuxtPage />
		</NuxtLayout>
	</div>
</template>

<script setup lang="ts">
// Глобальные SEO-меты по умолчанию. Перекрываются на каждой странице
// через useSeoHead() (см. composables/useSeoHead.ts).
useHead({
	titleTemplate: (title?: string) =>
		title ? `${title} — Время Есть` : 'Время Есть — меню на неделю за 60 секунд',
});

// Yandex.Metrika (без блокировки рендера, async)
const { ymCounter } = useRuntimeConfig().public;
if (ymCounter) {
	useHead({
		script: [
			{
				children: `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window,document,"script","https://mc.yandex.ru/metrika/tag.js","ym");ym(${ymCounter},"init",{clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`,
				type: 'text/javascript',
				tagPosition: 'bodyClose',
			},
		],
		noscript: [
			{
				children: `<div><img src="https://mc.yandex.ru/watch/${ymCounter}" style="position:absolute; left:-9999px;" alt="" /></div>`,
				tagPosition: 'bodyClose',
			},
		],
	});
}
</script>
