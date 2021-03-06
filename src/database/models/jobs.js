const mongoose = require( 'mongoose' );
const Users = require( './users' );
const Category = require( './category' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const jobsSchema = new Schema( {

  title: {
    type: String,
    required:  [true, "Title is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  address: {
    type: String,
    required: [true, "Address is required"],
  },
  state: {
    type: String,
    required: [true, "Address is required"],
  },
  country: {
    type: String,
    default: 'Nigeria',
  },
  lga: {
    type: String,
    default: 'Nigeria',
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
  duration: {
    type: Date
  },
  requestId: {
    type: String,
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