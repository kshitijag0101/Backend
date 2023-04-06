const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    admin: {
        type: Boolean,
        required: true,
        default: false
    },
    superAdmin: {
        type: Boolean,
        required: true,
        default: false
    },
    location: {
        type: String
    },
    cart: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ads'
        }
    ],
    shippingAddress: {
        streetAddress: String,
        city: String,
        state: String,
        pincode: String
    },
    verificationToken: String,
});

const User = mongoose.model("User", userSchema);

module.exports = User;