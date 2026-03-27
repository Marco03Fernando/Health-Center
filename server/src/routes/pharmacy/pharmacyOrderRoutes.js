const express = require("express");
const router = express.Router();

const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderItems,
} = require("../../controllers/pharmacy/pharmacyOrderController");

router.get("/test", (req, res) => res.json({ ok: true }));

router.post("/", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);


router.put("/:id", updateOrder);


router.put("/:id/items", updateOrderItems);

module.exports = router;