const mongoose = require( 'mongoose' );
const Users = require( './users' );
const Artisans = require( './artisans' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const reviewsSchema = new Schema( {

  title: {
    type: String,
    default: null,
    required: true,
  },
  description: {
    type: String,
    default: null,
    required: true,
  },
  rating: {
    type: Number,
    default: 0,
    required: true,
  },
  artisanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Artisans,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: true
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  updateOn: {
    type: Date,
    default: null
  },
  updatedBy: {
    type: String,
    ref: Users,
    default: null
  }
} );


const Reviews = model( 'Reviews', reviewsSchema, 'reviews' );

module.exports = Reviews;