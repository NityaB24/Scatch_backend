
const Order = require('../models/order-model');
const productModel = require('../models/product-model');
module.exports.ownerProducts = async (req, res) => {
    try {
        const allProducts = await productModel.find({});
        res.render('products', { products: allProducts, sortby: req.query.sortby || 'popular' });
    } catch (error) {
        console.error('Error fetching all products:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.searchProducts = async (req, res) => {
    const query = req.query.query;
    try {
        const searchedProducts = await productModel.find({ name: { $regex: query, $options: 'i' } });
        res.render('products', { products: searchedProducts, sortby: 'search' });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.fetchProducts = async (req, res) => {
    try {
        const product = await productModel.findById(req.params.id);
        if (!product) {
            return res.status(404).send('Product not found');
        }
        res.render('edit-product', { product: product });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports.deleteProducts = async (req, res) => {
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
}

module.exports.allOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user');
        res.render('all-orders', { orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).send('Internal Server Error');
    }
}