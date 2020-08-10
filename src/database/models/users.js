const mongoose = require('mongoose');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;
const model = mongoose.model;

const userSchema = new Schema({
  email: {
    type: String,
    required: true,
    unique: true,
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
  name: {
    type: String,
  },
  phoneNumber: {
    type: String,
    maxlength: 11,
    minlength: 11,
    unique: true,
  },
  imageUrl: {
    type: String,
  },
  address: {
    type: String,
  },
  state: {
    type: String,
  },
  country: {
    type: String,
    default: 'Nigeria',
  },
  password: {
    type: String,
    required: true,
  },
  loginAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  lockUntil: {
    type: Number,
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
  allowChat: {
    type: Boolean,
    default: true,
  },
  loginTime: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: null,
  },
  createdOn: {
    type: Date,
    default: Date.now,
  },
  updateOn: {
    type: Date,
    default: null,
  },
  updatedBy: {
    type: String,
    default: null,
  },
  isAdmin: {
    type: Boolean,
    default: false,
  },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      type: 'access_token',
    },
    config.get('jwtPrivateKey'),
    {
      expiresIn: '3d',
    }
  );

  const refresh_token = jwt.sign(
    {
      _id: this._id,
      type: 'refresh_token',
    },
    config.get('refreshTokenPrivateKey'),
    {
      expiresIn: '7d',
    }
  );
  return {
    token,
    refresh_token,
  };
};

userSchema.methods.generatePasswordRecoveryToken = function () {
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

userSchema.methods.generatePassword = function () {
  const length = 8;
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  for (let i = length; i > 0; --i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  }
  return result;
};

const Users = model('Users', userSchema, 'users');

module.exports = Users;
