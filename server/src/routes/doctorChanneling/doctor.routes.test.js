const router = require("./doctor.routes");

describe("doctorChanneling doctor.routes", () => {
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
      { path: "/me", methods: ["get", "patch"] },
      { path: "/", methods: ["get"] },
      { path: "/:id", methods: ["get"] },
    ];

    expectList.forEach((exp) => {
      expect(paths.has(exp.path)).toBe(true);
      exp.methods.forEach((m) => expect(paths.get(exp.path)).toContain(m));
    });
  });
});
