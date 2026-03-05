import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { adminDb } from '@/lib/firebase-admin';
import * as admin from 'firebase-admin';

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '' 
});

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const dataId = searchParams.get('data.id');

    // Mercado Pago sends notifications for different types
    if (type === 'payment' && dataId) {
      const payment = new Payment(client);
      const paymentData = await payment.get({ id: dataId });

      if (paymentData.status === 'approved') {
        const userId = paymentData.external_reference;
        const creditsToAdd = paymentData.metadata?.credits_to_add;

        if (userId && creditsToAdd) {
          const userRef = adminDb.collection('users').doc(userId);
          
          // Atomic increment of credits
          await userRef.update({
            credits: admin.firestore.FieldValue.increment(Number(creditsToAdd)),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log(`Successfully added ${creditsToAdd} credits to user ${userId}`);
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Mercado Pago Webhook Error:', error);
    // Return 200 anyway to stop MP from retrying if it's a permanent error
    // but log it for debugging.
    return NextResponse.json({ received: true, error: error.message });
  }
}
