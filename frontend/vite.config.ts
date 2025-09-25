import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    svgr({
      svgrOptions: {
        icon: true,
        // This will transform your SVG to a React component
        exportType: "named",
        namedExport: "ReactComponent",
      },
    }),
  ],
  server: {
    host: "0.0.0.0", // necessário para funcionar no Docker
    port: 5173, // porta padrão do Vite
    strictPort: true,
    watch: {
      usePolling: true, // útil em ambientes Docker/Linux
    },
  },
});
