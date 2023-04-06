const express = require("express");
const router = express.Router();
const users = require("../middlewares/users");
const { authenticate } = require("../middlewares/auth");
const upload = require("../utils/imageupload.util");

router.post("/login", users.userLogin);

router.post("/signup", users.userRegister);

router.post("/verify/:token", users.verifyuser);

router.get("/protected", authenticate(true, false), users.isUser);

router.post("/edit", authenticate(true, false), users.editUser);

router.get("/ads", authenticate(true, false), users.getAds);

router.get("/ads/:adId/approve-ad", authenticate(true, false), users.approveAd);

router.get("/ads/:adId/reject-ad", authenticate(true, false), users.rejectAd);

router.get("/cart", authenticate(true, false), users.getCart);

router.post("/add-to-cart", authenticate(true, false), users.addToCart);

router.post("/delete-from-cart", authenticate(true, false), users.deleteFromCart);

router.post("/place-order", authenticate(true, false), users.placeOrder);

router.get("/orders", authenticate(true, false), users.getOrders);

router.get("/orders/:orderId", authenticate(true, false), users.getOrder);

router.post("/checkout", authenticate(true, false), users.checkout);

router.post("/paymentverification", authenticate(true, false), users.paymentVerification);

router.post("/ads/:adId/edit-images", authenticate(true, false), upload.array('images',5), users.editAdImages);

module.exports = router;