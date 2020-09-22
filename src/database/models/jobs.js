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
    enum: [ 'NEW', 'ASSIGNED', 'PENDING', 'COMPLETED' ],
    default: 'NEW'
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: Category,
  },
  artisanId: {
    type: Schema.Types.ObjectId,
    ref: Users,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: Users,
    required: [true, "UserId is required"]
  },
  budget: {
    type: Number,
  },
  phoneNumber: {
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


const Jobs = model( 'Jobs', jobsSchema, 'jobs' );

module.exports = Jobs;