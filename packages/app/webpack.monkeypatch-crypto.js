const crypto = require('crypto');

/**
 * Webpack 4 defaults to MD4 for content hashing, but MD4 was removed in
 * Node.js 17+ (OpenSSL 3.0 legacy provider is disabled by default).
 *
 * Instead of falling back to MD5 (also broken), we use SHA-256 which is
 * cryptographically sound and available in all Node.js versions.
 *
 * @see {@link https://stackoverflow.com/a/72219174}
 */
let cryptoPatched = false;
const monkeyPathCrypto = () => {
  if (cryptoPatched) return;
  cryptoPatched = true;

  try {
    crypto.createHash('md4');
  } catch (e) {
    const origCreateHash = crypto.createHash;
    crypto.createHash = (alg, opts) => {
      return origCreateHash(alg === 'md4' ? 'sha256' : alg, opts);
    };
  }
};

monkeyPathCrypto();