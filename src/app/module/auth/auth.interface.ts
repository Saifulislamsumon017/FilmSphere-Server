export interface IRegisterUserPayload {
  name: string;
  email: string;
  password: string;
}

export interface ILoginUserPayload {
  email: string;
  password: string;
}

export interface IVerifyEmailPayload {
  email: string;
  otp: string;
}

export interface IChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface IForgetPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

export interface IGetNewTokenPayload {
  refreshToken: string;
  sessionToken: string;
}

export interface IRefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  sessionToken: string;
}

// auth.interface.ts
export interface IGoogleSession {
  user: {
    id: string;
    name: string;
    email: string;
    role?: string;
  };
}

export interface IGoogleLoginResponse {
  accessToken: string;
  refreshToken: string;
}
