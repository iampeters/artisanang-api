const mongoose = require( 'mongoose' );
const Users = require( './users' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const reviewsSchema = new Schema( {

  title: {
    type: String,
    required: [true, 'Title is required'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
  },
  rating: {
    type: Number,
    default: 0,
    required: [true, 'Rating is required'],
  },
  artisanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: [true, 'ArtisanId is required']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: [true, 'UserId is required']
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