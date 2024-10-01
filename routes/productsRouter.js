const express = require('express');
const router = express.Router();
const upload = require('../config/multer-config');
const productModel = require('../models/product-model');

router.post('/create',upload.single("image"),async (req,res)=>{
    try{
        let {image,name,price,discount,category,description,bgcolor,panelcolor,textcolor} = req.body;

        let product = await productModel.create({
            image:req.file.buffer,name,price,discount,category,description,bgcolor,panelcolor,textcolor,
        });
        req.flash("success","Product Created Successfully");
        res.redirect("/owners/create-product");

    }
    catch(err){
        res.send(err.message);
    }
   
});

router.post('/edit-product/:id', upload.single('image'), async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            price: req.body.price,
            discount: req.body.discount,
            category: req.body.category,
            description: req.body.description,
            bgcolor: req.body.bgcolor,
            panelcolor: req.body.panelcolor,
            textcolor: req.body.textcolor,
        };

        if (req.file) {
            updates.image = req.file.buffer;
        }

        const product = await productModel.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!product) {
            return res.status(404).send('Product not found');
        }

        res.redirect('/owners/all-products');
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).send('Internal Server Error');
    }
});
module.exports = router;