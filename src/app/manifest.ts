import type { MetadataRoute } from "next";

import { withBasePath } from "@/lib/app-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "RAIL Photo Map",
    short_name: "RAIL PM",
    description: "Upload geotagged railway photos and view where they were taken.",
    start_url: withBasePath("/"),
    scope: withBasePath("/"),
    display: "standalone",
    background_color: "#f6f4ee",
    theme_color: "#176b52",
    icons: [
      { src: withBasePath("/icons/rail-pm-192.png"), sizes: "192x192", type: "image/png", purpose: "any" },
      { src: withBasePath("/icons/rail-pm-512.png"), sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
