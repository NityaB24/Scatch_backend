const express = require('express');
const router = express.Router();
const {authMiddleware, registerUser,loginUser,ownerAuthMiddleware} = require('../controllers/authController');
const upload = require('../config/multer-config');
const productModel = require('../models/product-model');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user-model');
const userModel = require('../models/user-model');
const Order = require('../models/order-model');
const { shopUser, shopbyCategory, discountedProducts, productDetail, userProfile, editProfile, getCart, addtocartButton, removeCartProduct, checkoutOrder, placeOrder, confirmationPage } = require('../controllers/userController');
const bodyParser = require('body-parser');
const stripe = require('stripe')('YOUR_SECRET_KEY');
const ownerModel = require('../models/owner-model');

require("dotenv").config();

router.use(bodyParser.json());

router.get('/',(req,res)=>{
    let error = req.flash("error");
    res.render("index",{error});
});

router.get('/shop',authMiddleware,shopUser);

router.get('/shop/category',authMiddleware, shopbyCategory); // category Page

router.get('/discount',authMiddleware, discountedProducts); // shop Page

router.get('/product/:id',authMiddleware, productDetail); // product-detail Page

router.get('/profile', authMiddleware, userProfile); // profile Page

// After Editing Profile Details redirect /profile
router.post('/profile/edit', authMiddleware, upload.single('picture'), editProfile); 

router.get('/cart', authMiddleware, getCart); // cart Page

router.post('/add-to-cart/:productId', addtocartButton); // it adds to cart array

router.delete('/remove-from-cart/:productId', authMiddleware, removeCartProduct); // removes product from cart

router.get('/checkout',authMiddleware, checkoutOrder); // checkout Page

router.post('/place-order', authMiddleware, placeOrder); //redirect to /order-confirmation/${orderId}

router.get('/order-confirmation/:orderId', authMiddleware, confirmationPage); // order confirmation page





module.exports = router;
