const mongoose = require( 'mongoose' );
const Users = require( './users' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const permissionsSchema = new Schema( {

  name: {
    type: String,
    default: null,
    required: true,
  },
  canRead: {
    type: Boolean,
    default: false,
    required: true,
  },
  canWrite: {
    type: Boolean,
    default: false,
    required: true,
  },
  canUpdate: {
    type: Boolean,
    default: false,
    required: true,
  },
  canDelete: {
    type: Boolean,
    default: false,
    required: true,
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
    default: null
  },
  createdBy: {
    type: String,
    ref: Users,
    default: null
  }
} );


const Permissions = model( 'Permissions', permissionsSchema, 'permissions' );

module.exports = Permissions;