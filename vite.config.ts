import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Không tự cập nhật giữa ca: bản mới chờ ở trạng thái "waiting", UI chỉ hiện "Có bản mới — Tải lại" ở Sảnh/Cài đặt.
      registerType: 'prompt',
      // Đăng ký thủ công trong src/platform/pwa.ts và chỉ ở bản build; manifest viết tay ở public/.
      injectRegister: false,
      manifest: false,
      workbox: {
        // Precache toàn bộ asset của bản build, gồm font woff2 (trình duyệt hỗ trợ PWA đều dùng được woff2).
        globPatterns: ['**/*.{js,css,html,woff2,png,svg,webmanifest}'],
        navigateFallback: 'index.html',
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  base: './',
  test: {
    include: ['src/**/*.test.ts', 'tools/**/*.test.ts'],
    environment: 'node',
  },
});
