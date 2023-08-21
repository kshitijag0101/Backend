const User = require("../models/users");
const Ads = require("../models/ads");
const Order = require("../models/orders");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { stringify } = require("uuid");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { clearImage } = require("./admins");

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_API_KEY,
    key_secret: process.env.RAZORPAY_API_SECRET,
});

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

async function userLogin(req, res) {
    try {
        if (!req.body.email) {
            return res.status(400).json({ error: "email missing" });
        }
        if (!req.body.password) {
            return res.status(400).json({ error: "password missing" });
        }
        const user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        if (user.verificationToken) {
            return res.status(404).json({ error: "Verfication pending" });
        }

        const result = await bcrypt.compare(req.body.password, user.password);

        if (result) {
            const payload = {
                name: user.name,
                email: user.email,
                userId: user._id,
            };
            const token = jwt.sign(payload, process.env.JWT_SECRET, {
                expiresIn: "1d",
            });
            // res.cookie("token", token, {httpOnly: true, maxAge: 1000*60*60*24});
            return res.status(201).json({ userData: user, token: token });
        } else {
            return res
                .status(401)
                .json({ error: "User credentials not matched" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function userRegister(req, res) {
    try {
        if (!req.body.email) {
            res.status(400).json({ error: "email missing" });
            return;
        }
        const email = req.body.email;
        if (!req.body.password) {
            res.status(400).json({ error: "password missing" });
            return;
        }
        const user = await User.findOne({ email: req.body.email });
        if (user) {
            return res.status(404).json({ error: "User already exists" });
        }
        const password = await bcrypt.hash(
            req.body.password,
            parseInt(process.env.SALT_ROUNDS)
        );
        const { name, contact } = req.body;
        crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                console.log(err);
            }
            const token = buffer.toString("hex");
            const user = new User({
                name: name,
                email: email,
                password: password,
                contact: contact,
                verificationToken: token,
            });
            await user.save();
            await transporter.sendMail({
                to: email,
                from: process.env.EMAIL,
                subject: "Welcome to Our Service!",
                html: `
                        <table align="center" cellpadding="0" cellspacing="0" border="0" style="width: 600px; border-collapse: collapse; border: 1px solid #ccc;">
                            <tr>
                                <td style="padding: 30px; background-color: #ffffff;">
                                    <img src="https://www.iconsdb.com/icons/preview/red/books-xxl.png" alt="Company Logo" style="display: block; margin: auto; width: 200px; height: auto;">
                                    <h1 style="margin-top: 30px; margin-bottom: 20px; text-align: center; font-size: 32px; color: #333333; font-weight: 600;">Welcome to Our Service!</h1>
                                    <p style="margin-top: 20px; margin-bottom: 30px; text-align: center; font-size: 18px; color: #666666;">Thank you for signing up to our service.</p>
                                    <table cellpadding="0" cellspacing="0" border="0" style="width: 100%;">
                                        <tr>
                                            <td align="center" style="padding: 15px; background-color: #26a69a;">
                                                <a href=https://booksellingstore.netlify.app/user/verify/${token}" style="display: inline-block; padding: 15px 30px; background-color: #26a69a; color: #ffffff; text-decoration: none; font-size: 18px; font-weight: 500; border-radius: 5px;">Get Started</a>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding: 15px; background-color: #f0f0f0; font-size: 14px; color: #666666; text-align: center;">
                                    <p style="margin: 0;">You received this email because you signed up for our service. If you did not sign up, please disregard this email.</p>
                                </td>
                            </tr>
                        </table>
                    `,
            });
            return res.status(201).json({ user });
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function verifyuser(req, res) {
    try {
        const token = req.params.token;
        const user = await User.findOne({ verificationToken: token });
        if (!user) {
            return res.status(404).json("Token invalid");
        }
        user.verificationToken = null;
        await user.save();
        return res.status(200).json({ success: true, user: user });
    } catch (err) {
        console.log(err);
    }
}

async function editUser(req, res) {
    try {
        const id = req.user._id;
        let user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { name, password, contact, location, shippingAddress } = req.body;
        if (name) user.name = name;
        if (password)
            user.password = await bcrypt.hash(
                password,
                parseInt(process.env.SALT_ROUNDS)
            );
        if (contact) user.contact = contact;
        if (location) user.location = location;
        if (shippingAddress) user.shippingAddress = shippingAddress;

        await user.save();

        return res.status(200).json({
            message: "User details updated successfully",
            user: user,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function isUser(req, res) {
    res.status(200).json({ message: "Authenticated" });
}

async function getAds(req, res) {
    const userId = req.user._id;

    try {
        const ads = await Ads.find({ userId: userId });

        if (!ads) {
            return res.status(404).json({ message: "No ads to show" });
        }

        let pending = [];
        let approved = [];
        let negotiation = [];
        let sold = [];

        for (let ad of ads) {
            if (ad.sold) sold.push(ad);
            else if (!ad.approved && !ad.negotiation) pending.push(ad);
            else if (ad.approved) approved.push(ad);
            else if (ad.negotiation && ad.quoted) negotiation.push(ad);
        }

        return res.status(200).json({
            message: "Ads fetched",
            ads: {
                pending: pending,
                approved: approved,
                negotiation: negotiation,
                sold: sold,
            },
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function approveAd(req, res) {
    const adId = req.params.adId;
    const ad = await Ads.findById(adId);
    try {
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }
        ad.accepted = true;
        await ad.save();
        res.status(200).json({ message: "Ad accepted by User", ad: ad });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function rejectAd(req, res) {
    const adId = req.params.adId;
    const ad = await Ads.findById(adId);
    try {
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }
        ad.quoted = false;
        await ad.save();
        res.status(200).json({ message: "Ad rejected by User", ad: ad });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function addToCart(req, res) {
    const user = await User.findById(req.user._id);
    const adId = req.body.adId;
    const ad = await Ads.findById(adId);
    try {
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }

        for (var i = 0; i < user.cart.length; i++) {
            var u = user.cart[i];
            if (u.toString() === adId.toString()) {
                return res.status(404).json({ error: "Item already in cart" });
            }
        }
        user.cart.push(ad);
        await user.save();
        res.status(200).json({ message: "Item added to Cart", ad: ad });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function deleteFromCart(req, res) {
    const user = await User.findById(req.user._id);
    const adId = req.body.adId;
    const ad = await Ads.findById(adId);
    try {
        if (!ad) {
            return res.status(404).json({ error: "Ad not found" });
        }
        user.cart.pull(ad);
        await user.save();
        res.status(200).json({ message: "Item removed From Cart", ad: ad });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function getCart(req, res) {
    try {
        const user = await User.findById(req.user._id);
        await user.populate("cart");
        const items = user.cart;
        return res.status(200).json({ message: "Cart fetched", items: items });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function placeOrder(req, res) {
    const adId = req.body.adId;

    try {
        let ad = await Ads.findById(adId);
        if (!ad) {
            return res.status(404).json({ message: "Ad not found" });
        }

        const sellerId = ad.userId;
        const buyerId = req.user._id;

        let buyer = await User.findById(buyerId);
        if (!buyer) {
            return res.status(404).json({ message: "User not found" });
        }

        let order = new Order({
            adId: adId,
            sellerId: sellerId,
            buyerId: buyerId,
        });
        await order.save();

        let idx = buyer.cart.indexOf(adId);
        if (idx !== -1) {
            buyer.cart.splice(idx, 1);
        }
        await buyer.save();

        ad.sold = true;
        await ad.save();

        return res.status(200).json({
            message: "Order placed successfully",
            order: order,
            ad: ad,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function getOrders(req, res) {
    try {
        const orders = await Order.find({ buyerId: req.user._id }).populate({
            path: "adId",
            model: "Ads",
        });
        return res.status(200).json({
            message: "Orders fetched",
            orders: orders,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function getOrder(req, res) {
    const orderId = req.params.orderId;
    try {
        const order = await Order.findById(orderId).populate({
            path: "adId",
            model: "Ads",
        });

        let id1 = req.user._id.toString();
        let id2 = order.buyerId.toString();

        if (id1 === id2) {
            return res.status(200).json({
                message: "Order fetched",
                order: order,
            });
        }
        return res.status(404).json({
            message: "Route not found",
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function checkout(req, res) {
    const amount = Number(req.body.amount * 100);
    const options = {
        amount: amount,
        currency: "INR",
    };
    const order = await instance.orders.create(options);
    console.log(order);
    res.status(200).json({
        success: true,
        order: order,
    });
}

async function paymentVerification(req, res) {
    try {
        const {
            name,
            email,
            contact,
            streetAddress,
            city,
            state,
            pincode,
            books,
        } = req.body;
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            req.body;
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const adId = [],
            sellerId = [];
        const user = await User.findById(req.user._id);
        for (let book of books) {
            adId.push(book.id);
            sellerId.push(book.sellerId);
        }
        var expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_API_SECRET)
            .update(body.toString())
            .digest("hex");
        const isAuthentic = expectedSignature === razorpay_signature;
        if (isAuthentic) {
            const order = new Order({
                adId: adId,
                buyerId: req.user._id,
                sellerId: sellerId,
                razorpay_order_id: razorpay_order_id,
                razorpay_payment_id: razorpay_payment_id,
                razorpay_signature: razorpay_signature,
                name: name,
                email: email,
                contact: contact,
                shippingAddress: {
                    streetAddress: streetAddress,
                    city: city,
                    state: state,
                    pincode: pincode,
                },
            });
            user.shippingAddress.streetAddress = streetAddress;
            user.shippingAddress.city = city;
            user.shippingAddress.state = state;
            user.shippingAddress.pincode = pincode;
            for (let ads of adId) {
                const ad = await Ads.findById(ads);
                ad.sold = true;
                user.cart.pull(ads);
                await ad.save();
            }
            await order.save();
            await user.save();
            // res.redirect(
            //     "http://localhost:3000/paymentsuccess?reference=${razorpay_payment_id}"
            // );
            return res.status(200).json({ success: true });
        } else {
            res.status(200).json({
                success: false,
            });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

async function editAdImages(req, res) {
    const adId = req.params.adId;

    try {
        let ad = await Ads.findById(adId);
        if (!ad) {
            return res.status(404).json({
                message: "Ad not found",
            });
        }

        const imagesPath = [];
        const images = req.files;
        images.forEach((image) => {
            imagesPath.push(image.path.replace("\\", "/"));
        });

        for (let image of ad.images) {
            await clearImage(image);
        }

        ad.images = imagesPath;
        await ad.save();
        return res.status(200).json({
            message: "Images updated successfully",
            ad,
        });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ err });
    }
}

module.exports = {
    userLogin,
    userRegister,
    verifyuser,
    editUser,
    isUser,
    getAds,
    approveAd,
    rejectAd,
    addToCart,
    deleteFromCart,
    getCart,
    placeOrder,
    getOrders,
    getOrder,
    checkout,
    paymentVerification,
    editAdImages,
};
