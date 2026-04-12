const router = require("./adminDoctor.routes");

describe("doctorChanneling adminDoctor.routes", () => {
  test("router registers expected admin paths with methods", () => {
    expect(router).toBeDefined();

    const paths = new Map();
    (router.stack || []).forEach((layer) => {
      if (layer.route) {
        const path = layer.route.path;
        const methods = Object.keys(layer.route.methods).filter((m) => layer.route.methods[m]);
        if (!paths.has(path)) paths.set(path, []);
        paths.set(path, Array.from(new Set(paths.get(path).concat(methods))));
      }
    });

    const expectList = [
      { path: "/", methods: ["post", "get"] },
      { path: "/:id", methods: ["get", "patch"] },
      { path: "/:id/active", methods: ["patch"] },
      { path: "/generate-upcoming-slots", methods: ["post"] },
      { path: "/cleanup-expired-slots", methods: ["post"] },
    ];

    expectList.forEach((exp) => {
      expect(paths.has(exp.path)).toBe(true);
      exp.methods.forEach((m) => expect(paths.get(exp.path)).toContain(m));
    });
  });
});
