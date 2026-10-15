// Worker mínimo: API routes (ninguna) + assets estáticos con SPA fallback.
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request);
  },
};
