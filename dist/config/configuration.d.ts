declare const _default: () => {
    port: number;
    nodeEnv: string;
    jwt: {
        secret: string;
        accessExpiry: string;
        refreshExpiry: string;
    };
    supabase: {
        url: string;
        anonKey: string;
        serviceRoleKey: string;
    };
    stripe: {
        secretKey: string;
        publishableKey: string;
        webhookSecret: string;
        platformFeePercent: number;
    };
    redis: {
        url: string;
    };
    whatsapp: {
        phoneNumberId: string;
        businessAccountId: string;
        accessToken: string;
        verifyToken: string;
        appSecret: string;
    };
    email: {
        resendApiKey: string;
        from: string;
    };
    sms: {
        twilioAccountSid: string;
        twilioAuthToken: string;
        twilioPhoneNumber: string;
    };
    firebase: {
        projectId: string;
        privateKey: string;
        clientEmail: string;
    };
    s3: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
    };
    app: {
        apiUrl: string;
        webUrl: string;
        appScheme: string;
        corsOrigins: string[];
    };
};
export default _default;
