const mongoose = require('mongoose');
const Users = require('./users');
const Jobs = require('./jobs');

const Schema = mongoose.Schema;
const model = mongoose.model;

const requestSchema = new Schema({
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Jobs,
    required: true,
  },
  artisanId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: true,
  },
  rejectionReason: {
    type: String,
  },
  status: {
    type: String,
    enum: ['NEW', 'ACCEPTED', 'DECLINED', 'CANCELED', 'TIMEOUT'],
    default: 'NEW'
  },
  duration: {
    type: Date
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
  updateOn: {
    type: Date,
  },
  updatedBy: {
    type: String,
    ref: Users,
  },
  createdBy: {
    type: String,
    ref: Users,
  },
});

const Requests = model('Requests', requestSchema, 'request');

module.exports = Requests;
