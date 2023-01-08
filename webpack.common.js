const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    // index: './index.js',
    pipes: './pipes.js',
    mystify: './mystify.js',
    bezier: './bezier.js',
    refraction: './refraction.js',
  },
  module: {
    rules: [
      {
        test: /\.png/,
        type: 'asset/resource',
      },
      {
        test: /\.jpg/,
        type: 'asset/resource',
      },
    ],
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
      template: './template.html',
      chunks: ['pipes'],
      filename: './pipes.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Mystify',
      template: './template.html',
      chunks: ['mystify'],
      filename: './mystify.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Bezier',
      template: './template.html',
      chunks: ['bezier'],
      filename: './bezier.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Refraction',
      template: './template.html',
      chunks: ['refraction'],
      filename: './refraction.html',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};
