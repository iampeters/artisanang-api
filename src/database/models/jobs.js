const mongoose = require( 'mongoose' );
const Users = require( './users' );
const Category = require( './category' );
const Artisans = require( './artisans' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const jobsSchema = new Schema( {

  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Category,
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
  budget: {
    type: String,
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
  }
} );


const Jobs = model( 'Jobs', jobsSchema, 'jobs' );

module.exports = Jobs;