const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const model = mongoose.model;

const Users = require('./users');

const chatSchema = new Schema({ 
  sender:{
    type: Schema.Types.ObjectId,
    required: [true, 'Sender is required'],
    ref: Users
  },
  receiver:{
    type: Schema.Types.ObjectId,
    required: [true, 'Receiver is required'],
    ref: Users
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});


const Chats = model('Chats', chatSchema, 'chats');
module.exports = Chats;