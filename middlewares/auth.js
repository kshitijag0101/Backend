const User = require("../models/users");
const JwtStrategy = require("passport-jwt").Strategy;
const passport = require("passport");
const ExtractJwt = require("passport-jwt").ExtractJwt;

// const cookieExtractor = function(req) {
//     let token = null;
//     if (req && req.headers.cookie){
//         const cookie = req.headers.cookie;
//         token = cookie.split("=")[1];
//     }
//     return token;
// };

const strategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
};

const jwtStrategy = new JwtStrategy(strategyOptions, (payload, done)=>{
    User.findOne({_id: payload.userId}, function(err, user) {
        if (err) {
            return done(err, false);
        }
        if (user) {
            return done(null, user);
        } else {
            return done(null, false);
            // or you could create a new account
            
        }
    });
});

const authenticate = (userRequired = true, adminRequired = false)=>(req, res, next)=>{

    const customAuthenticationHandler = passport.authenticate("jwt", {session: false}, (err, user)=>{
        if (err || !user){
            return res.status(401).json({error: "user not authenticated"});
        }
        else {
            if (!adminRequired || user.admin){
                req.user = {
                    _id: user._id
                };
                return next();
            }
            else {
                return res.status(401).json({error: "user not authorized"});
            }
        }
    });

    if (userRequired){
        return customAuthenticationHandler(req, res, next);
    }
    else {
        return next();
    }
};

const superAuthenticate = async (req, res, next)=>{

    try {
        const user = await User.findById(req.user._id);

        if (!user){
            return res.status(401).json({error: "user not authenticated"});
        }

        if (user.superAdmin){
            return next();
        }
        else {
            return res.status(401).json({error: "user not authorized"});
        }
    }
    catch (err){
        console.log(err);
        return res.status(500).json({err});
    }
}

module.exports = {
    jwtStrategy,
    authenticate,
    superAuthenticate
};

