/**
 * Webpack 5 configuration for the Electron renderer process.
 *
 * Exports an array of two configs:
 * 1. Renderer config (target: 'web') — for mainRenderer, subRenderer, aboutRenderer
 * 2. Worker config (target: 'electron-renderer') — for the worker process which needs Node.js
 *
 * This enables nodeIntegration: false in the main renderer windows.
 */

const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const { getBaseConfig, getExternals } = require('./webpack.config.base.5');

// Load .env file at build time (replaces runtime dotenv.ts)
function loadDotenvVars(isProd) {
  const fs = require('fs');
  const envFile = isProd
    ? path.resolve(__dirname, '../../.env.production')
    : path.resolve(__dirname, '../../.env.development');

  const vars = {};
  if (fs.existsSync(envFile)) {
    const content = fs.readFileSync(envFile, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      let value = trimmed.slice(eqIdx + 1).trim();
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      vars[key] = value;
    }
  }
  return vars;
}

// Packages that should be bundled (not external) even though they're in dependencies
const externalsWhitelist = [
  'slack', // forces "browser" target
  'stream-json-rpc',
  'shared-redux',
  'uuid',
  'is-equal-shallow',
  'rxjs',
  'tslib',
  // Pure JS packages that need bundling for target: 'web'
  'immutable',
  'redux',
  'react',
  'react-dom',
  'react-redux',
  'redux-thunk',
  'redux-saga',
  'ramda',
  'ramda-adjunct',
  'reselect',
  'lodash',
  'lodash.throttle',
  'sanitize-filename',
  'classnames',
  'redux-persist',
  'redux-persist-immutable',
  'transit-immutable-js',
  'transit-js',
  'redux-observers',
  'redux-ui',
  'redux-logger',
  'react-immutable-proptypes',
  'graphql',
  'apollo-client',
  'react-apollo',
  'apollo-link',
  'apollo-cache-inmemory',
  'connected-react-router',
  'react-router',
  'react-router-dom',
  'history',
  'immutable-devtools',
  'eventemitter3',
  'readable-stream',
  'stream-browserify',
  'multiplex',
  'pump',
  'end-of-stream',
  'json-rpc-peer',
  '@magne4000/json-rpc-peer',
];

// Packages that MUST remain external even with target: 'web'
// These are Node.js-only and would fail to bundle
const rendererOnlyExternals = [
  'electron',
  'electron-log',
  'electron-updater',
  'electron-debug',
  'auto-launch',
  'node-localstorage',
  'better-sqlite3',
  'fsevents',
  'electron-better-web-request',
  'electron-chrome-extension',
  'electron-window-state',
  // Node.js-only packages that can't run in browser context
  '@getstation/fetch-favicon',
  'x-ray',
  'x-ray-crawler',
  'http-context',
  'http-outgoing',
  'graceful-fs',
  'sqlite3',
  'keytar',
  'sequelize',
  'pg',
  'pg-hstore',
  'del',
  'rimraf',
  'glob',
  'path-scurry',
  '1password-node',
  'react-dnd-html5-backend',
  'googleapis-common',
  'googleapis',
  'google-auth-library',
  'server-destroy',
  'loopback-redirect-server',
];

// Build umzug migration entries
function getUmzugEntries() {
  return glob
    .sync('./src/persistence/umzug-runs/*.js')
    .reduce((obj, filepath) => {
      const filename = path.basename(filepath, path.extname(filepath));
      return { ...obj, [filename]: filepath };
    }, {});
}

// Shared CSS/HTML rules
const sharedRules = [
  {
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader,
      { loader: 'css-loader', options: { modules: 'global' } },
    ],
  },
  {
    test: /\.s([ac])ss$/,
    use: [
      MiniCssExtractPlugin.loader,
      { loader: 'css-loader', options: { modules: 'global' } },
      'sass-loader',
    ],
  },
];

