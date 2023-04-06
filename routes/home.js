const express = require("express");
const router = express.Router();
const categories = require("../middlewares/categories");
const ads = require("../middlewares/ads");
const locationApi = require("../middlewares/locationApi");
const { authenticate } = require("../middlewares/auth");
const upload = require("../utils/imageupload.util");

router.get("/categories", categories.showCategories);

router.get("/categories/:categoryName", categories.showCategory);

router.post("/categories/filter", categories.filterCategories);

router.get("/ads", ads.getAllAds);

router.get("/ads/:adId", ads.getAd);

router.post("/create-ad", authenticate(true, false), upload.array('images', 5), ads.createAd);

router.get("/states", locationApi.getStates);

router.get("/:state/cities", locationApi.getCities);

module.exports = router;