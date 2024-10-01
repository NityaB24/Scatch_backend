const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model');
const upload = require('../config/multer-config');
const bcrypt = require('bcrypt');
const {loginOwner,ownerAuthMiddleware} = require('../controllers/authController');
const {ownerProducts,searchProducts,editProducts,deleteProducts,allOrders, fetchProducts} = require('../controllers/ownerController');
require("dotenv").config();
// const authMiddleware = require('../middlewares/authMiddlewware');
if(process.env.NODE_ENV === "development"){
    router.post('/create', async (req, res) => {
        try {
            let owners = await ownerModel.find();
            if (owners.length > 0) {
                return res.status(403).send("You don't have permission to create a new owner");
            }
    
            let { fullname, email, password } = req.body;
    
            // Hash the password before saving
            const hashedPassword = await bcrypt.hash(password, 10);
    
            let createowner = await ownerModel.create({ fullname, email, password: hashedPassword });
            res.status(201).send(createowner);
        } catch (error) {
            console.error('Error creating owner:', error);
            res.status(500).send('Internal Server Error');
        }
    });

}
router.get('/login', (req, res) => {
    res.render('owner-login',{ error: null });
});

router.post('/login',loginOwner ); // redirect /owners/all-orders

router.get('/logout',(req,res)=>{
    res.cookie("token","");
    res.send("owner logged out")
})

router.get('/create-product',ownerAuthMiddleware,(req,res)=>{
    let success = req.flash("success");
    res.render("createproducts",{success});
})

router.get('/all-products',ownerAuthMiddleware, ownerProducts); // products page

router.get('/search', searchProducts); // products page

router.get('/edit-product/:id',ownerAuthMiddleware, fetchProducts); // edit-product page

// after editing redirect /owners/all-products
// router.post('/edit-product/:id', upload.single('image'), editProducts); 

// after deleting redirect /owners/all-products
router.post('/delete-product/:id',ownerAuthMiddleware, deleteProducts); 

router.get('/all-orders',ownerAuthMiddleware, allOrders); // all-orders page



module.exports = router;