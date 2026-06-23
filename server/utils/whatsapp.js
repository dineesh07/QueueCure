export const sendWhatsApp = async (phone, message) => {
  const phoneId = process.env.WA_PHONE_ID;
  const token = process.env.WA_TOKEN;

  if (!phoneId || !token) {
    console.log(`[MOCK WHATSAPP] To: ${phone}, Message: "${message}" (Meta Cloud API credentials missing)`);
    return;
  }

  try {
    const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phone.startsWith('+') ? phone.replace('+', '') : `91${phone}`,
        type: 'text',
        text: { body: message }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[WHATSAPP ERROR]', data);
    } else {
      console.log(`[WHATSAPP SENT] To: ${phone}, Message: "${message}"`);
    }
  } catch (error) {
    console.error('[WHATSAPP EXCEPTION]', error);
  }
};
