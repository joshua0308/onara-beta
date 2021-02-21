const path = require('path');
// const CopyPlugin = require('copy-webpack-plugin');
// const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: {
    bundle: './src/index.js',
    playground: './src/playground.js'
  },
  devtool: 'eval-source-map',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }
  // optimization: {
  //   splitChunks: {
  //     cacheGroups: {
  //       commons: {
  //         test: /[\\/]node_modules[\\/]/,
  //         name: 'vendor',
  //         chunks: 'all'
  //       }
  //     }
  //   }
  // },
  // plugins: [
  //   new CopyPlugin({
  //     patterns: [
  //       {
  //         from: path.resolve(__dirname, 'public/**/*'),
  //         to: path.resolve(__dirname, 'dist')
  //       }
  //     ]
  //   })
  // ]
};
