import fs from 'node:fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import electron from 'vite-plugin-electron/simple';
import pkg from './package.json';
import dotenv from 'dotenv';
import path from "path";
import tsconfigPaths from 'vite-tsconfig-paths';
dotenv.config();
export default defineConfig(({ command }) => {
  fs.rmSync('dist-electron', { recursive: true, force: true });

  const isServe = command === 'serve';
  const isBuild = command === 'build';
  const sourcemap = isServe || !!process.env.VSCODE_DEBUG;

  return {
    define: {
      'process.env': process.env,
    },
    css: {
      devSourcemap: true,
    },
    resolve: {
      alias: {
        "@src": path.resolve(__dirname, "src"),
        "@interfaces": path.resolve(__dirname, "interfaces"),
        "@kutuphane": path.resolve(__dirname, "kutuphane"),
      },
    },
    plugins: [
      tsconfigPaths(),
      vue(),
      electron({
        main: {
          entry: 'electron/main/index.ts',
          onstart({ startup }) {
            if (process.env.VSCODE_DEBUG) {
              console.log(/* For `.vscode/.debug.script.mjs` */ '[startup] Electron App');
            } else {
              startup().then();
            }
          },
          vite: {
            build: {
              sourcemap,
              minify: isBuild,
              outDir: 'dist-electron/main',
              rollupOptions: {
                external: Object.keys(pkg.dependencies || {}),
              },
            },
            resolve: {
              alias: {
                "@src": path.resolve(__dirname, "src"),
                "@interfaces": path.resolve(__dirname, "interfaces"),
                "@kutuphane": path.resolve(__dirname, "kutuphane"),
              },
            },
          },
        },
        preload: {
          input: 'electron/preload/index.ts',
          vite: {
            build: {
              sourcemap: sourcemap ? 'inline' : undefined,
              minify: isBuild,
              outDir: 'dist-electron/preload',
              rollupOptions: {
                external: Object.keys(pkg.dependencies || {}),
              },
            },
            resolve: {
              alias: {
                "@src": path.resolve(__dirname, "src"),
                "@interfaces": path.resolve(__dirname, "interfaces"),
                "@kutuphane": path.resolve(__dirname, "kutuphane"),
              },
            },
          },
        },
        renderer: {},
      }),
    ],
    server: process.env.VSCODE_DEBUG && (() => {
      const url = new URL(pkg.debug.env.VITE_DEV_SERVER_URL);
      return {
        host: url.hostname,
        port: +url.port,
      };
    })(),
    clearScreen: false,
  };
});
