export declare function generateBookingNumber(dailyCount: number): string;
export declare function generateSlug(name: string): string;
export declare function paginate(total: number, page: number, perPage: number): {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
};
export declare function timeToMinutes(time: string): number;
export declare function minutesToTime(minutes: number): string;
