"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var AllExceptionsFilter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllExceptionsFilter = void 0;
const common_1 = require("@nestjs/common");
let AllExceptionsFilter = AllExceptionsFilter_1 = class AllExceptionsFilter {
    constructor() {
        this.logger = new common_1.Logger(AllExceptionsFilter_1.name);
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_ERROR';
        let message = 'An unexpected error occurred';
        let details = undefined;
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const exResponse = exception.getResponse();
            if (typeof exResponse === 'string') {
                message = exResponse;
            }
            else if (typeof exResponse === 'object') {
                const obj = exResponse;
                message = obj.message || message;
                code = obj.code || code;
                details = obj.details;
                if (Array.isArray(obj.message)) {
                    code = 'VALIDATION_ERROR';
                    details = obj.message;
                    message = 'Validation failed';
                }
            }
            if (code === 'INTERNAL_ERROR') {
                switch (status) {
                    case 400:
                        code = 'BAD_REQUEST';
                        break;
                    case 401:
                        code = 'UNAUTHORIZED';
                        break;
                    case 403:
                        code = 'FORBIDDEN';
                        break;
                    case 404:
                        code = 'NOT_FOUND';
                        break;
                    case 409:
                        code = 'CONFLICT';
                        break;
                    case 429:
                        code = 'RATE_LIMIT_EXCEEDED';
                        break;
                }
            }
        }
        else {
            this.logger.error('Unhandled exception', exception);
        }
        response.status(status).json({
            success: false,
            error: {
                code,
                message,
                ...(details && { details }),
            },
        });
    }
};
exports.AllExceptionsFilter = AllExceptionsFilter;
exports.AllExceptionsFilter = AllExceptionsFilter = AllExceptionsFilter_1 = __decorate([
    (0, common_1.Catch)()
], AllExceptionsFilter);
//# sourceMappingURL=http-exception.filter.js.map