const path = require('path');
const zlib = require("zlib");

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const JsonMinimizerPlugin = require("json-minimizer-webpack-plugin");

const TerserPlugin = require("terser-webpack-plugin");
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');

const CompressionPlugin = require("compression-webpack-plugin");

const dirname = path.resolve(__dirname) + path.sep;
const paths = {
  input: path.resolve(dirname, './src/index.js'),
  assets: path.resolve(dirname, './src/assets'),
  static: path.resolve(dirname, './src/static'),
  output: path.resolve(dirname, './public')
};
let debug = process.env.NODE_ENV !== 'production'; //process.env.NODE_ENV === 'development'

module.exports = {
  mode: debug ? 'development' : 'production',
  devtool: debug ? 'eval' : 'source-map',
  target: debug ? 'web' : 'browserslist',
  plugins: [
    debug ? new webpack.HotModuleReplacementPlugin() : () => {},
    new CopyWebpackPlugin({
      patterns: [
        {
          from: paths.assets,
          to: './assets',
        },
        {
          from: paths.static,
          to: './',
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.resolve(dirname, './src/index.html'),
      filename: 'index.html',
      xhtml: true
    }),
    new MiniCssExtractPlugin({
      filename: debug ? "[name].css" : "[name].[contenthash:8].css",
    }),
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      test: /\.(js(?:on)?|css|html|svg)$/,
      minRatio: 0.8,
    }),
    new CompressionPlugin({
      filename: "[path][base].br",
      algorithm: "brotliCompress",
      test: /\.(js(?:on)?|css|html|svg)$/,
      compressionOptions: {
        params: {
          [zlib.constants.BROTLI_PARAM_QUALITY]: 11,
        },
      },
      minRatio: 0.8,
    }),
  ],

  entry: {
    index: paths.input
  },
  output: {
    path: paths.output,
    filename: '[name].[contenthash:8].js',
    clean: true
  },

  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          debug ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
          {
            loader: "postcss-loader",
            options: {
              postcssOptions: {
                plugins: [
                  [
                    "postcss-preset-env",
                    {
                      stage: 4,
                      autoprefixer: { grid: "autoplace" }
                    },
                  ],
                ],
              },
            },
          }
        ],
      },
      {
        test: /\.html$/,
        use: ['raw-loader']
      },
      {
        test: /\.(?:woff2?|eot|ttf|otf|svg)$/i,
        type: 'asset/inline',
      },
      {
        test: /\.(?:ico|gif|png|jpe?g|json)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
    ]
  },
  optimization: {
    minimize: !debug,
    minimizer: [
      new TerserPlugin(),
      new CssMinimizerPlugin({
        parallel: true,
        minimizerOptions: {
          level: {
            1: {
              roundingPrecision: 'all=3,px=5',
            },
          },
        },
        minify: CssMinimizerPlugin.cleanCssMinify,
      }),
      new JsonMinimizerPlugin(),
    ],
  },

  devServer: {
    contentBase: path.resolve(__dirname, './public'),
    compress: debug,
    hot: true,
    port: 8080,
    watchContentBase: true
  },
};
