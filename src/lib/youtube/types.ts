export interface OAuth2Tokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp in milliseconds
  token_type: string;
  scope: string;
}

export interface YouTubeConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  enabled: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  tokens: OAuth2Tokens | null;
  error: string | null;
}

export interface TokenStorage {
  save(tokens: OAuth2Tokens): Promise<void>;
  load(): Promise<OAuth2Tokens | null>;
  clear(): Promise<void>;
}
