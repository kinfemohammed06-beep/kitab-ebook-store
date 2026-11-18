module.exports = {
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  webpack: (config) => { config.resolve.alias.canvas = false; return config; }, // pdfjs optional dependency
};
