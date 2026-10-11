// Resolves files in /public so they work both locally and on GitHub Pages (sub-path hosting).
export const asset = (path) => `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;
