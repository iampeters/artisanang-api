const mongoose = require( 'mongoose' );
const Users = require( './users' );
const Artisans = require( './artisans' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const jobsSchema = new Schema( {

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
  duration: {
    type: String,
    default: null,
    required: true
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


const Jobs = model( 'Jobs', jobsSchema, 'jobs' );

module.exports = Jobs;