// Shared plugins for both configs
function getSharedPlugins(isProd) {
  return [
    new MiniCssExtractPlugin({
      filename: '[name].styles.css',
      chunkFilename: '[id].styles.css',
    }),
  ];
}

function getEnvDefinePlugin(isProd) {
  const dotenvVars = loadDotenvVars(isProd);
  const envVars = {
    // From .env files
    APP_STORE_MANIFEST_URL: JSON.stringify(dotenvVars.APP_STORE_MANIFEST_URL || process.env.APP_STORE_MANIFEST_URL),
    STATION_NO_CHECK_FOR_UPDATE: JSON.stringify(dotenvVars.STATION_NO_CHECK_FOR_UPDATE || process.env.STATION_NO_CHECK_FOR_UPDATE),
    STATION_REDUX_LOGGER: JSON.stringify(dotenvVars.STATION_REDUX_LOGGER || process.env.STATION_REDUX_LOGGER),
    STATION_NO_WEBVIEWS: JSON.stringify(dotenvVars.STATION_NO_WEBVIEWS || process.env.STATION_NO_WEBVIEWS),
    STATION_MAX_ACTIVE_TABS: JSON.stringify(dotenvVars.STATION_MAX_ACTIVE_TABS || process.env.STATION_MAX_ACTIVE_TABS),
    STATION_BACKEND_SYNC_INTERVAL_DELAY: JSON.stringify(dotenvVars.STATION_BACKEND_SYNC_INTERVAL_DELAY || process.env.STATION_BACKEND_SYNC_INTERVAL_DELAY),
    STATION_QUICK_TRANSITIONS: JSON.stringify(dotenvVars.STATION_QUICK_TRANSITIONS || process.env.STATION_QUICK_TRANSITIONS),
    STATION_REACT_PERF: JSON.stringify(dotenvVars.STATION_REACT_PERF || process.env.STATION_REACT_PERF),
    // Google OAuth
    GOOGLE_CLIENT_ID: JSON.stringify(process.env.GOOGLE_CLIENT_ID),
  };

  const defines = {};
  for (const [key, value] of Object.entries(envVars)) {
    if (value !== 'undefined') {
      defines[`process.env.${key}`] = value;
    }
  }

  return new webpack.DefinePlugin(defines);
}

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';
  const isDev = !isProd;

  // ====== Renderer config (target: web — no Node.js) ======
  const rendererConfig = {
    ...getBaseConfig(env, argv),

    name: 'renderer',
    target: 'web',

    entry: {
      mainRenderer: './src/index.js',
      subRenderer: './src/index-sub.js',
      aboutRenderer: './src/about-window/about.js',
    },

    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: '[name].js',
      chunkFilename: '[name].bundle.js',
    },

    // Node.js polyfills for packages like stream-json-rpc, pump, multiplex
    // that need stream/events/buffer even in browser context.
    resolve: {
      ...getBaseConfig(env, argv).resolve,
      fallback: {
        stream: require.resolve('readable-stream'),
        buffer: require.resolve('buffer/'),
        process: require.resolve('process/browser'),
        events: require.resolve('events/'),
        util: require.resolve('util/'),
        path: require.resolve('path-browserify'),
        assert: require.resolve('assert/'),
        url: require.resolve('url/'),
        'node:url': require.resolve('url/'),
        punycode: require.resolve('punycode/'),
        timers: require.resolve('timers-browserify'),
        constants: require.resolve('constants-browserify'),
        crypto: false,
        os: false,
        net: false,
        fs: false,
        child_process: false,
        dgram: false,
        dns: false,
        http: false,
        https: false,
        tls: false,
        zlib: false,
        // Node.js internal modules that cannot be polyfilled
        _http_common: false,
        _http_outgoing: false,
        _http_incoming: false,
        _http_server: false,
        _stream_duplex: false,
        _stream_passthrough: false,
        _stream_readable: false,
        _stream_transform: false,
        _stream_writable: false,
        async_hooks: false,
        inspector: false,
        v8: false,
        vm: false,
        cluster: false,
        domain: false,
        perf_hooks: false,
        repl: false,
        worker_threads: false,
      },
    },

    externals: [
      // Use function format so scoped packages like @getstation/fetch-favicon
      // get valid require() calls instead of invalid var references
      function({ request }, callback) {
        if (rendererOnlyExternals.includes(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ],

    node: {
      __dirname: 'mock',
      __filename: 'mock',
    },

    module: {
      ...getBaseConfig(env, argv).module,
      rules: [
        ...getBaseConfig(env, argv).module.rules,
        ...sharedRules,
        // JS files loaded as raw strings (replaces raw-loader inline syntax)
        { test: /injected-js\/.*\.js$/, type: 'asset/source' },
        { test: /webview-inject\.js$/, type: 'asset/source' },
        // HTML files loaded as raw strings in source code
        { test: /app\/resources\/.*\.html$/, type: 'asset/source' },
      ],
    },

    plugins: [
      ...getSharedPlugins(isProd),
      getEnvDefinePlugin(isProd),

      // Provide process and Buffer as globals for packages that expect them
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),

      // Main window
      new HtmlWebpackPlugin({
        chunks: ['mainRenderer'],
        filename: 'main.html',
        template: './src/app.html',
        inject: true,
      }),

      // Sub windows
      new HtmlWebpackPlugin({
        chunks: ['subRenderer'],
        filename: 'sub.html',
        template: './src/app-sub.html',
        inject: true,
      }),

      // About window
      new HtmlWebpackPlugin({
        chunks: ['aboutRenderer'],
        filename: 'about.html',
        template: './src/about-window/about.html',
        inject: true,
      }),

      // Copy appstore build output
      new CopyWebpackPlugin({
        patterns: [
          {
            context: path.resolve(__dirname, '../appstore/dist/appstore'),
            from: '**/*',
            to: 'appstore',
          },
        ],
      }),
    ],
  };

  // ====== Worker config (target: electron-renderer — still needs Node.js) ======
  const workerConfig = {
    ...getBaseConfig(env, argv),

    name: 'worker',
    target: 'electron-renderer',

    entry: {
      worker: './src/app-worker.ts',
      ...getUmzugEntries(),
    },

    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: (pathData) => {
        const name = pathData.chunk?.name || '';
        if (name === 'worker') return '[name].js';
        return `umzug-runs/${name}.js`;
      },
      chunkFilename: '[name].bundle.js',
      libraryTarget: 'commonjs2',
    },

    externals: getExternals(externalsWhitelist),

    node: {
      __dirname: 'mock',
      __filename: 'mock',
    },

    module: {
      ...getBaseConfig(env, argv).module,
      rules: [
        ...getBaseConfig(env, argv).module.rules,
        ...sharedRules,
      ],
    },

    plugins: [
      ...getSharedPlugins(isProd),
      new webpack.DefinePlugin({
        'process.env.GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID),
      }),

      // Worker window
      new HtmlWebpackPlugin({
        chunks: ['worker'],
        filename: 'worker.html',
        template: './src/app.html',
        inject: true,
      }),
    ],
  };

  if (isProd) {
    rendererConfig.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }));
    workerConfig.plugins.push(new webpack.IgnorePlugin({ resourceRegExp: /^\.\/locale$/, contextRegExp: /moment$/ }));
  }

  if (isDev) {
    workerConfig.plugins.push(
      new webpack.DefinePlugin({
        __webpack_public_path__: JSON.stringify(workerConfig.output.path),
        __webpack_main_path__: JSON.stringify(path.resolve(workerConfig.output.path, '../main')),
      })
    );

    rendererConfig.devServer = {
      static: [
        path.resolve(__dirname, 'static'),
        path.resolve(__dirname, 'src'),
        '/',
      ],
      host: 'localhost',
      port: 9080,
      hot: true,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': '*',
      },
    };
  }

  return [rendererConfig, workerConfig];
};