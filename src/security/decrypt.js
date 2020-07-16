const bcrypt = require('bcrypt');

const decrypt = async (password, hash) => {
  const result = await bcrypt.compare(password, hash);
  return result;
};

module.exports = decrypt;
