// ═══════════════════════════════════════════════════════════════
// src/lib/queryClient.js — إعداد TanStack Query (Offline-First SQLite)
// ═══════════════════════════════════════════════════════════════
import { QueryClient } from '@tanstack/react-query'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // التطبيق يعمل على SQLite محلي بالكامل — لا نعلّق الاستعلامات بدون إنترنت
        networkMode: 'always',
        // قاعدة البيانات المحلية لا تتغير إلا عبر الـ mutations الخاصة بنا
        staleTime: Infinity,
        gcTime: 1000 * 60 * 30, // الاحتفاظ بالكاش لمدة 30 دقيقة
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1,
      },
      mutations: {
        networkMode: 'always',
        retry: false,
      },
    },
  })
}

export const queryClient = createQueryClient()
