const mongoose = require ('mongoose');

  const productSchema = mongoose.Schema({
      image:Buffer,
      name: String,
      price: Number,
      discount:{type: Number, default: 0},
      category:String,
      description:String,
      bgcolor: String,
      panelcolor: String,
      textcolor:String,
      quantity: { type: Number, default: 1 }
  })

  module.exports = mongoose.model('product', productSchema);