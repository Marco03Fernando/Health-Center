const router = require("./testTypeRoutes");

describe("TestManagement testTypeRoutes", () => {
  test("exports an express router with expected routes", () => {
    expect(router).toBeDefined();

    const paths = (router.stack || [])
      .map((layer) => (layer.route ? { path: layer.route.path, methods: layer.route.methods } : null))
      .filter(Boolean)
      .map((r) => r.path);

    const expected = [
      "/",
      "/",
      "/:id",
      "/:id",
      "/:id",
    ];

    expected.forEach((p) => expect(paths).toContain(p));
  });
});
