module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/essential',
    '@vue/standard'
  ],
  rules: {
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }]
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
