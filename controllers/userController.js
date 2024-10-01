const userModel = require('../models/user-model');
const productModel = require ('../models/product-model');
const bcrypt = require('bcrypt');
const Order = require('../models/order-model');

module.exports.shopUser = async (req, res) => {
    const sortby = req.query.sortby || 'popular'; 
    const {category} = req.query;
    let query = {}
    if (category) {
        query.category = category;
    }
    let sortOptions;

    switch (sortby) {
        case 'newest':
            sortOptions = { createdAt: -1 }; // Assuming you have a createdAt field
            break;
        case 'low-to-high':
            sortOptions = { price: 1 };
            break;
        case 'high-to-low':
            sortOptions = { price: -1 };
            break;
        case 'popular':
        default:
            sortOptions = { popularity: -1 }; // Assuming you have a popularity field
            break;
    }

    try {
        const categories = await productModel.distinct('category');
        const products = await productModel.find(query).sort(sortOptions);
        res.render('shop', { products, categories, selectedCategory: category, sortby });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.shopbyCategory = async (req, res) => {
    try {
        const categories = await productModel.distinct('category');
        res.render('category', { categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.discountedProducts = async (req, res) => {
    const {category} = req.query;
    let query = {}
    if (category) {
        query.category = category;
    }
    try {
        const categories = await productModel.distinct('category');
        const discountedProducts = await productModel.find({ discount: { $gt: 0 } });
        res.render('shop', { products: discountedProducts,categories,selectedCategory: category, sortby: req.query.sortby || 'popular' });
    } catch (error) {
        console.error('Error fetching discounted products:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.productDetail = async (req, res) => {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('product-detail', { product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.userProfile = (req, res) => {
    try {
        // User data is available in req.user due to authMiddleware
        const user = req.user;
        res.render('profile', { user });
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.editProfile = async (req, res) => {
    try {
        const updates = {
            fullname: req.body.fullname,
            email: req.body.email,
            contact: req.body.contact,
            address: req.body.address
        };

        if (req.file) {
            updates.picture = req.file.buffer;
        }

        if (req.body.password) {
            const salt = await bcrypt.genSalt(10);
            updates.password = await bcrypt.hash(req.body.password, salt);
        }

        const user = await userModel.findByIdAndUpdate(req.user._id, updates, { new: true });
        if (!user) {
            return res.status(404).send('User not found');
        }

        res.redirect('/profile');
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.getCart = async (req, res) => {
    try {
        // Find the user and populate the cart with product details
        const user = await userModel.findById(req.session.userId).populate('cart');
        if (!user) {
            return res.status(404).send('User not found');
        }

        // Calculate total MRP and total discount
        let totalMRP = 0;
        let totalDiscount = 0;
        user.cart.forEach(product => {
            totalMRP += product.price;
            totalDiscount += product.discount;
        });

        res.render('cart', {
            products: user.cart,
            totalMRP: totalMRP.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2)
        });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.addtocartButton = async (req, res) => {
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
}

module.exports.removeCartProduct = async (req, res) => {
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
}

module.exports.checkoutOrder = async (req, res) => {
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

        res.render('checkout', { products, totalMRP, totalDiscount });
    } catch (error) {
        console.error('Error fetching user or products:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.placeOrder = async (req, res) => {
    const userId = req.user ? req.user._id : null;

    if (!userId) {
        return res.redirect('/'); // Redirect to login page if user is not logged in
    }

    try {
        const user = await userModel.findById(userId).populate('cart');
        if (!user) {
            return res.status(404).send('User not found');
        }

        const products = user.cart;
        let totalAmount = 0;

        const orderProducts = products.map(product => {
            const productTotal = (product.price - product.discount) * (product.quantity || 1);
            totalAmount += productTotal;
            return {
                productId: product._id,
                name: product.name,
                price: product.price,
                discount: product.discount,
                quantity: product.quantity || 1,
                total: productTotal
            };
        });

        // Extract billing, shipping, and payment details from the request body
        const {
            firstName, lastName, email, phone, address, city, state, zip,
            shippingFirstName, shippingLastName, shippingAddress, shippingCity, shippingState, shippingZip,
            cardName, cardNumber, expiryDate, cvv
        } = req.body;

        // Create and save the order document
        const newOrder = new Order({
            user: userId, // Save user reference
            products: orderProducts,
            totalAmount,
            billingDetails: { firstName, lastName, email, phone, address, city, state, zip },
            shippingDetails: { shippingFirstName, shippingLastName, shippingAddress, shippingCity, shippingState, shippingZip },
            paymentDetails: { cardName, cardNumber, expiryDate, cvv }
        });

        const savedOrder = await newOrder.save();

        // Store the order ID in the user's orders array
        user.orders.push(savedOrder._id);
        user.cart = []; // Clear the cart
        await user.save();
        // console.log(savedOrder._id);

        // Redirect to order confirmation page with the order ID
        const orderId = savedOrder._id;
        res.redirect(`/order-confirmation/${orderId}`);
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.confirmationPage = async (req, res) => {
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

        res.render('order-confirmation', { order });
    } catch (error) {
        console.error('Error fetching order details:', error);
        res.status(500).send('Internal Server Error');
    }
}