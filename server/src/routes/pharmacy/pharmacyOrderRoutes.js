const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderItems,
} = require("../../controllers/pharmacy/pharmacyOrderController");

const { protect } = require("../../middlewares/auth.middleware");
const { allowRoles } = require("../../middlewares/role.middleware");

router.get("/test", (req, res) => res.json({ ok: true }));

router.post("/", protect, allowRoles("pharmacy", "PHARMACIST"), createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);


router.put("/:id", protect, allowRoles("pharmacy", "PHARMACIST"), updateOrder);


router.put(
  "/:id/items",
  protect,
  allowRoles("pharmacy", "PHARMACIST"),
  updateOrderItems
);

module.exports = router;