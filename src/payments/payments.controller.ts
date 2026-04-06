import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // ── Stripe Connect ────────────────────────────────────────

  @Post('connect/:businessId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create Stripe Connect account for business' })
  async createConnectAccount(
    @Param('businessId') businessId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createConnectAccount(businessId, userId);
  }

  @Get('connect/:businessId/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stripe Connect account status' })
  async getConnectStatus(@Param('businessId') businessId: string) {
    return this.paymentsService.getConnectAccountStatus(businessId);
  }

  @Get('connect/:businessId/dashboard')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stripe Express dashboard login link' })
  async getConnectDashboard(@Param('businessId') businessId: string) {
    return this.paymentsService.createConnectLoginLink(businessId);
  }

  @Public()
  @Get('connect/refresh')
  @ApiOperation({ summary: 'Stripe Connect onboarding refresh URL' })
  async connectRefresh(@Query('business_id') businessId: string) {
    return { message: 'Please restart the onboarding process from the app' };
  }

  // ── Payment Intent ────────────────────────────────────────

  @Post('intent/:bookingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent for a booking' })
  async createPaymentIntent(
    @Param('bookingId') bookingId: string,
    @Body() body: { type: 'deposit' | 'full_payment' },
  ) {
    return this.paymentsService.createPaymentIntent(bookingId, body.type);
  }

  // ── Refund ────────────────────────────────────────────────

  @Post('refund/:bookingId')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refund a payment' })
  async refund(
    @Param('bookingId') bookingId: string,
    @Body() body: { amount?: number; reason?: string },
  ) {
    return this.paymentsService.refund(bookingId, body.amount, body.reason);
  }

  // ── Stripe Webhook ────────────────────────────────────────

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  async webhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const rawBody = req.rawBody || req.body;
    if (!rawBody) {
      return { error: 'Raw body not available' };
    }
    return this.paymentsService.handleWebhook(rawBody, signature);
  }
}
