/**
 * 支付服务
 * 支持模拟支付和真实支付接口（支付宝/微信支付）
 */

import prisma from '../utils/prisma';
import crypto from 'crypto';
import type { Payment } from '@prisma/client';

export interface PaymentRequest {
  bookingId: string;
  payerId: string;
  payeeId: string;
  amount: number;
  paymentMethod: 'simulate' | 'alipay' | 'wechat';
}

export interface PaymentResult {
  success: boolean;
  paymentId?: string;
  transactionId?: string;
  message?: string;
  payUrl?: string; // 支付页面URL（真实支付）
}

/**
 * 创建支付订单
 */
export async function createPayment(request: PaymentRequest): Promise<Payment> {
  // 创建支付记录
  const payment = await prisma.payment.create({
    data: {
      bookingId: request.bookingId,
      payerId: request.payerId,
      payeeId: request.payeeId,
      amount: request.amount,
      paymentMethod: request.paymentMethod,
      status: 'pending'
    }
  });

  return payment as any;
}

/**
 * 处理支付
 */
export async function processPayment(
  paymentId: string,
  paymentMethod: string
): Promise<PaymentResult> {
  
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  if (!payment) {
    return { success: false, message: '支付订单不存在' };
  }

  if (payment.status !== 'pending') {
    return { success: false, message: '订单状态异常' };
  }

  // 根据支付方式处理
  switch (paymentMethod) {
    case 'simulate':
      return processSimulatePayment(payment);
    case 'alipay':
      return processAlipayPayment(payment);
    case 'wechat':
      return processWechatPayment(payment);
    default:
      return { success: false, message: '不支持的支付方式' };
  }
}

/**
 * 模拟支付（测试环境）
 */
async function processSimulatePayment(payment: any): Promise<PaymentResult> {
  // 模拟支付成功
  const transactionId = `SIM${Date.now()}${Math.random().toString(36).slice(2, 9).toUpperCase()}`;
  
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'success',
      transactionId,
      updatedAt: new Date()
    }
  });

  // 更新预约状态
  await prisma.booking.update({
    where: { id: payment.bookingId },
    data: { status: 'confirmed' }
  });

  console.log(`✅ 模拟支付成功: ${payment.amount}元, 交易号: ${transactionId}`);

  return {
    success: true,
    paymentId: payment.id,
    transactionId,
    message: '支付成功（模拟）'
  };
}

/**
 * 支付宝支付（预留接口）
 */
async function processAlipayPayment(payment: any): Promise<PaymentResult> {
  // TODO: 集成支付宝SDK
  // const AlipaySdk = require('alipay-sdk').default;
  // const alipaySdk = new AlipaySdk({
  //   appId: process.env.ALIPAY_APP_ID,
  //   privateKey: process.env.ALIPAY_PRIVATE_KEY,
  //   alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY
  // });
  
  // const formData = new AlipayFormData();
  // formData.addField('returnUrl', 'http://yoursite.com/return');
  // formData.addField('bizContent', {
  //   outTradeNo: payment.id,
  //   productCode: 'FAST_INSTANT_TRADE_PAY',
  //   totalAmount: payment.amount,
  //   subject: '预约咨询服务',
  //   body: `预约ID: ${payment.bookingId}`
  // });
  
  // const result = await alipaySdk.exec(
  //   'alipay.trade.page.pay',
  //   {},
  //   { formData }
  // );

  console.log('支付宝支付（待实现）:', payment.amount);

  return {
    success: true,
    paymentId: payment.id,
    payUrl: `https://openapi.alipay.com/gateway.do?out_trade_no=${payment.id}`,
    message: '请在打开的页面完成支付'
  };
}

/**
 * 微信支付（预留接口）
 */
async function processWechatPayment(payment: any): Promise<PaymentResult> {
  // TODO: 集成微信支付SDK
  // const WxPay = require('wechatpay-node-v3');
  // const pay = new WxPay({
  //   appid: process.env.WECHAT_APP_ID,
  //   mchid: process.env.WECHAT_MCH_ID,
  //   publicKey: process.env.WECHAT_PUBLIC_KEY,
  //   privateKey: process.env.WECHAT_PRIVATE_KEY
  // });
  
  // const result = await pay.transactions_native({
  //   description: '预约咨询服务',
  //   out_trade_no: payment.id,
  //   amount: {
  //     total: Math.floor(payment.amount * 100) // 分为单位
  //   }
  // });

  console.log('微信支付（待实现）:', payment.amount);

  return {
    success: true,
    paymentId: payment.id,
    payUrl: `weixin://wxpay/bizpayurl?pr=${payment.id}`,
    message: '请使用微信扫码支付'
  };
}

