const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: {
    pipes: './src/pages/pipes.js',
    mystify: './src/pages/mystify.js',
    bezier: './src/pages/bezier.js',
    refraction: './src/pages/refraction.js',
    dither: './src/pages/dither.js',
    fractalBranches: './src/pages/fractal-branches.js',
    dice: './src/pages/dice.js',
    postprocessing: './src/pages/postprocessing.js',
    textureLayers: './src/pages/texture-layers.js',
    galaxy: './src/pages/galaxy.js',
    solarSystem: './src/pages/solar-system.js',
    vertexSnapping: './src/pages/vertex-snapping.js',
    inkblot: './src/pages/inkblot.js',
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
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Texture Layers',
      template: './template.html',
      chunks: ['textureLayers'],
      filename: './texture-layers.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Galaxy Generator',
      template: './template.html',
      chunks: ['galaxy'],
      filename: './galaxy.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Solar System',
      template: './template.html',
      chunks: ['solarSystem'],
      filename: './solar-system.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Vertex Snapping',
      template: './template.html',
      chunks: ['vertexSnapping'],
      filename: './vertex-snapping.html',
    }),
    new HtmlWebpackPlugin({
      hash: true,
      title: 'Inkblot Generator',
      template: './template.html',
      chunks: ['inkblot'],
      filename: './inkblot.html',
    }),
  ],
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
};
