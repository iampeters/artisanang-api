const mongoose = require('mongoose');
const Users = require('./users');
const { stringify } = require('yamljs');

const Schema = mongoose.Schema;
const model = mongoose.model;

const artisansSchema = new Schema({
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
  rating: {
    type: Number,
    default: 0,
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
  },
  reviews: {
    type: Number,
    default: 0,
  },
  phoneNumber: {
    type: String,
    maxlength: 11,
    minlength: 11,
    required: true,
    unique: true,
  },
  imageUrl: {
    type: String,
  },
  address: {
    type: String,
  },
  category: {
    type: String,
  },
  description: {
    type: String,
  },
  guarantor: {
    type: String,
  },
  guarantorPhoneNumber: {
    type: String,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Users,
    required: true,
  },
  businessName: {
    type: String,
    unique: true,
  },
  NIN: {
    type: String,
    unique: true,
  },
  RCNumber: {
    type: String,
    unique: true,
  },
  state: {
    type: String,
  },
  website: {
    type: String,
  },
  experience: {
    type: Number,
  },
  country: {
    type: String,
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
});

artisansSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      type: 'access_token',
      user: 2,
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

artisansSchema.methods.generatePasswordRecoveryToken = function () {
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

artisansSchema.methods.generatePassword = function () {
  const length = 8;
  const chars =
    '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';

  for (let i = length; i > 0; --i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  }
  return result;
};

const Artisans = model('Artisans', artisansSchema, 'artisans');

module.exports = Artisans;
