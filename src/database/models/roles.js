const mongoose = require( 'mongoose' );
const Users = require( './users' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const rolesSchema = new Schema( {

  name: {
    type: String,
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
  },
  updateOn: {
    type: Date,
  },
  updatedBy: {
    type: String,
  }
} );


const Roles = model( 'Roles', rolesSchema, 'roles' );

module.exports = Roles;