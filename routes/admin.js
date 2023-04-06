const express = require("express");
const router = express.Router();
const admins = require("../middlewares/admins");
const { authenticate, superAuthenticate } = require("../middlewares/auth");
const upload = require("../utils/imageupload.util");

/**
 * Testing routes
 */
// router.get("/", authenticate(true, true), admins.checkAdmin);
// router.get("/no", authenticate(true, false), admins.checkUser);


/**
 * routes like 'GET' /admin/ads
 */

router.get("/admins", authenticate(true, true), superAuthenticate, admins.getAdmins);

router.post("/admins/add", authenticate(true, true), superAuthenticate, async (req, res)=> admins.updateAdmin(req, res, true));

router.delete("/admins/delete", authenticate(true, true), superAuthenticate, async (req, res)=> admins.updateAdmin(req, res, false));

router.get("/ads", authenticate(true, true), admins.getAds);

router.get("/ads/:adId", authenticate(true, true), admins.getAd);

router.post("/ads/:adId/approve", authenticate(true, true), admins.approveAd);

router.post("/ads/:adId/quote-price", authenticate(true, true), admins.quotePrice);

router.delete("/ads/:adId/delete", authenticate(true, true), admins.deleteAd);

router.post("/ads/:adId/edit", authenticate(true, true), admins.editAd);

router.post("/categories/add", authenticate(true, true), admins.addCategory);

router.delete("/categories/delete/:categoryId", authenticate(true, true), admins.removeCategory);


module.exports = router;