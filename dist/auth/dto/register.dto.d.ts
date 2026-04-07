export declare class RegisterDto {
    email: string;
    firstName: string;
    lastName: string;
    password: string;
    phone?: string;
    userType?: 'user' | 'provider';
}
export declare class LoginDto {
    email: string;
    password: string;
}
export declare class OAuthDto {
    idToken: string;
}
export declare class RefreshTokenDto {
    refreshToken: string;
}
export declare class ForgotPasswordDto {
    email: string;
}
export declare class ResetPasswordDto {
    token: string;
    newPassword: string;
}
export declare class VerifyEmailDto {
    token: string;
}
