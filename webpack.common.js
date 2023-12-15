const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    // index: './index.js',
    pipes: './pages/pipes.js',
    mystify: './pages/mystify.js',
    bezier: './pages/bezier.js',
    refraction: './pages/refraction.js',
    dither: './pages/dither.js',
    fractalBranches: './pages/fractal-branches.js',
    dice: './pages/dice.js',
    postprocessing: './pages/postprocessing.js',
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
      {
        test: /\.glsl$/,
        use: 'webpack-glsl-loader',
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
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Dithering',
      template: './template.html',
      chunks: ['dither'],
      filename: './dither.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Fractal Branches',
      template: './template.html',
      chunks: ['fractalBranches'],
      filename: './fractal-branches.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Dice Simulator',
      template: './template.html',
      chunks: ['dice'],
      filename: './dice.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Postprocessing',
      template: './template.html',
      chunks: ['postprocessing'],
      filename: './postprocessing.html',
    }),
  ],
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};
