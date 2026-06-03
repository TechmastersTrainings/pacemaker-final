import { NextResponse } from 'next/server';
import axios from 'axios';

// Global cache to persist OTPs across Hot Module Replacements (HMR)
const globalForOtp = global as unknown as {
  otpCache?: Record<string, { code: string; expires: number }>;
};

if (!globalForOtp.otpCache) {
  globalForOtp.otpCache = {};
}
const otpCache = globalForOtp.otpCache;

export async function POST(request: Request) {
  try {
    const { action, mobileNumber, otpCode } = await request.json();

    if (!mobileNumber || mobileNumber.length !== 10) {
      return NextResponse.json({ success: false, message: 'Invalid 10-digit mobile number' }, { status: 400 });
    }

    // --- ACTION: SEND ---
    if (action === 'send') {
      // Generate a dynamic 6-digit random code
      const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Cache with 5 minutes expiry
      otpCache[mobileNumber] = {
        code: generatedCode,
        expires: Date.now() + 5 * 60 * 1000
      };

      const fast2smsKey = process.env.FAST2SMS_API_KEY;
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioToken = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_PHONE_NUMBER;

      let sent = false;
      let gatewayMessage = '';

      // 1. Try Fast2SMS (Highly recommended for direct Indian OTPs)
      if (fast2smsKey) {
        try {
          const response = await axios.post('https://www.fast2sms.com/dev/bulkV2', {
            variables_values: generatedCode,
            route: 'otp',
            numbers: mobileNumber
          }, {
            headers: {
              'authorization': fast2smsKey,
              'Content-Type': 'application/json'
            }
          });
          if (response.data && response.data.return === true) {
            sent = true;
            gatewayMessage = 'Real SMS successfully dispatched via Fast2SMS.';
          } else {
            gatewayMessage = `Fast2SMS response: ${JSON.stringify(response.data)}`;
          }
        } catch (err: any) {
          gatewayMessage = `Fast2SMS Error: ${err.message}`;
        }
      } 
      // 2. Try Twilio
      else if (twilioSid && twilioToken && twilioFrom) {
        try {
          const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
          const authString = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');
          
          const params = new URLSearchParams();
          params.append('To', `+91${mobileNumber}`);
          params.append('From', twilioFrom);
          params.append('Body', `Your PaceMaker Medical verification code is: ${generatedCode}. Valid for 5 minutes.`);

          const response = await axios.post(twilioUrl, params.toString(), {
            headers: {
              'Authorization': `Basic ${authString}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });

          if (response.status === 201 || response.status === 200) {
            sent = true;
            gatewayMessage = 'Real SMS successfully dispatched via Twilio.';
          }
        } catch (err: any) {
          gatewayMessage = `Twilio Error: ${err.message}`;
        }
      }

      if (sent) {
        return NextResponse.json({
          success: true,
          sent: true,
          message: gatewayMessage
        });
      } else {
        // Fallback: If no real keys are set, return the code to the client
        // so they can enter it to simulate a secure, correct verification!
        return NextResponse.json({
          success: true,
          sent: false,
          code: generatedCode, // Hand over dynamic code for local evaluation
          message: gatewayMessage || 'Add FAST2SMS_API_KEY or Twilio keys in .env.local for cellular delivery.'
        });
      }
    }

    // --- ACTION: VERIFY ---
    if (action === 'verify') {
      const record = otpCache[mobileNumber];
      
      if (!record) {
        return NextResponse.json({ success: false, message: 'No OTP generated for this number. Please request one.' });
      }

      if (Date.now() > record.expires) {
        delete otpCache[mobileNumber];
        return NextResponse.json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }

      if (record.code !== otpCode) {
        return NextResponse.json({ success: false, message: 'Incorrect OTP code. Please enter the correct code.' });
      }

      // Successful verification
      delete otpCache[mobileNumber];
      return NextResponse.json({ success: true, message: 'OTP verified successfully.' });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
