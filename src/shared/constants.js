const paramMissingError = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'One or more of the required parameters was missing.',
};

const failedRequest = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'Request failed.',
};

const passwordMatch = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'Password doest not match.',
};

const singleResponse = {
  hasErrors: false,
  hasResults: true,
  successful: true,
  result: {},
};

const paginatedResponse = {
  hasErrors: false,
  hasResults: true,
  successful: true,
  items: [],
  total: 0
};

const duplicateEntry = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'Record already exist.',
};

const noResult = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'Record does not exist.',
};

const emailResponse = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'Email sent successfully.',
};

const invalidCredentials = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'Invalid credentials.',
};

const accountLocked = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'Maximum login attempts exceeded. Account temporarily locked.',
};

const accountBlocked = {
  hasErrors: true,
  hasResults: false,
  successful: false,
  message: 'Account temporarily suspended.',
};

const userToken = {
  token: '',
  refresh_token: '',
  user: {},
  permissions: []
};

module.exports = {
  userToken,
  invalidCredentials,
  duplicateEntry,
  noResult,
  paginatedResponse,
  paramMissingError,
  failedRequest,
  passwordMatch,
  singleResponse,
  accountLocked,
  emailResponse,
  accountBlocked
};
