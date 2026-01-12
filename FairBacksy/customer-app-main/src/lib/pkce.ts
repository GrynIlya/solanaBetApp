/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Based on RFC 7636
 */

/**
 * Generates a cryptographically random code verifier
 * @returns Base64URL-encoded string (43-128 characters)
 */
export function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Generates a code challenge from a code verifier using SHA-256
 * @param verifier - The code verifier
 * @returns Base64URL-encoded SHA-256 hash
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Keycloak OAuth 2.0 configuration
 */
export const KEYCLOAK_CONFIG = {
  baseUrl: 'http://localhost:8080',
  realm: 'forms-realm',
  clientId: 'forms-spa',
  scope: 'openid',
} as const

/**
 * Builds the Keycloak authorization URL with PKCE parameters
 * @param redirectUri - The redirect URI after authorization
 * @param codeChallenge - The code challenge (SHA-256 hash of verifier)
 * @param state - Optional state parameter for CSRF protection
 * @param promptLogin - If true, forces Keycloak to show login form even if session exists
 * @returns The full authorization URL
 */
export function buildAuthorizationUrl(
  redirectUri: string,
  codeChallenge: string,
  state?: string,
  promptLogin: boolean = false
): string {
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CONFIG.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: KEYCLOAK_CONFIG.scope,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  if (state) {
    params.append('state', state)
  }

  // Force login form to appear even if session exists
  if (promptLogin) {
    params.append('prompt', 'login')
  }

  return `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?${params.toString()}`
}

/**
 * Initiates OAuth 2.0 Authorization Code Flow with PKCE
 * Generates code verifier, challenge, and redirects to Keycloak
 * @param redirectUri - The redirect URI (defaults to current origin + /callback)
 * @param forceLogin - If true, forces Keycloak to show login form even if session exists
 */
export async function initiateLogin(redirectUri?: string, forceLogin: boolean = false): Promise<void> {
  const verifier = generateCodeVerifier()
  localStorage.setItem('code_verifier', verifier)

  const challenge = await generateCodeChallenge(verifier)
  // Используем тот же redirectUri, что и в конфиге бэкенда (application.yml)
  // Это необходимо, чтобы Keycloak принял код при обмене
  const finalRedirectUri = redirectUri || `${window.location.origin}/callback`

  const authUrl = buildAuthorizationUrl(finalRedirectUri, challenge, 'login', forceLogin)
  
  if (import.meta.env.DEV) {
    console.log('🔐 PKCE login initiated', {
      verifier: verifier.substring(0, 10) + '...',
      challenge: challenge.substring(0, 10) + '...',
      redirectUri: finalRedirectUri,
      forceLogin,
    })
  }

  window.location.href = authUrl
}

/**
 * Initiates OAuth 2.0 Authorization Code Flow with PKCE for registration
 * Redirects to Keycloak registration page
 * @param redirectUri - The redirect URI (defaults to current origin + /callback)
 */
export async function initiateRegister(redirectUri?: string): Promise<void> {
  const verifier = generateCodeVerifier()
  localStorage.setItem('code_verifier', verifier)

  const challenge = await generateCodeChallenge(verifier)
  const finalRedirectUri = redirectUri || `${window.location.origin}/callback`

  // Build authorization URL with registration action
  const params = new URLSearchParams({
    client_id: KEYCLOAK_CONFIG.clientId,
    redirect_uri: finalRedirectUri,
    response_type: 'code',
    scope: KEYCLOAK_CONFIG.scope,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: 'register',
    kc_action: 'REGISTER', // Keycloak registration action
  })

  const authUrl = `${KEYCLOAK_CONFIG.baseUrl}/realms/${KEYCLOAK_CONFIG.realm}/protocol/openid-connect/auth?${params.toString()}`
  
  if (import.meta.env.DEV) {
    console.log('📝 PKCE registration initiated', {
      verifier: verifier.substring(0, 10) + '...',
      challenge: challenge.substring(0, 10) + '...',
      redirectUri: finalRedirectUri,
    })
  }

  window.location.href = authUrl
}

/**
 * Logs out from Keycloak session
 * 
 * Note: This function is deprecated. For SPA clients without id_token,
 * we cannot use Keycloak's logout endpoint (it requires id_token_hint).
 * 
 * Instead, use useAuthStore.logout() which:
 * 1. Clears all local tokens and state
 * 2. Redirects to login page using window.location.href (full page reload)
 * 3. Uses prompt=login on next login to force login form
 * 
 * The Keycloak session will be effectively cleared when user logs in again
 * with prompt=login, as it forces re-authentication.
 * 
 * @deprecated Use useAuthStore.logout() instead
 * @param redirectUri - The redirect URI after logout (defaults to current origin + /login)
 */
export function logoutFromKeycloak(redirectUri?: string): void {
  const finalRedirectUri = redirectUri || `${window.location.origin}/login`
  
  if (import.meta.env.DEV) {
    console.log('🚪 Logging out (redirecting to login)', { redirectUri: finalRedirectUri })
  }
  
  window.location.href = finalRedirectUri
}

