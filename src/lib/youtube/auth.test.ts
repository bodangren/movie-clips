import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createYouTubeAuth, type YouTubeAuth } from './auth';
import type { OAuth2Tokens, TokenStorage } from './types';

const mockTokens: OAuth2Tokens = {
  access_token: 'test_access_token',
  refresh_token: 'test_refresh_token',
  expires_at: Date.now() + 3600 * 1000,
  token_type: 'Bearer',
  scope: 'https://www.googleapis.com/auth/youtube.upload',
};

function createMockStorage(): TokenStorage {
  let stored: OAuth2Tokens | null = null;
  return {
    save: vi.fn(async (tokens: OAuth2Tokens) => {
      stored = tokens;
    }),
    load: vi.fn(async () => stored),
    clear: vi.fn(async () => {
      stored = null;
    }),
  };
}

describe('YouTube Auth', () => {
  let auth: YouTubeAuth;
  let mockStorage: TokenStorage;

  beforeEach(() => {
    mockStorage = createMockStorage();
    auth = createYouTubeAuth(
      {
        clientId: 'test_client_id',
        clientSecret: 'test_client_secret',
        redirectUri: 'http://localhost:8080/callback',
        enabled: true,
      },
      mockStorage
    );
  });

  describe('isAuthenticated', () => {
    it('returns false when no tokens stored', async () => {
      const result = await auth.isAuthenticated();
      expect(result).toBe(false);
    });

    it('returns true when valid tokens exist', async () => {
      await mockStorage.save(mockTokens);
      const result = await auth.isAuthenticated();
      expect(result).toBe(true);
    });

    it('returns false when tokens are expired', async () => {
      const expiredTokens = {
        ...mockTokens,
        expires_at: Date.now() - 1000,
      };
      await mockStorage.save(expiredTokens);
      const result = await auth.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('getValidAccessToken', () => {
    it('returns null when no tokens stored', async () => {
      const token = await auth.getValidAccessToken();
      expect(token).toBeNull();
    });

    it('returns access token when valid', async () => {
      await mockStorage.save(mockTokens);
      const token = await auth.getValidAccessToken();
      expect(token).toBe('test_access_token');
    });

    it('refreshes token when expired', async () => {
      const expiredTokens = {
        ...mockTokens,
        expires_at: Date.now() - 1000,
      };
      await mockStorage.save(expiredTokens);

      // Mock fetch for token refresh
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: 'new_access_token',
          expires_in: 3600,
          token_type: 'Bearer',
          scope: 'https://www.googleapis.com/auth/youtube.upload',
        }),
      } as Response);

      const token = await auth.getValidAccessToken();
      expect(token).toBe('new_access_token');
      expect(mockStorage.save).toHaveBeenCalled();
    });

    it('returns null and clears storage when refresh fails', async () => {
      const expiredTokens = {
        ...mockTokens,
        expires_at: Date.now() - 1000,
      };
      await mockStorage.save(expiredTokens);

      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: 'invalid_grant' }),
      } as Response);

      const token = await auth.getValidAccessToken();
      expect(token).toBeNull();
      expect(mockStorage.clear).toHaveBeenCalled();
    });
  });

  describe('saveTokens', () => {
    it('saves tokens to storage', async () => {
      await auth.saveTokens(mockTokens);
      expect(mockStorage.save).toHaveBeenCalledWith(mockTokens);
    });
  });

  describe('clearAuth', () => {
    it('clears tokens from storage', async () => {
      await auth.saveTokens(mockTokens);
      await auth.clearAuth();
      expect(mockStorage.clear).toHaveBeenCalled();
      const result = await auth.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('getAuthorizationUrl', () => {
    it('generates correct authorization URL', () => {
      const url = auth.getAuthorizationUrl();
      expect(url).toContain('https://accounts.google.com/o/oauth2/v2/auth');
      expect(url).toContain('client_id=test_client_id');
      expect(url).toContain('redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fcallback');
      expect(url).toContain('scope=');
      expect(url).toContain('response_type=code');
      expect(url).toContain('access_type=offline');
      expect(url).toContain('prompt=consent');
    });
  });
});
