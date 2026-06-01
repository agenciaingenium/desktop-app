import { BrowserWindow } from 'electron';
import * as http from 'http';
import * as url from 'url';
import * as crypto from 'crypto';
import log from 'electron-log';

import { RPC } from '../../lib/types';
import { openExternal } from '../../../utils/shell';
import { ElectronGoogleOAuthService, ElectronGoogleSignInResponse } from './interface';
import { jsonFetch } from '../authentication/utils';

/**
 * Google OAuth 2.0 PKCE implementation for desktop apps.
 *
 * Replaces the previous flow that used @getstation/electron-google-oauth2
 * with a client secret (insecure for public clients). This implementation
 * uses the Authorization Code flow with PKCE (RFC 7636), which is the
 * recommended approach for native/desktop applications.
 *
 * @see https://developers.google.com/identity/protocols/oauth2/native-app
 * @see https://tools.ietf.org/html/rfc7636
 */

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const LOOPBACK_REDIRECT_PORT = 42812;
const GOOGLE_AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const SUCCESS_REDIRECT_URL = 'https://getstation.com/';

function base64URLEncode(buffer: Buffer): string {
  return buffer.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function generatePKCEChallengePair(): { verifier: string; challenge: string } {
  const verifier = base64URLEncode(crypto.randomBytes(32));
  const challenge = base64URLEncode(
    crypto.createHash('sha256').update(verifier).digest()
  );
  return { verifier, challenge };
}

function getFormBody(body: Record<string, string>) {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  };
}

/**
 * Parse a JWT id_token to extract user profile information.
 * Used as a fallback when the People API call fails.
 */
function parseIdToken(idToken: string): {
  sub: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
} | null {
  try {
    const parts = idToken.split('.');
    if (parts.length < 2) return null;
    const payload = Buffer.from(parts[1], 'base64').toString();
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

/**
 * Loopback redirect server that listens for the OAuth callback.
 * Opens a local HTTP server on the specified port, captures the
 * authorization code from the redirect, then closes the server.
 *
 * @see https://tools.ietf.org/html/rfc8252#section-7.3
 */
class LoopbackRedirectServer {
  private server!: http.Server;
  private redirectPromise: Promise<string>;

  constructor(options: { port: number; callbackPath: string; successRedirectURL: string }) {
    this.redirectPromise = new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => {
        if (req.url && url.parse(req.url).pathname === options.callbackPath) {
          res.writeHead(302, { Location: options.successRedirectURL });
          res.end();
          resolve(url.resolve(`http://127.0.0.1:${options.port}`, req.url));
          this.server.close();
        } else {
          res.writeHead(404);
          res.end();
        }
      });
      this.server.on('error', e => reject(e));
      this.server.listen(options.port);
    });
  }

  waitForRedirection(): Promise<string> {
    return this.redirectPromise;
  }

  close(): Promise<void> {
    return new Promise(resolve => this.server.close(() => resolve()));
  }
}

export class ElectronGoogleOAuthPKCEServiceImpl extends ElectronGoogleOAuthService implements RPC.Interface<ElectronGoogleOAuthService> {
  private loopbackServer: LoopbackRedirectServer | null = null;

  async signIn(scopes: string[], forceAddSession?: boolean): Promise<ElectronGoogleSignInResponse> {
    // Generate PKCE challenge pair
    const { verifier, challenge } = generatePKCEChallengePair();

    // Build the authorization URL with PKCE parameters
    const authUrl = new URL(GOOGLE_AUTH_ENDPOINT);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `http://127.0.0.1:${LOOPBACK_REDIRECT_PORT}/callback`);
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('code_challenge', challenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', forceAddSession ? 'consent' : 'select_account');

    // Start the loopback redirect server
    if (this.loopbackServer) {
      await this.loopbackServer.close();
    }
    this.loopbackServer = new LoopbackRedirectServer({
      port: LOOPBACK_REDIRECT_PORT,
      callbackPath: '/callback',
      successRedirectURL: SUCCESS_REDIRECT_URL,
    });

    // Open the browser for the user to authenticate
    openExternal(authUrl.toString());

    // Wait for the redirect with the authorization code
    const callbackUrl = await this.loopbackServer.waitForRedirection();
    this.loopbackServer = null;

    // Refocus the app window
    BrowserWindow.getAllWindows().filter(w => w.isVisible()).forEach(w => w.show());

    // Parse the authorization code from the callback URL
    const { query } = url.parse(callbackUrl, true);
    if (query.error) {
      throw new Error(`Google OAuth error: ${query.error_description || query.error}`);
    }
    if (!query.code) {
      throw new Error('Google OAuth: no authorization code received');
    }

    // Exchange the authorization code for tokens using PKCE
    const tokenResponse = await jsonFetch(GOOGLE_TOKEN_ENDPOINT, getFormBody({
      grant_type: 'authorization_code',
      client_id: CLIENT_ID,
      code: query.code as string,
      code_verifier: verifier,
      redirect_uri: `http://127.0.0.1:${LOOPBACK_REDIRECT_PORT}/callback`,
    })) as any;

    if (tokenResponse.error) {
      throw new Error(`Google OAuth token error: ${tokenResponse.error_description || tokenResponse.error}`);
    }

    // Try to fetch user profile from People API
    try {
      const profileResponse = await jsonFetch(
        `https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos&access_token=${tokenResponse.access_token}`,
        { method: 'GET' }
      );

      return {
        tokens: {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          id_token: tokenResponse.id_token,
          token_type: tokenResponse.token_type || 'Bearer',
          expiry_date: tokenResponse.expires_in ? Date.now() + tokenResponse.expires_in * 1000 : undefined,
          scope: tokenResponse.scope,
        },
        profile: profileResponse,
      };
    } catch (profileErr) {
      log.error(`Google profile request error: ${profileErr}`);

      // Fallback: parse the id_token JWT to extract profile info
      if (tokenResponse.id_token) {
        const tokenPayload = parseIdToken(tokenResponse.id_token);
        if (tokenPayload) {
          return {
            tokens: {
              access_token: tokenResponse.access_token,
              refresh_token: tokenResponse.refresh_token,
              id_token: tokenResponse.id_token,
              token_type: tokenResponse.token_type || 'Bearer',
              expiry_date: tokenResponse.expires_in ? Date.now() + tokenResponse.expires_in * 1000 : undefined,
              scope: tokenResponse.scope,
            },
            profile: {
              names: [{
                metadata: { source: { id: tokenPayload.sub } },
                displayName: tokenPayload.name,
                givenName: tokenPayload.given_name,
                familyName: tokenPayload.family_name,
              }],
              emailAddresses: [{
                value: tokenPayload.email,
              }],
              photos: [{
                url: tokenPayload.picture,
              }],
            },
          };
        }
      }

      // Last resort: return minimal profile
      return {
        tokens: {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          id_token: tokenResponse.id_token,
          token_type: tokenResponse.token_type || 'Bearer',
          expiry_date: tokenResponse.expires_in ? Date.now() + tokenResponse.expires_in * 1000 : undefined,
          scope: tokenResponse.scope,
        },
        profile: {
          names: [{ displayName: 'unknown' }],
          emailAddresses: [{ value: 'unknown' }],
        },
      };
    }
  }
}
