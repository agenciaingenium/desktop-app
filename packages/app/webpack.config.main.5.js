/**
 * Webpack 5 configuration for the Electron main process.
 *
 * Replaces the electron-webpack mutator in webpack.config.main.js.
 * This is now a fully standalone config — no electron-webpack dependency.
 */

const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const { getBaseConfig, getExternals } = require('./webpack.config.base.5');

// Preload entry points (compiled alongside main process)
const preloadEntrypoints = new Set([
  'preload.js',
  'main-preload.js',
  'cli-preload.js',
  'worker-preload.js',
]);

const sourceMapSupportBannerPattern =
  /require\("source-map-support\/source-map-support\.js"\)\.install\(\)[;,]/;

class StripSourceMapSupportFromPreloadsPlugin {
  apply(compiler) {
    compiler.hooks.emit.tap('StripSourceMapSupportFromPreloadsPlugin', (compilation) => {
      for (const filename of preloadEntrypoints) {
        const asset = compilation.assets[filename];
        if (!asset) continue;

        const source = asset.source().toString();
        if (!sourceMapSupportBannerPattern.test(source)) continue;

        compilation.assets[filename] = {
          source: () => source.replace(sourceMapSupportBannerPattern, ''),
          size: () => source.replace(sourceMapSupportBannerPattern, '').length,
        };
      }
    });
  }
}

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const isDev = !isProd;

  const config = {
    ...getBaseConfig(env, argv),

    name: 'main',
    target: 'electron-main',

    entry: {
      main: path.resolve(__dirname, 'src/main.ts'),
      preload: '@/static/preload/preload.js',
      'main-preload': '@/static/preload/main-preload.js',
      'cli-preload': '@/static/preload/cli-preload.js',
      'worker-preload': '@/static/preload/worker-preload.js',
    },

    output: {
      path: path.resolve(__dirname, 'dist/main'),
      filename: '[name].js',
      chunkFilename: '[name].bundle.js',
      libraryTarget: 'commonjs2',
    },

    externals: getExternals(),

    node: {
      __dirname: false,
      __filename: false,
    },

    plugins: [
      new webpack.DefinePlugin({
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID),
      }),
      new StripSourceMapSupportFromPreloadsPlugin(),
      new CopyWebpackPlugin({
        patterns: [
          { from: 'src/static/preload/dev-preload.js', to: 'dev-preload.js' },
        ],
      }),
    ],
  };

  if (isDev) {
    config.devtool = 'source-map';
    config.plugins.push(
      new webpack.DefinePlugin({
        __station_dev_public_path__: JSON.stringify(path.resolve(config.output.path, '../renderer')),
        __station_dev_main_path__: JSON.stringify(config.output.path),
      })
    );
  }

  return config;
};