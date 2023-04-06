const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    adId: [{
        type: String,
        required: true
    }],
    buyerId: {
        type: String,
        required: true
    },
    sellerId: [{
        type: String,
        required: true
    }],
    razorpay_order_id: {
        type: String,
        required: true
    }, 
    razorpay_payment_id: {
        type: String,
        required: true
    },
    razorpay_signature: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    contact: {
        type: Number,
        required: true
    },
    shippingAddress: {
        streetAddress: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        state: {
            type: String,
            required: true
        },
        pincode: {
            type: String,
            required: true
        }
    },
    deliveryDate: {
        type: Date,
        required: true,
        default: () => {
            const currentDate = new Date();
            const deliveryDate = new Date(currentDate.setDate(currentDate.getDate() + 5));
            return deliveryDate;
        }
    }
},
{ timestamps: true}
);

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;