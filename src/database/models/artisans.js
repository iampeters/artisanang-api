const mongoose = require( 'mongoose' );
const Users = require( './users' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const artisansSchema = new Schema( {
  email: {
    type: String,
    required: true,
    default: null,
    unique: true
  },
  firstname: {
    type: String,
    maxlength: 20,
    default: null,
    required: true,
  },
  lastname: {
    type: String,
    maxlength: 20,
    default: null,
    required: true,
  },
  name: {
    type: String,
    default: null,
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
    default: null,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: null,
    unique: true
  },
  nickname: {
    type: String,
    default: null,
    unique: true
  },
  specialization: {
    type: String,
    default: null,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: true
  },
  businessName: {
    type: String,
    default: null,
    unique: true
  },
  NIN: {
    type: String,
    default: null,
    unique: true
  },
  RCNumber: {
    type: String,
    default: null,
    unique: true
  },
  state: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: null,
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


const Artisans = model( 'Artisans', artisansSchema, 'artisans' );

module.exports = Artisans;