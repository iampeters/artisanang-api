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
  isActive: {
    type: Boolean,
    default: true
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


const Category = model( 'Category', categorySchema, 'category' );
module.exports = Category;