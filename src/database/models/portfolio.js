const mongoose = require( 'mongoose' );
const Users = require( './users' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const portfolioSchema = new Schema( {

  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  artisanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: true
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  imageUrl: {
    type: Array,
    default: []
  },
  // duration: {
  //   type: String,
  //   required: true
  // },
  updateOn: {
    type: Date,
  },
  updatedBy: {
    type: String,
    ref: Users,
  }
} );


const Portfolios = model( 'Portfolios', portfolioSchema, 'portfolio' );

module.exports = Portfolios;