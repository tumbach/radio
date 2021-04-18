const path = require('path');
const zlib = require("zlib");

const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

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
          to: 'assets',
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
    new webpack.ContextExclusionPlugin(/assets/),
    new MiniCssExtractPlugin({
      filename: debug ? "[name].css" : "[name].[contenthash:8].css",
    }),
    new CleanWebpackPlugin(),
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      test: /\.(js|css|html|svg)$/,
      minRatio: 0.8,
    }),
    new CompressionPlugin({
      filename: "[path][base].br",
      algorithm: "brotliCompress",
      test: /\.(js|css|html|svg)$/,
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
    //publicPath: '',
    filename: '[name].[contenthash:8].js'
  },

  module: {
    rules: [
      /*{
        test: /\.m?js$/,
        exclude: /node_modules/,
        use: [
          {
            "loader": "babel-loader",
            "options": {
              "exclude": [
                /node_modules[\\\/]core-js/,
                /node_modules[\\\/]webpack[\\\/]buildin/,
              ],
              "presets": [
                [
                  "@babel/preset-env",
                  {
                    "useBuiltIns": "usage", // alternative mode: "entry"
                    "corejs": 3,
                    "targets": "supports es6-class, supports websockets, last 2 years"
                  }
                ]
              ]
            }
          }
        ],
      },*/
      {
        test: /\.s?css$/,
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
                      // Options
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
        test: /\.(?:ico|gif|png|jpe?g)$/i,
        type: 'asset/resource',
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
    ],
    splitChunks: {
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/](core-js|regenerator-runtime)[\\/]/,
          name: 'vendor',
          chunks: 'initial',
        },
      },
    },
  },

  devServer: {
    contentBase: path.resolve(__dirname, './public'),
    compress: debug,
    hot: true,
    port: 8080,
    watchContentBase: true,
    //progress: true
  },
  resolve: {
    extensions: ['.js', '.json']
  },
};
