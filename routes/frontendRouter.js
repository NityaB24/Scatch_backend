const express = require('express');
const router = express.Router();
const {authMiddleware, registerUser,loginUser,ownerAuthMiddleware} = require('../controllers/authController');
const upload = require('../config/multer-config');
const productModel = require('../models/product-model');
const bcrypt = require('bcrypt');
const User = require('../models/user-model');
const userModel = require('../models/user-model');
const Order = require('../models/order-model');
const { placeOrder } = require('../controllers/userController');
const ownerModel = require('../models/owner-model');

router.get('/error', (req, res) => {
    let error = req.flash("error");
    res.json({ error });
  });

//shop
router.get('/shop', authMiddleware, async (req, res) => {
    const { sortby, category } = req.query;

    let query = {};
    let sortOptions = {};

    if (category) {
        query.category = category;
    }

    switch (sortby) {
        case 'newest':
            sortOptions.createdAt = -1;
            break;
        case 'low-to-high':
            sortOptions.price = 1;
            break;
        case 'high-to-low':
            sortOptions.price = -1;
            break;
        case 'popular':
        default:
            sortOptions.popularity = -1;
            break;
    }

    try {
        const categories = await productModel.distinct('category');
        const products = await productModel.find(query).sort(sortOptions).exec();
        const formattedProducts = products.map(product => ({
            ...product._doc,
            image: product.image ? product.image.toString('base64') : null,
        }));
        res.json({ products: formattedProducts, categories, selectedCategory: category, sortby });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
});

// shop category
router.get('/shop/categories',authMiddleware, async (req, res) => {
    try {
        const categories = await productModel.distinct('category');
        res.send(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/product/:id', async (req, res) => {
    try {
        // Find the product by ID
        const product = await productModel.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        // Format the product with base64 image
        const formattedProduct = {
            ...product._doc,
            image: product.image ? product.image.toString('base64') : null,
        };

        res.json({ product: formattedProduct });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }
});

// profile page
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        // Fetch the authenticated user's details
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Format the user profile with base64 image
        const formattedUser = {
            ...user._doc,
            picture: user.picture ? user.picture.toString('base64') : null,
        };

        res.json(formattedUser);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Internal Server Error');
    }
});

// profile edit
router.put('/profile', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id; // Assuming req.user contains authenticated user details
        const { fullname, email, contact, address, password } = req.body;

        // Find the user by userId
        let user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Update user fields if provided
        if (fullname) user.fullname = fullname;
        if (email) user.email = email;
        if (contact) user.contact = contact;
        if (address) user.address = address;
        if (password) {
            // Handle password update securely (e.g., hashing)
            user.password = password; // Example: Not recommended, handle password securely
        }

        // Save updated user data
        await user.save();

        res.json({ message: 'Profile updated successfully', user });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});

// add to cart 
router.post('/add-to-cart/:productId',async (req, res) => {
    const productId = req.params.productId;
    const userId = req.session.userId; // Assuming you're using session-based authentication

    try {
        // Find the user by ID and update the cart to add the specified product
        const user = await userModel.findById(userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Add the product to the cart array if it's not already there
        if (!user.cart.includes(productId)) {
            user.cart.push(productId);
            await user.save();
        }

        // Set flash message
        req.flash('success', 'Product added to cart successfully');
        res.status(200).send('Product added to cart');
    } catch (error) {
        console.error('Error adding product to cart:', error); // Log detailed error message
        res.status(500).send('Internal Server Error'); // Return a generic error message to the client
    }
})

// cart Page
router.get('/cart', authMiddleware, async (req, res) => {
    try {
        // Find the user and populate the cart with product details
        const user = await userModel.findById(req.session.userId).populate('cart');
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Calculate total MRP and total discount
        let totalMRP = 0;
        let totalDiscount = 0;

        // Format the cart products with base64 images
        const formattedCart = user.cart.map(product => {
            totalMRP += product.price;
            totalDiscount += product.discount;
            return {
                ...product._doc,
                image: product.image ? product.image.toString('base64') : null,
            };
        });

        res.json({
            products: formattedCart,
            totalMRP: totalMRP.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2)
        });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).send('Internal Server Error');
    }
});

