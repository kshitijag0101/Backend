const Category = require("../models/categories");
const Ads = require("../models/ads");
const _ = require("lodash");

async function showCategories(req, res){
    // let category = new Category({
    //     name: "Engineering",
    //     books: []
    // });
    // await category.save();
    // category = new Category({
    //     name: "Medical",
    //     books: []
    // });
    // await category.save();

    try {
        const categories = await Category.find({});

        return res.status(200).json({categories});
    }
    catch (err){
        console.log(err);
        return res.status(500).json({err});
    }
}

async function showCategory(req, res){
    try {
        const categoryName = _.lowerCase(req.params.categoryName);

        const category = await Category.findOne({name: categoryName});

        if (!category){
            return res.status(404).json({error: "Category not found"});
        }

        return res.status(200).json({category});
    }
    catch (err){
        console.log(err);
        return res.status(500).json({err});
    }
}

async function filterCategories(req, res){

    const categories = req.body.categories;
    const location = req.body.location;
    const title = req.body.title;
    const query = {};

    if (title || categories){
        query.$or = [];

        if (title){
            query.$or.push({ title: { $regex: title, $options: 'i' } });
        }
        if (categories){
            query.$or.push({ "categories._id": { $in: categories } });
        }
    }

    if (location){
        query.location = { $regex: location, $options: 'i' };
    }

    try {
        const ads = await Ads.find(query);

        return res.status(200).json({
            message: "Ads fetched successfully",
            ads: ads
        });
    }
    catch (err){
        console.log(err);
        return res.status(500).json({err});
    }

}

module.exports = {
    showCategories,
    showCategory,
    filterCategories
};