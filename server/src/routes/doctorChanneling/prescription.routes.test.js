const router = require("./prescription.routes");

describe("doctorChanneling prescription.routes", () => {
  test("router registers expected paths and methods", () => {
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
      { path: "/doctor/me", methods: ["get"] },
      { path: "/", methods: ["get", "post"] },
      { path: "/:id/pdf", methods: ["get"] },
      { path: "/:id", methods: ["get"] },
      { path: "/:id/dispense", methods: ["patch"] },
    ];

    expectList.forEach((exp) => {
      expect(paths.has(exp.path)).toBe(true);
      exp.methods.forEach((m) => expect(paths.get(exp.path)).toContain(m));
    });
  });
});
