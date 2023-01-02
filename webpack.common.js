const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    index: './index.js',
    pipes: './pipes.js',
    mystify: './mystify.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Screensavers',
      template: './index.html',
      chunks: ['index'],
      filename: './index.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Pipes',
      template: './index.html',
      chunks: ['pipes'],
      filename: './pipes.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Mystify',
      template: './index.html',
      chunks: ['mystify'],
      filename: './mystify.html',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};
