const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  watch: true // https://webpack.js.org/guides/development/#choosing-a-development-tool
});
