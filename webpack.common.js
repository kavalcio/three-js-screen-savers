const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './index.js',
    //   entry: {
    //     app: './src/index.js',
    //   },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Screensavers',
      template: './index.html'
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};