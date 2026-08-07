import type { IfsProfile } from './profile-store';

export interface TokenProvider {
  getToken(profile: IfsProfile): Promise<string>;
}

interface TokenResult {
  token: string;
  expiresInSeconds: number;
}

interface TokenResponse {
  access_token?: string;
  expires_in?: number;
}

const DEFAULT_TTL_SECONDS = 60;
// Refresh a bit before actual expiry to avoid racing a token that dies mid-request.
const EXPIRY_SAFETY_MARGIN_MS = 5_000;

/** Talks to Keycloak. Single responsibility: exchange credentials for a token. No caching. */
export class KeycloakTokenFetcher implements TokenProvider {
  async getToken(profile: IfsProfile): Promise<string> {
    const { token } = await this.fetchWithExpiry(profile);
    return token;
  }

  async fetchWithExpiry(profile: IfsProfile): Promise<TokenResult> {
    const keycloakBase = profile.keycloakBasePath ?? '/auth';
    const url = `${profile.host}${keycloakBase}/realms/${profile.realm}/protocol/openid-connect/token`;

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: profile.clientId,
      client_secret: profile.clientSecret,
      scope: 'openid microprofile-jwt',
    });

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    }).catch((err: Error) => {
      throw new Error(
        `Cannot reach IFS host (${profile.host}): ${err.message}. Check your network connection and VPN.`,
      );
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      let detail = body;
      try {
        const json = JSON.parse(body) as { error_description?: string; error?: string };
        detail = json.error_description ?? json.error ?? body;
      } catch {
        /* not JSON — use raw body */
      }
      throw new Error(`Auth failed (${res.status}): ${detail}`);
    }

    const data = (await res.json()) as TokenResponse;
    if (!data.access_token) throw new Error('No access_token in auth response');
    return { token: data.access_token, expiresInSeconds: data.expires_in ?? DEFAULT_TTL_SECONDS };
  }
}

interface CacheEntry {
  token: string;
  expiresAt: number;
}

/** Decorates a KeycloakTokenFetcher, reusing a cached token per profile until it's about to expire. */
export class CachingTokenProvider implements TokenProvider {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly inner: KeycloakTokenFetcher = new KeycloakTokenFetcher()) {}

  async getToken(profile: IfsProfile): Promise<string> {
    const key = this.cacheKey(profile);
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.token;
    }

    const { token, expiresInSeconds } = await this.inner.fetchWithExpiry(profile);
    this.cache.set(key, {
      token,
      expiresAt: Date.now() + expiresInSeconds * 1000 - EXPIRY_SAFETY_MARGIN_MS,
    });
    return token;
  }

  private cacheKey(profile: IfsProfile): string {
    return `${profile.host}::${profile.keycloakBasePath ?? '/auth'}::${profile.realm}::${profile.clientId}`;
  }
}

/** Shared cached provider — reuses tokens per profile across calls within this process. */
export const cachedTokenProvider: TokenProvider = new CachingTokenProvider();
