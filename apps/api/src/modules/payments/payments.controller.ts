import { Body, Controller, Get, Param, Post, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { createCheckoutSchema, paymentWebhookSchema } from '@turkiye-pazaryeri/types';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public, SkipCsrf } from '../../common/decorators/public.decorator';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Public()
  @Get('pricing')
  @ApiOperation({ summary: 'List pricing plans (public)' })
  getPricing() {
    return this.payments.getPricing();
  }

  @Public()
  @Get('enabled')
  @ApiOperation({ summary: 'Check if payments feature is enabled' })
  async isEnabled() {
    return { enabled: await this.payments.isPaymentsEnabled() };
  }

  @Public()
  @Get('mock-checkout')
  @ApiOperation({ summary: 'Mock checkout redirect page (dev only)' })
  mockCheckout(
    @Query('ref') ref: string,
    @Query('paymentId') paymentId: string,
    @Res() res: Response,
  ) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).send('Not found');
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!DOCTYPE html>
<html lang="tr"><head><meta charset="utf-8"><title>Mock Ödeme</title></head>
<body style="font-family:sans-serif;max-width:480px;margin:40px auto;padding:20px">
  <h1>Mock Ödeme</h1>
  <p>Referans: ${ref}</p>
  <p>Ödeme ID: ${paymentId}</p>
  <p>Geliştirme ortamında ödemeyi tamamlamak için API'ye POST isteği gönderin:</p>
  <pre>POST /v1/payments/${paymentId}/confirm</pre>
  <p>Authorization: Bearer &lt;token&gt;</p>
</body></html>`);
  }

  @Get()
  @Roles(Role.FINANCE, Role.SUPER_ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all payments (finance admin)' })
  listAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.payments.listAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Get('mine')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List current user payments' })
  listMine(
    @CurrentUser() user: { id: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.payments.listMine(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Post('checkout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create checkout session for listing promotion' })
  checkout(@CurrentUser() user: { id: string }, @Body() body: unknown) {
    return this.payments.createCheckout(user.id, createCheckoutSchema.parse(body));
  }

  @Public()
  @SkipCsrf()
  @Post('webhook')
  @ApiOperation({ summary: 'Payment provider webhook' })
  webhook(@Body() body: unknown) {
    return this.payments.handleWebhook(paymentWebhookSchema.parse(body));
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment by id' })
  get(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.payments.findById(id, user.id);
  }

  @Post(':id/confirm')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment (mock provider / dev)' })
  confirm(@CurrentUser() user: { id: string }, @Param('id') id: string) {
    return this.payments.confirmPayment(id, user.id);
  }
}
