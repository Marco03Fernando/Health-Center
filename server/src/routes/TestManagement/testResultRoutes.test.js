const router = require("./testResultRoutes");

describe("TestManagement testResultRoutes", () => {
  test("exports an express router with expected routes", () => {
    expect(router).toBeDefined();

    const paths = (router.stack || [])
      .map((layer) => (layer.route ? { path: layer.route.path, methods: layer.route.methods } : null))
      .filter(Boolean)
      .map((r) => r.path);

    // Expected registered route paths (order may vary)
    const expected = [
      "/",
      "/patient/:patientId",
      "/:id/pdf",
      "/:id/send-whatsapp",
      "/:id/send-email",
      "/:id",
      "/:id",
      "/:id",
    ];

    expected.forEach((p) => expect(paths).toContain(p));
  });
});
