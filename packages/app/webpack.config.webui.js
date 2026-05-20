/**
 * Webpack 5 configuration for webui components.
 * Uses webpack.config.base.5.js as the shared base.
 */
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { getBaseConfig } = require('./webpack.config.base.5');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const isDev = !isProd;

  return {
    ...getBaseConfig(env, argv),

    name: 'webui',
    target: 'web',

    entry: {
      multiInstanceConfiguration: './src/applications/multi-instance-configuration/webui/index.tsx',
    },

    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist', 'renderer'),
      chunkFilename: '[name].bundle.js',
    },

    node: {
      __dirname: 'mock',
      __filename: 'mock',
    },

    resolve: {
      ...getBaseConfig(env, argv).resolve,
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.graphql', '.svg'],
    },

    externals: [
      {
        fs: '{ join: () => {} }',
      },
    ],

    plugins: [
      new HtmlWebpackPlugin({
        chunks: ['multiInstanceConfiguration'],
        filename: 'multi-instance-configuration.html',
        template: './src/app-sub.html',
      }),
    ],

    optimization: {
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'webui-vendor',
            enforce: true,
          },
        },
      },
    },
  };
};