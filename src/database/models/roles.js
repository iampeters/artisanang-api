const mongoose = require( 'mongoose' );
const Users = require( './users' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const rolesSchema = new Schema( {

  name: {
    type: String,
    default: null,
    required: true,
  },
  permissions: {
    type: Array,
    required: true,
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    ref: Users,
    default: null
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


const Roles = model( 'Roles', rolesSchema, 'roles' );

module.exports = Roles;