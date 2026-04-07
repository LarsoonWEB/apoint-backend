import { NotificationsService } from './notifications.service';
export declare class NotificationsController {
    private notificationsService;
    constructor(notificationsService: NotificationsService);
    registerDevice(userId: string, body: {
        token: string;
        platform: string;
    }): Promise<{
        message: string;
    }>;
    unregisterDevice(body: {
        token: string;
    }): Promise<{
        message: string;
    }>;
}
