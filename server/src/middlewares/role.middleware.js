function normalize(r) {
  if (!r) return "";
  return String(r).trim().toLowerCase();
}

function equivalentRole(role) {
  // normalize some common aliases
  const r = normalize(role);
  if (r === "pharmacist") return "pharmacy";
  if (r === "pharmacy") return "pharmacy";
  if (r === "admin") return "admin";
  if (r === "superadmin") return "superadmin";
  if (r === "doctor") return "doctor";
  if (r === "patient") return "patient";
  if (r === "receptionist") return "receptionist";
  return r;
}

function allowRoles(...roles) {
  const allowed = roles.map((r) => equivalentRole(r));

  return (req, res, next) => {
    const rawRole = req.user?.role || req.admin?.role || req.role;
    const role = equivalentRole(rawRole);

    if (!role) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!allowed.includes(role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
}

module.exports = { allowRoles };