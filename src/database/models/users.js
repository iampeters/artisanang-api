const mongoose = require( 'mongoose' );
const config = require( 'config' );
const jwt = require( 'jsonwebtoken' );
const bcrypt = require( 'bcrypt' );

const Schema = mongoose.Schema;
const model = mongoose.model;

const userSchema = new Schema( {
  email: {
    type: String,
    required: true,
    default: null,
    unique: true
  },
  firstname: {
    type: String,
    maxlength: 20,
    default: null,
    required: true,
  },
  lastname: {
    type: String,
    maxlength: 20,
    default: null,
    required: true,
  },
  phoneNumber: {
    type: String,
    maxlength: 11,
    minlength: 11,
    default: null,
    required: true,
    unique: true
  },
  imageUrl: {
    type: String,
    default: null,
  },
  address: {
    type: String,
    default: null,
    unique: true
  },
  state: {
    type: String,
    default: null,
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
  allowChat: {
    type: Boolean,
    default: true,
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
    default: null
  }
} );

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign( {
      _id: this._id,
      email: this.email,
      firstname: this.firstname,
      lastname: this.lastname,
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
userSchema.methods.encrypt = () => {
  const encrypt = async ( password ) => {
    if ( !password ) throw Error( 'Password is required.' );
    const salt = await bcrypt.genSalt( 10 );
    const hash = await bcrypt.hash( password, salt );
    return hash;
  };

  return encrypt;
};

// decrypt password
userSchema.methods.decrypt = () => {
  const decrypt = async ( password, hash ) => {
    const result = await bcrypt.compare( password, hash );
    return result;
  };

  return decrypt;
};

const Users = model( 'Users', userSchema, 'users' );

module.exports = Users;