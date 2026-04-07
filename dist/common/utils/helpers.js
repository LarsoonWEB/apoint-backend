"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateBookingNumber = generateBookingNumber;
exports.generateSlug = generateSlug;
exports.paginate = paginate;
exports.timeToMinutes = timeToMinutes;
exports.minutesToTime = minutesToTime;
function generateBookingNumber(dailyCount) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = String(dailyCount).padStart(3, '0');
    return `AP-${year}${month}${day}-${seq}`;
}
function generateSlug(name) {
    return name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đ]/g, 'd')
        .replace(/[ž]/g, 'z')
        .replace(/[č]/g, 'c')
        .replace(/[ć]/g, 'c')
        .replace(/[š]/g, 's')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}
function paginate(total, page, perPage) {
    return {
        page,
        perPage,
        total,
        totalPages: Math.ceil(total / perPage),
    };
}
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}
function minutesToTime(minutes) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
//# sourceMappingURL=helpers.js.map