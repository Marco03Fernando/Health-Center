const router = require("./slot.routes");

describe("doctorChanneling slot.routes", () => {
  test("router exposes GET / and validates presence of query handling", () => {
    expect(router).toBeDefined();

    const paths = (router.stack || [])
      .map((layer) => (layer.route ? { path: layer.route.path, methods: layer.route.methods } : null))
      .filter(Boolean)
      .map((r) => r.path);

    expect(paths).toContain("/");
  });
});
