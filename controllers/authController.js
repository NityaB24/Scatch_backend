const userModel = require('../models/user-model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const {generateToken} = require('../utils/generateToken');
const ownerModel = require('../models/owner-model');

module.exports.registerUser = async (req, res) => {
    try {
        const { email, password, fullname } = req.body;

        let user = await userModel.findOne({ email });
        if (user) return res.status(401).send("You already have an account");

        bcrypt.genSalt(10, function (err, salt) {
            if (err) return res.send(err.message);

            bcrypt.hash(password, salt, async function (err, hash) {
                if (err) return res.send(err.message);

                try {
                    let user = await userModel.create({ email, password: hash, fullname });
                    let token = generateToken(user);
                    res.cookie("token", token);
                    res.send("User created");
                } catch (error) {
                    res.send(error.message);
                }
            });
        });
    } catch (err) {
        res.send(err.message);
    }
};

module.exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    let user = await userModel.findOne({ email });

    if (!user) return res.send("Email or password incorrect");
    bcrypt.compare(password, user.password, function (err, result) {
        if (result) {
            req.session.userId = user._id;
            let token = generateToken(user);
            res.cookie("token", token);
            res.redirect('/profile')
        } else {
            res.send("Email or password incorrect");
        }
    });
};

module.exports.loginOwner = async(req,res)=>{
    const { email, password } = req.body;

    try {
        const owner = await ownerModel.findOne({ email });
        if (!owner) {
            return res.status(400).render('owner-login', { error: 'Invalid email or password' });
        }

        const isMatch = await bcrypt.compare(password, owner.password);
        if (!isMatch) {
            return res.status(400).render('owner-login', { error: 'Invalid email or password' });
        }

        // Assuming you are using sessions
        req.session.ownerId = owner._id;
        res.redirect('/owners/all-orders');
    } catch (error) {
        console.error('Error during owner login:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.authMiddleware = async (req, res, next) => {
    try {
        // Assuming you're storing user ID in session or cookies
        const userId = req.session.userId || req.cookies.userId; 
        if (!userId) {
            return res.status(401).redirect('/');
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(401).redirect('/');
        }

        // Attach user to request object for further use
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports.ownerAuthMiddleware = async (req, res, next) => {
    try {
        // Assuming you're storing owner ID in session or cookies
        const ownerId = req.session.ownerId || req.cookies.ownerId; 
        if (!ownerId) {
            return res.status(401).redirect('/owners/login'); // Redirect to home page if owner is not authenticated
        }

        const owner = await ownerModel.findById(ownerId);
        if (!owner) {
            return res.status(401).redirect('/owners/login'); // Redirect to home page if owner is not found
        }

        // Attach owner to request object for further use
        req.owner = owner;
        next();
    } catch (error) {
        console.error('Owner authentication error:', error);
        res.status(500).send('Internal Server Error');
    }
};