// delete product from cart
router.delete('/remove-from-cart/:productId',authMiddleware,async (req, res) => {
    const productId = req.params.productId;

    try {
        // Find the user by ID and update the cart to remove the specified product
        const user = await userModel.findById(req.session.userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Remove the product from the cart array
        user.cart = user.cart.filter(item => item.toString() !== productId);
        await user.save();

        res.status(200).send('Product removed from cart');
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).send('Internal Server Error');
    }
})

// Example backend route to update cart quantity
router.put('/update-cart/:productId', authMiddleware, async (req, res) => {
    const { productId } = req.params;
    const { quantity } = req.body;

    try {
        const user = await userModel.findById(req.session.userId);

        if (!user) {
            return res.status(404).send('User not found');
        }

        // Find the product in the user's cart and update its quantity
        const cartItem = user.cart.find(item => item.product.toString() === productId);
        
        if (!cartItem) {
            return res.status(404).send('Product not found in cart');
        }

        cartItem.quantity = quantity;
        await user.save();

        // Respond with updated cart data
        res.status(200).json(user.cart);
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).send('Internal Server Error');
    }
});


// checkout page
router.get('/checkout',authMiddleware,async (req, res) => {
    const userId = req.user ? req.user._id : null;

    if (!userId) {
        return res.redirect('/'); // Redirect to login page if user is not logged in
    }

    try {
        const user = await userModel.findById(userId).populate({
            path: 'cart',
            model: 'product',
            select: 'name price discount image' // Ensure the necessary fields are selected
        });

        if (!user) {
            return res.status(404).send('User not found');
        }

        const products = user.cart;
        let totalMRP = 0;
        let totalDiscount = 0;

        products.forEach(product => {
            totalMRP += product.price * (product.quantity || 1);
            totalDiscount += product.discount * (product.quantity || 1);
        });

        // console.log(products); 

        res.json({ products, totalMRP, totalDiscount });
    } catch (error) {
        console.error('Error fetching user or products:', error);
        res.status(500).send('Internal Server Error');
    }
})

router.post('/place-order', authMiddleware, placeOrder);

router.get('/order-confirmation/:orderId',authMiddleware,async (req, res) => {
    const userId = req.user ? req.user._id : null;
    const orderId = req.params.orderId;

    if (!userId) {
        return res.redirect('/'); 
    }

    try {
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).send('User not found');
        }

        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.json({ order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Internal Server Error');
    }
})



//users routes
router.post('/users/register', registerUser);

router.post('/users/login',loginUser);




//owners routes
router.get('/owners/login', (req, res) => {
    res.json({ error: null });
});

router.post('/owners/login',async(req,res)=>{
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
})

router.get('/owners/create-product',ownerAuthMiddleware,(req,res)=>{
    let success = req.flash("success");
    res.render({success});
})

router.get('/owners/all-products',ownerAuthMiddleware, async (req, res) => {
    try {
        const allProducts = await productModel.find({});
        const formattedProducts = allProducts.map(product => ({
            ...product._doc,
            image: product.image ? product.image.toString('base64') : null,
        }));
        res.json({ products: formattedProducts, sortby: req.query.sortby || 'popular' });
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).json({ error: 'Internal Server Error', message: error.message });
    }
});

router.get('/owners/edit-product/:id',ownerAuthMiddleware, async (req, res) => {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.json({ product: product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }
});
// products page

router.post('/owners/delete-product/:id',ownerAuthMiddleware, async (req, res) => {
    try {
        const product = await productModel.findByIdAndDelete(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.redirect('/owners/all-products');
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).send('Internal Server Error');
    }
}); 

router.get('/owners/all-orders',ownerAuthMiddleware, async (req, res) => {
    try {
        const orders = await Order.find().populate('user');
        res.json({ orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/owners/search',ownerAuthMiddleware,async (req, res) => {
    const query = req.query.query;
    try {
        const searchedProducts = await productModel.find({ name: { $regex: query, $options: 'i' } });
        const formattedProducts = searchedProducts.map(product => ({
            ...product._doc,
            image: product.image ? product.image.toString('base64') : null,
        }));
        res.json({ products: formattedProducts, sortby: 'search' });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).send('Internal Server Error');
    }
})





//products routes

router.post('/products/create',upload.single("image"),async (req,res)=>{
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

router.post('/products/edit-product/:id', upload.single('image'), async (req, res) => {
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