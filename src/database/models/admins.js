const mongoose = require( 'mongoose' );
const config = require( 'config' );
const jwt = require( 'jsonwebtoken' );
const bcrypt = require( 'bcrypt' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const adminSchema = new Schema( {
  email: {
    type: String,
    required: true,

    unique: true
  },
  firstname: {
    type: String,
    maxlength: 20,

    required: true,
  },
  lastname: {
    type: String,
    maxlength: 20,

    required: true,
  },
  permissions: {
    type: Array,
    default: []
  },
  phoneNumber: {
    type: String,
    maxlength: 11,
    minlength: 11,

    required: true,
    unique: true
  },
  imageUrl: {
    type: String,

  },
  password: {
    type: String,
    required: true,
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0
  },
  lockUntil: {
    type: Number
  },
  isLocked: {
    type: Boolean,
    default: false,
  },
  MFA: {
    type: Boolean,
    default: false,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdOn: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: null
  },
  loginTime: {
    type: Date,
    default: Date.now
  },
  updateOn: {
    type: Date,
    default: null
  },
  updatedBy: {
    type: String,
    default: null
  },
  isAdmin: {
    type: Boolean,
    default: true
  }
} );

adminSchema.methods.generateAuthToken = function () {
  const token = jwt.sign( {
      _id: this._id,
      email: this.email,
      firstname: this.firstname,
      lastname: this.lastname,
      isAdmin: this.isAdmin,
      type: 'access_token',
    },
    config.get( 'jwtPrivateKey' ), {
      expiresIn: '3d',
    }
  );

  const refresh_token = jwt.sign( {
      _id: this._id,
      type: 'refresh_token',
    },
    config.get( 'refreshTokenPrivateKey' ), {
      expiresIn: '7d',
    }
  );
  return {
    token,
    refresh_token
  };
};

// encrypt password
adminSchema.methods.generatePasswordRecoveryToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      type: 'password_recovery',
    },
    config.get('jwtPrivateKey'),
    {
      expiresIn: '5m',
    }
  );
  return token;
};

const Admins = model( 'Admins', adminSchema, 'admins' );

module.exports = Admins;