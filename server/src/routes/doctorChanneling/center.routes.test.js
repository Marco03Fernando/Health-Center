const router = require("./center.routes");

describe("doctorChanneling center.routes", () => {
  test("router registers expected public and admin paths with methods", () => {
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
      { path: "/", methods: ["get"] },
      { path: "/featured", methods: ["get"] },
      { path: "/admin/all", methods: ["get"] },
      { path: "/admin", methods: ["post"] },
      { path: "/admin/:id", methods: ["patch"] },
      { path: "/admin/:id/active", methods: ["patch"] },
      { path: "/admin/:id/featured", methods: ["patch"] },
    ];

    expectList.forEach((exp) => {
      expect(paths.has(exp.path)).toBe(true);
      exp.methods.forEach((m) => expect(paths.get(exp.path)).toContain(m));
    });
  });
});
