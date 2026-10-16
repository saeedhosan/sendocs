import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

/*
 * Where "/api" and "/health" are proxied in dev.
 *
 * Defaults to the host-published API ("bun run dev" alongside
 * "php artisan serve"). The Compose web service overrides this with
 * VITE_API_PROXY=http://api:8000 so container-to-container traffic stays
 * on the compose network. VITE_API_URL is the browser-facing API base and
 * must remain unset when requests should use the same-origin proxy.
 */
const apiProxyTarget =
    process.env.VITE_API_PROXY ??
    process.env.VITE_API_URL ??
    "http://127.0.0.1:8000";

// https://vite.dev/config/
export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(import.meta.dirname, "src"),
        },
    },
    plugins: [tailwindcss(), react()],
    server: {
        host: "0.0.0.0",
        port: 3000,
        strictPort: true,
        proxy: process.env.PLAYWRIGHT
            ? undefined
            : {
                  "/api": {
                      target: apiProxyTarget,
                      changeOrigin: true,
                  },
                  "/health": {
                      target: apiProxyTarget,
                      changeOrigin: true,
                  },
              },
    },
    test: {
        environment: "jsdom",
        setupFiles: ["./tests/setup.ts"],
        css: true,
        include: ["tests/{unit,feature}/**/*.{test,spec}.{ts,tsx}"],
        exclude: ["tests/e2e/**", "node_modules/**"],
    },
});
