const mongoose = require( 'mongoose' );
const Admins = require( './admins' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const categorySchema = new Schema( {

  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    ref: Admins,
  },
  updateOn: {
    type: Date,
  },
  updatedBy: {
    type: String,
    ref: Admins,
  }
} );


const Categories = model( 'Categories', categorySchema, 'categories' );
module.exports = Categories;