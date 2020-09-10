const mongoose = require( 'mongoose' );
const Users = require( './users' );
const Category = require( './category' );

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
  status: {
    type: String,
    enum: ['NEW', 'ASSIGNED'],
    default: 'NEW'
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Category,
  },
  artisanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: [true, "UserId is required"]
  },
  budget: {
    type: Number,
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


const Jobs = model( 'Jobs', jobsSchema, 'jobs' );

module.exports = Jobs;