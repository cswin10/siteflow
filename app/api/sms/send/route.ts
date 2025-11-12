import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import twilio from 'twilio';

export async function POST(request: Request) {
  try {
    const { recipientId, phoneNumber, message, alertType, relatedToType, relatedToId } =
      await request.json();

    // Verify user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Twilio is configured
    if (
      !process.env.TWILIO_ACCOUNT_SID ||
      !process.env.TWILIO_AUTH_TOKEN ||
      !process.env.TWILIO_PHONE_NUMBER
    ) {
      return NextResponse.json(
        { error: 'Twilio not configured' },
        { status: 500 }
      );
    }

    // Initialize Twilio client
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    // Send SMS
    const twilioMessage = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    // Log to database
    await supabase.from('sms_alerts').insert({
      recipient_id: recipientId,
      phone_number: phoneNumber,
      message,
      alert_type: alertType,
      related_to_type: relatedToType,
      related_to_id: relatedToId,
      twilio_sid: twilioMessage.sid,
      status: twilioMessage.status === 'queued' || twilioMessage.status === 'sent' ? 'sent' : 'failed',
      sent_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      sid: twilioMessage.sid,
      status: twilioMessage.status,
    });
  } catch (error: unknown) {
    console.error('SMS send error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send SMS' },
      { status: 500 }
    );
  }
}
