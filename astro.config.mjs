import { defineConfig } from "astro/config";

import tailwindcss from "@tailwindcss/vite";

import netlify from '@astrojs/netlify';
// import vercel from "@astrojs/vercel";

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
  },

  adapter: netlify(),
});
