const User = require("../models/users");
const Ads = require("../models/ads");
const Category = require("../models/categories");
const _ = require("lodash");
const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const path = require("path");

/**
 * Testing admin middlewares/handlers
 */
// async function checkAdmin(req, res){
//     return res.status(200).json({message: "you have accessed admin route", user: req.user});
// }

// async function checkUser(req, res){
//     return res.status(200).json({message: "you have accessed user route", user: req.user});
// }

async function getAdmins(req, res) {
    try {
        const admins = await User.find({ admin: true });

        return res.status(200).json({
            message: "Admins fetched",
            admins: admins,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

async function updateAdmin(req, res, make) {
    try {
        const email = req.body.userEmail;
        let user = await User.findOne({email: email});

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        user.admin = make;
        await user.save();

        return res.status(200).json({
            message: "Admin updated successfully",
            admin: user,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

async function getAds(req, res) {
    try {
        const ads = await Ads.find({ sold: false });

        if (!ads) {
            return res.status(404).json({ message: "No ads to show" });
        }

        let pending = [];
        let negotiation = [];
        let accepted = [];

        for (let ad of ads) {
            if (!ad.negotiation) pending.push(ad);
            else if (ad.negotiation && !ad.quoted) negotiation.push(ad);
            else if (ad.negotiation && ad.quoted && ad.accepted) accepted.push(ad);
        }

        return res.status(200).json({
            message: "Ads fetched",
            ads: {
                pending: pending,
                negotiation: negotiation,
                accepted: accepted,
            },
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

async function getAd(req, res) {
    const adId = req.params.adId;
    try {
        const ad = await Ads.findOne({ _id: adId });
        if (!ad) {
            return res.status(404).json({
                message: "adId is invalid",
            });
        }
        return res.status(200).json({
            message: "Ad fetched",
            ad: ad,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

async function approveAd(req, res) {
    const adId = req.params.adId;
    let categories = req.body.categories;
    try {
        const ad = await Ads.findOne({
            _id: adId,
            approved: false,
            accepted: true,
            quoted: true,
        });
        if (!ad) {
            return res.status(404).json({
                message: "adId is invalid or ad is already processed",
            });
        }
        ad.fixedPrice = (0.30 * ad.quotedPrice) + ad.quotedPrice;
        ad.approved = true;
        ad.categories = categories;
        await ad.save();

        categories = categories.map((cat) => cat._id);
        const category = await Category.find({ _id: { $in: categories } });
        for (let cat of category) {
            cat.ads.push(ad._id);
            await cat.save();
        }
        return res.status(200).json({
            message: "Ad approved",
            ad: ad,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

async function editAd(req, res){
    const adId = req.params.adId;
    const {title, price, edition, damage, totalPages, markedPages, quotedPrice, fixedPrice, message} = req.body;
    const {authors, categories} = req.body;

    try {
        let ad = await Ads.findById(adId);
        if (!ad){
            return res.status(404).json({message: "Ad not found"});
        }

        if (title) ad.title = title;
        if (price) ad.price = price;
        if (edition) ad.edition = edition;
        if (damage) ad.damage = damage;
        if (totalPages) ad.totalPages = totalPages;
        if (markedPages) ad.markedPages = markedPages;
        if (quotedPrice) ad.quotedPrice = quotedPrice;
        if (fixedPrice) ad.fixedPrice = fixedPrice;
        if (message) ad.message = message;
        if (authors) ad.authors = authors;
        if (categories) ad.categories = categories;

        await ad.save();
        return res.status(200).json({
            message: "Ads updated successfully",
            ad: ad
        });

    }
    catch (err){
        console.log(err);
        return res.status(500).json({err});
    }
}

async function quotePrice(req, res) {
    const price = req.body.price;
    const adId = req.params.adId;
    const message = req.body.message;

    try {
        let ad = await Ads.findOne({ _id: adId, accepted: false, quoted: false });

        if (!ad) {
            return res.status(404).json({
                message: "adId is invalid",
            });
        }
        ad.previousMessage = ad.message;
        ad.message = message;
        ad.quotedPrice = price;
        ad.quoted = true;
        ad.negotiation = true;
        await ad.save();

        return res.status(200).json({
            message: "Price Quoted",
            ad: ad,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

async function deleteAd(req, res) {
    const adId = req.params.adId;

    try {
        const ad = await Ads.findById(adId);

        if (!ad) {
            return res.status(404).json({ message: "Ad not deleted" });
        }
        ad.images.forEach(async (image) => {
            await clearImage(image);
        });
        const info = await Ads.deleteOne({ _id: adId });
        return res.status(200).json({
            message: "Ad deleted",
            info: info,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

async function clearImage(imageUrl) {
    let publicId;
    try {
        publicId = imageUrl.match(/\/([^/]+)\.[^.]+$/)[1];
        console.log(publicId);
        const result = await cloudinary.uploader.destroy(`books/${publicId}`);
        console.log(result);
    }
    catch (err) {
        console.log(`Error deleting image ${publicId}: ${err.message}`);
    }
}


async function addCategory(req, res) {
    const categoryName = req.body.categoryName;

    try {
        let category = new Category({
            name: _.lowerCase(categoryName),
            ads: [],
        });

        await category.save();

        return res.status(200).json({
            message: "Category added successfully",
            category: category,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

async function removeCategory(req, res) {
    const categoryId = req.params.categoryId;

    try {
        let adInfo = await Ads.updateMany(
            { "categories._id": categoryId },
            { $pull: { categories: { _id: categoryId } } }
        );

        let categoryInfo = await Category.deleteOne({ _id: categoryId });

        return res.status(200).json({
            message: "Category deleted successfully",
            adInfo: adInfo,
            categoryInfo: categoryInfo,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

module.exports = {
    // checkAdmin,
    // checkUser
    getAdmins,
    updateAdmin,
    getAds,
    getAd,
    approveAd,
    editAd,
    quotePrice,
    deleteAd,
    addCategory,
    removeCategory,
    clearImage,
};
