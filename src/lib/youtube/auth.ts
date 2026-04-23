import type { OAuth2Tokens, TokenStorage, YouTubeConfig } from './types';

export interface YouTubeAuth {
  isAuthenticated(): Promise<boolean>;
  getValidAccessToken(): Promise<string | null>;
  saveTokens(tokens: OAuth2Tokens): Promise<void>;
  clearAuth(): Promise<void>;
  getAuthorizationUrl(): string;
}

export function createYouTubeAuth(config: YouTubeConfig, storage: TokenStorage): YouTubeAuth {
  const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
  const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

  return {
    async isAuthenticated(): Promise<boolean> {
      const tokens = await storage.load();
      if (!tokens) return false;
      return tokens.expires_at > Date.now();
    },

    async getValidAccessToken(): Promise<string | null> {
      const tokens = await storage.load();
      if (!tokens) return null;

      // Token still valid
      if (tokens.expires_at > Date.now() + 60000) {
        // 1 min buffer
        return tokens.access_token;
      }

      // Token expired or about to expire, try refresh
      try {
        const response = await fetch(GOOGLE_TOKEN_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            refresh_token: tokens.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        if (!response.ok) {
          await storage.clear();
          return null;
        }

        const data = await response.json();
        const newTokens: OAuth2Tokens = {
          access_token: data.access_token,
          refresh_token: tokens.refresh_token, // Keep old refresh token
          expires_at: Date.now() + data.expires_in * 1000,
          token_type: data.token_type,
          scope: data.scope,
        };

        await storage.save(newTokens);
        return newTokens.access_token;
      } catch {
        await storage.clear();
        return null;
      }
    },

    async saveTokens(tokens: OAuth2Tokens): Promise<void> {
      await storage.save(tokens);
    },

    async clearAuth(): Promise<void> {
      await storage.clear();
    },

    getAuthorizationUrl(): string {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        scope:
          'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.force-ssl',
        response_type: 'code',
        access_type: 'offline',
        prompt: 'consent',
      });
      return `${GOOGLE_AUTH_URL}?${params.toString()}`;
    },
  };
}
