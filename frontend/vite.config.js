import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());
  const isProduction = mode === "production";

  return defineConfig({
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_BACKEND_URL,
          changeOrigin: true,
          secure: false,
        },
      },
      host: true,
    },
    build: {
      // Minify and obfuscate code in production
      minify: isProduction ? "terser" : false,
      terserOptions: isProduction
        ? {
            compress: {
              drop_console: true, // Remove console.log
              drop_debugger: true, // Remove debugger statements
              pure_funcs: ["console.log", "console.info", "console.debug"],
            },
            mangle: {
              toplevel: true, // Mangle top-level names
            },
            format: {
              comments: false, // Remove all comments
            },
          }
        : {},
      // Split chunks to make reverse engineering harder
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query"],
            three: ["three", "@react-three/fiber", "@react-three/drei"],
          },
          // Randomize chunk names in production
          chunkFileNames: isProduction
            ? "assets/[hash].js"
            : "assets/[name]-[hash].js",
          entryFileNames: isProduction
            ? "assets/[hash].js"
            : "assets/[name]-[hash].js",
          assetFileNames: isProduction
            ? "assets/[hash].[ext]"
            : "assets/[name]-[hash].[ext]",
        },
      },
      // Generate source maps only in development
      sourcemap: !isProduction,
    },
    // Define environment variables securely
    define: {
      __DEV__: !isProduction,
    },
  });
};
