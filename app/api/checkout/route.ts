import { NextRequest, NextResponse } from 'next/server';
import { MercadoPagoConfig, Preference } from 'mercadopago';

// Initialize Mercado Pago with Access Token
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN || '',
  options: { timeout: 5000 }
});

export async function POST(req: NextRequest) {
  try {
    const { userId, amount, credits } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const preference = new Preference(client);
    
    // Create payment preference
    const result = await preference.create({
      body: {
        items: [
          {
            id: 'credits-pack',
            title: `${credits} Créditos - Mindrop`,
            quantity: 1,
            unit_price: Number(amount),
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: 'test_user@test.com', // In production, use user's real email
        },
        back_urls: {
          success: `${process.env.APP_URL}/vault?payment=success`,
          failure: `${process.env.APP_URL}/vault?payment=failure`,
          pending: `${process.env.APP_URL}/vault?payment=pending`,
        },
        auto_return: 'approved',
        notification_url: `${process.env.APP_URL}/api/webhook/mercadopago`,
        external_reference: userId, // Store UID here to identify user in webhook
        metadata: {
          user_id: userId,
          credits_to_add: credits
        }
      }
    });

    return NextResponse.json({ id: result.id, init_point: result.init_point });
  } catch (error: any) {
    console.error('Mercado Pago Preference Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
