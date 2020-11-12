const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const model = mongoose.model;

const Users = require( './users' );

const notificationSchema = new Schema( {

  userId: {
    type: Schema.Types.ObjectId,
    required: [ true, 'Receiver is required' ],
    ref: Users
  },
  count: {
    type: Number,
    default: 0
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  updatedOn: {
    type: Date,
  },
  isRead: {
    type: Boolean,
    default: false
  }
} );

const Notifications = model( 'Notifications', notificationSchema, 'notifications' )
module.exports = Notifications;