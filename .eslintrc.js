module.exports = {
  'root': true,
  'env': { 'node': true },
  'extends': [
    'plugin:vue/recommended',
    'eslint:recommended',
    '@jacksonrya/eslint-config-standard', 
  ],
  'parserOptions': {'parser': 'babel-eslint'},
  'rules': {
    'no-debugger': 1,
    "space-infix-ops": 2,
  },
};
