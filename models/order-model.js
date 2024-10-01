const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' },
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            name: String,
            price: Number,
            discount: Number,
            quantity: Number,
            total: Number
        }
    ],
    totalAmount: Number,
    billingDetails: {
        firstName: String,
        lastName: String,
        email: String,
        phone: String,
        address: String,
        city: String,
        state: String,
        zip: String
    },
    shippingDetails: {
        shippingFirstName: String,
        shippingLastName: String,
        shippingAddress: String,
        shippingCity: String,
        shippingState: String,
        shippingZip: String
    },
    paymentDetails: {
        cardName: String,
        cardNumber: String,
        expiryDate: String,
        cvv: String
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
