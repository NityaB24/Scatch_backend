const express = require('express');
const router = express.Router();
const productModel = require('../models/product-model');
const {registerUser,loginUser,authenticateUser} = require('../controllers/authController');

router.get('/',(req,res)=>{
    res.send("hey it is working");
})

router.post('/register',registerUser );

router.post('/login',loginUser);







module.exports = router;