const mongoose = require('mongoose');
const Users = require( './users' );

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    default: null,
  },
  author: {
    type: String,
    required: true,
  }, color: {
    type: String,
    required: true,
  }, imageUrl: {
    type: String,
    required: true
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

const Courses = mongoose.model('Courses', courseSchema, 'courses');

module.exports = Courses;
