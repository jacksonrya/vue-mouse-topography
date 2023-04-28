module.exports = {
  'root': true,
  'env': {
    'node': true,
    'es2022': true,
  },
  'extends': [
    'plugin:vue/recommended',
    'eslint:recommended',
    '@jacksonrya/eslint-config-standard', 
  ],
  'rules': {
    'no-debugger': 1,
    'space-infix-ops': 2,
  },
};
