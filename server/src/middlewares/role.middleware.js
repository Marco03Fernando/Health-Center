function allowRoles(...roles) {
  return (req, res, next) => {
    const account = req.user || req.admin;

    if (!account) {
      return res.status(401).json({ message: "Not authorized" });
    }

    if (!roles.includes(account.role)) {
      return res.status(403).json({ message: "Forbidden: insufficient permissions" });
    }

    next();
  };
}

module.exports = { allowRoles };