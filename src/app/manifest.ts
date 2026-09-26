import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KhaoScan - Modern QR Restaurant Platform",
    short_name: "KhaoScan",
    description: "Premium in-restaurant QR ordering, kitchen management, UPI payments, and dining operations platform.",
    start_url: "/",
    display: "standalone",
    background_color: "#071117",
    theme_color: "#071117",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/apple-icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
