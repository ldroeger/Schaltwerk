/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Konva/react-konva ziehen im Node-Bundle-Pfad das optionale native
  // "canvas"-Paket nach (nur für serverseitiges Canvas-Rendering benötigt,
  // das wir nicht nutzen). Ohne diesen Eintrag bricht `next build` beim
  // Server-Bundling ab, obwohl der Editor per next/dynamic(ssr:false)
  // ohnehin nie serverseitig gerendert wird.
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: "commonjs canvas" }];
    return config;
  },
};
module.exports = nextConfig;
