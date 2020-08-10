const mongoose = require( 'mongoose' );
const Users = require( './users' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const artisansSchema = new Schema( {
  email: {
    type: String,
    required: true,
    unique: true
  },
  firstname: {
    type: String,
    maxlength: 20,
    required: true,
  },
  lastname: {
    type: String,
    maxlength: 20,
    required: true,
  },
  name: {
    type: String,
  },
  rating: {
    type: Number,
    default: 0,
  },
  reviews: {
    type: Number,
    default: 0,
  },
  phoneNumber: {
    type: String,
    maxlength: 11,
    minlength: 11,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String,
  },
  address: {
    type: String,
    unique: true
  },
  // nickname: {
  //   type: String,
  // },
  specialization: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: true
  },
  businessName: {
    type: String,
    unique: true
  },
  NIN: {
    type: String,
    unique: true
  },
  RCNumber: {
    type: String,
    unique: true
  },
  state: {
    type: String,
  },
  country: {
    type: String,
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  updateOn: {
    type: Date,
  },
  updatedBy: {
    type: String,
    ref: Users,
  }
} );


const Artisans = model( 'Artisans', artisansSchema, 'artisans' );

module.exports = Artisans;