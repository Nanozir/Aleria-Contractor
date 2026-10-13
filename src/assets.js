// Resolves files in /public so they work both locally and on GitHub Pages (sub-path hosting).
// public/ is served as-is (not copied into the build), so paths keep the "public/" prefix.
export const asset = (path) => `${import.meta.env.BASE_URL}public/${path.replace(/^\/+/, "").replace(/^public\//, "")}`;