/**
 * 支付回调验证
 */
export async function verifyPaymentCallback(
  paymentMethod: string,
  callbackData: any
): Promise<{valid: boolean; paymentId?: string; transactionId?: string}> {
  
  switch (paymentMethod) {
    case 'alipay':
      return verifyAlipayCallback(callbackData);
    case 'wechat':
      return verifyWechatCallback(callbackData);
    default:
      return { valid: false };
  }
}

/**
 * 验证支付宝回调
 */
async function verifyAlipayCallback(data: any): Promise<any> {
  // TODO: 验证支付宝签名
  // const alipaySdk = new AlipaySdk({...});
  // const valid = alipaySdk.checkNotifySign(data);
  
  console.log('验证支付宝回调（待实现）');
  
  return {
    valid: true,
    paymentId: data.out_trade_no,
    transactionId: data.trade_no
  };
}

/**
 * 验证微信支付回调
 */
async function verifyWechatCallback(data: any): Promise<any> {
  // TODO: 验证微信支付签名
  // const pay = new WxPay({...});
  // const valid = pay.verifySign(data);
  
  console.log('验证微信支付回调（待实现）');
  
  return {
    valid: true,
    paymentId: data.out_trade_no,
    transactionId: data.transaction_id
  };
}

/**
 * 确认支付成功
 */
export async function confirmPayment(
  paymentId: string,
  transactionId: string
): Promise<boolean> {
  try {
    await prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: 'success',
        transactionId,
        updatedAt: new Date()
      }
    });

    // 更新预约状态
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId }
    });

    if (payment) {
      await prisma.booking.update({
        where: { id: payment.bookingId },
        data: { status: 'confirmed' }
      });
    }

    return true;
  } catch (error) {
    console.error('确认支付失败:', error);
    return false;
  }
}

/**
 * 申请退款
 */
export async function refundPayment(
  paymentId: string,
  reason: string
): Promise<{success: boolean; message: string}> {
  
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  });

  if (!payment || payment.status !== 'success') {
    return { success: false, message: '无法退款：支付未成功或订单不存在' };
  }

  // 根据支付方式处理退款
  let refundResult;
  switch (payment.paymentMethod) {
    case 'simulate':
      refundResult = await refundSimulatePayment(payment);
      break;
    case 'alipay':
      refundResult = await refundAlipayPayment(payment, reason);
      break;
    case 'wechat':
      refundResult = await refundWechatPayment(payment, reason);
      break;
    default:
      return { success: false, message: '不支持的支付方式' };
  }

  if (refundResult.success) {
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: 'refunded' }
    });

    await prisma.booking.update({
      where: { id: payment.bookingId },
      data: { status: 'cancelled' }
    });
  }

  return refundResult;
}

async function refundSimulatePayment(payment: any): Promise<{success: boolean; message: string}> {
  console.log(`✅ 模拟退款成功: ${payment.amount}元`);
  return { success: true, message: '退款成功（模拟）' };
}

async function refundAlipayPayment(payment: any, reason: string): Promise<{success: boolean; message: string}> {
  // TODO: 调用支付宝退款API
  console.log('支付宝退款（待实现）:', payment.amount);
  return { success: true, message: '退款申请已提交' };
}

async function refundWechatPayment(payment: any, reason: string): Promise<{success: boolean; message: string}> {
  // TODO: 调用微信支付退款API
  console.log('微信支付退款（待实现）:', payment.amount);
  return { success: true, message: '退款申请已提交' };
}

/**
 * 查询支付状态
 */
export async function queryPaymentStatus(paymentId: string): Promise<any> {
  return await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      booking: true,
      payer: {
        select: { id: true, username: true, email: true }
      },
      payee: {
        select: { id: true, username: true, email: true }
      }
    }
  });
}



