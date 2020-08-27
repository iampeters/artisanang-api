const mongoose = require( 'mongoose' );
const Artisans = require( './artisans' );

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
    ref: Artisans,
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
    ref: Artisans,
  }
} );


const Portfolios = model( 'Portfolios', portfolioSchema, 'portfolio' );

module.exports = Portfolios;