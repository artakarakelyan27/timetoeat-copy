// src/stores/notifications.js
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotifStore = defineStore('notifications', () => {
    const unreadCount = ref(0)

    // Вызывать при получении push-уведомления
    function increment() { unreadCount.value++ }
    function markAllRead() { unreadCount.value = 0 }

    return { unreadCount, increment, markAllRead }
})