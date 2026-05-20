import { ElectronGoogleOAuthPKCEServiceImpl } from './main-pkce';

/**
 * Delegate to the PKCE-based implementation that replaces
 * the previous flow using @getstation/electron-google-oauth2
 * with a client secret (insecure for public clients).
 *
 * @see ./main-pkce.ts for the full PKCE (RFC 7636) implementation
 */
export class ElectronGoogleOAuthServiceImpl extends ElectronGoogleOAuthPKCEServiceImpl {}
