const mongoose = require("mongoose");

const adsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        authors: {
            type: [String],
            required: true
        },
        edition: {
            type: String,
            required: true
        },
        images: {
            type: [String],
            required: true
        },
        categories: [{
            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category'
            },
            name: {
                type: String,
            }
        }],
        damage: {
            type: String,
            required: true
        },
        totalPages: {
            type: String,
            required: true
        },
        markedPages: {
            type: String,
            required: true
        },
        username: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        contact: {
            type: String,
            required: true
        },
        location: {
            type: String,
            required: true
        },
        negotiation: {
            type: Boolean,
            default: false
        },
        approved: {
            type: Boolean,
            default: false
        },
        sold: {
            type: Boolean,
            default: false
        },
        quoted: {
            type: Boolean,
            default: false
        },
        quotedPrice: {
            type: Number
        },
        fixedPrice: {
            type: Number
        },
        accepted: {
            type: Boolean,
            default: false
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        message: {
            type: String
        },
        previousMessage: {
            type: String
        }
    },
    { timestamps: true}
);

const Ads = mongoose.model("Ads", adsSchema);

module.exports = Ads;
