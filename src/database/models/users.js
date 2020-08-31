const mongoose = require( 'mongoose' );
const config = require( 'config' );
const jwt = require( 'jsonwebtoken' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const userSchema = new Schema( {
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
  reviews: {
    type: Number,
    default: 0,
  },
  rating: {
    type: Number,
    default: 0,
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
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: Number,
  },
  country: {
    type: String,
    default: 'Nigeria',
  },
  password: {
    type: String,
    required: true,
  },
  userType: {
    type: Number,
    enum: [ 1, 2 ],
    default: 1
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
  createdOn: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: String,
    default: 'client'
  },
  updateOn: {
    type: Date,
  },
  updatedBy: {
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
  experience: {
    type: Number,
  },

} );

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign( {
      _id: this._id,
      type: 'access_token',
      userType: this.userType
    },
    config.get( 'jwtPrivateKey' ), {
      expiresIn: '3d',
    }
  );

  const refresh_token = jwt.sign( {
      _id: this._id,
      type: 'refresh_token',
      userType: this.userType
    },
    config.get( 'refreshTokenPrivateKey' ), {
      expiresIn: '7d',
    }
  );
  return {
    token,
    refresh_token,
  };
};

userSchema.methods.generatePasswordRecoveryToken = function () {
  const token = jwt.sign( {
      _id: this._id,
      type: 'password_recovery',
    },
    config.get( 'jwtPrivateKey' ), {
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

  for ( let i = length; i > 0; --i ) {
    result += chars[ Math.round( Math.random() * ( chars.length - 1 ) ) ];
  }
  return result;
};

userSchema.methods.generateCode = function () {
  const length = 6;
  const chars =
    '0123456789';
  let result = '';

  for ( let i = length; i > 0; --i ) {
    result += chars[ Math.round( Math.random() * ( chars.length - 1 ) ) ];
  }
  return result;
};


const Users = model( 'Users', userSchema, 'users' );

module.exports = Users;