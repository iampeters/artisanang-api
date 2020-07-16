const bcrypt = require('bcrypt');

const encrypt = async (password) => {
  if (!password) throw Error('Password is required.');
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

module.exports = encrypt;
