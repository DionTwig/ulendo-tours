import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://ulendotours.co.za",
  output: "static",
  trailingSlash: "ignore",
  build: {
    format: "file",
    inlineStylesheets: "auto",
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap({
      filter: (page) => !page.includes("/pay"),
    }),
  ],
});
