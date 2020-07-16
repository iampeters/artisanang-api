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
    default: null,
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
  },
  username: {
    type: String,
    maxlength: 20,
    default: null,
    required: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 8,
    maxlength: 300,
  },
  loginAttempts: { type: Number, required: true, default: 0 },
  lockUntil: { type: Number },
  isLocked: {
    type: Boolean,
    default: false,
  },
  MFA: {
    type: Boolean,
    default: false,
  },
});

userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    {
      _id: this._id,
      email: this.email,
      name: this.name,
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
  return { token, refresh_token };
};

// encrypt password
userSchema.methods.encrypt = () => {
  const encrypt = async (password) => {
    if (!password) throw Error('Password is required.');
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  };

  return encrypt;
};

// decrypt password
userSchema.methods.decrypt = () => {
  const decrypt = async (password, hash) => {
    const result = await bcrypt.compare(password, hash);
    return result;
  };

  return decrypt;
};

const Users = model('Users', userSchema, 'users');

module.exports = Users;
