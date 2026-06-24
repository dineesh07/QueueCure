export const sendWhatsApp = async (phone, message) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

  if (!accountSid || !authToken) {
    console.log(`[MOCK TWILIO] To: ${phone}, Message: "${message}" (Twilio credentials missing)`);
    return;
  }

  // Format phone number to match Twilio's required format (+91XXXXXXXXXX)
  let formattedPhone = phone;
  if (!formattedPhone.startsWith('+')) {
    formattedPhone = `+91${formattedPhone}`;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const params = new URLSearchParams();
    params.append('To', `whatsapp:${formattedPhone}`);
    params.append('From', fromNumber);
    params.append('Body', message);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[TWILIO ERROR]', data);
    } else {
      console.log(`[TWILIO SENT] To: ${formattedPhone}, Message: "${message}"`);
    }
  } catch (error) {
    console.error('[TWILIO EXCEPTION]', error);
  }
};
