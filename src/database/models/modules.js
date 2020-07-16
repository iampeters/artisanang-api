const mongoose = require('mongoose');
const Course = require( './courses' );
const Users = require( './users' );


const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: null,
  },
  imageUrl: {
    type: String,
    required: true
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Course
  },
  authorId: {
     type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: Users
  },
  tags: {
    type: Array
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  lastUpdatedOn: {
    type: Date,
    default: null
  }
});

const Modules = mongoose.model('Modules', moduleSchema, 'modules');

module.exports = Modules;
