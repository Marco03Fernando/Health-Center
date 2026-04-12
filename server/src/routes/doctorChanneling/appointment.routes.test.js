const router = require("./appointment.routes");

describe("doctorChanneling appointment.routes", () => {
  test("router registers booking, lists, status update and cancel routes", () => {
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
      { path: "/", methods: ["post"] },
      { path: "/user/:userId", methods: ["get"] },
      { path: "/doctor/me", methods: ["get"] },
      { path: "/:id/status", methods: ["patch"] },
      { path: "/:id/cancel", methods: ["delete"] },
    ];

    expectList.forEach((exp) => {
      expect(paths.has(exp.path)).toBe(true);
      exp.methods.forEach((m) => expect(paths.get(exp.path)).toContain(m));
    });
  });
});
