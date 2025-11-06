export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  dob?: string;
  gender?: string;
  points?: number;
  membershipTier?: string;
  role?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

