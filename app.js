require("dotenv").config();

const path = require('path');
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const userRoute = require("./routes/user");
const homeRoute = require("./routes/home");
const adminRoute = require("./routes/admin");
const passport = require("passport");
const { jwtStrategy } = require("./middlewares/auth");
const cors = require("cors");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use(cors({
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    origin: ['http://localhost:3000']
}));

// app.use((req, res, next) => {
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
//     res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//     next();
// });

passport.use(jwtStrategy);
app.use(passport.initialize());

// app.use((req, res, next)=>{
//     next();
// });

mongoose.set("strictQuery", true);
const DB_URL = process.env.DB_URL;
mongoose.connect(DB_URL, err =>{
    if (err){
        console.log(err);
    }
    else {
        console.log("Connection established with vesper...");
    }
});

app.use("/", homeRoute);
app.use("/user", userRoute);
app.use("/admin", adminRoute);

app.get("/getkey", (req, res) => {
    res.status(200).json({key: process.env.RAZORPAY_API_KEY});
});

let PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
    console.log("Server started on port " + PORT + "...");
});