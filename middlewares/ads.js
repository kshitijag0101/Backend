const Ads = require("../models/ads");
const User = require("../models/users");
const _ = require("lodash");

async function createAd(req, res, next) {
    const { title, price, edition, damage, totalPages, markedPages } = req.body;
    const { authors, username, email, contact, location } = req.body;
    const imagesPath = [];
    const images = req.files;
    images.forEach(image => {
        imagesPath.push(image.path.replace("\\" ,"/"));
    });
    for (let i=0; i<authors.length; i++){
        authors[i] = _.lowerCase(authors[i]);
    }
    const ad = new Ads({
        title: title,
        price: price,
        edition: edition,
        damage: damage,
        totalPages: totalPages,
        markedPages: markedPages,
        images: imagesPath,
        authors: authors,
        username: username,
        email: email,
        location: location,
        contact: contact,
        userId: req.user._id
    });
    try{
        await ad.save();
        return res.status(201).json({
            message: 'Ad created',
            ad: ad
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({err});
    }
}

async function getAllAds(req, res, next) {
    try{
        const approvedAds = await Ads.find({approved: true,sold: false});
        res.status(200).json({
            message:'Ads fetched.', 
            approvedAds: approvedAds
        });
    }
    catch(err){
        console.log(err);
        return res.status(500).json({err});
    }
}

async function getAd(req, res, next) {
    const adId = req.params.adId;
    const ad = await Ads.findById(adId);
    try{
        if(!ad){
            return res.status(404).json({error: "Ad not found"});
        }
        res.status(200).json({message:'Ad fetched.', ad: ad});
    }
    catch(err) {
        console.log(err);
        return res.status(500).json({err});
    }
}

module.exports = {
    createAd,
    getAllAds,
    getAd
};