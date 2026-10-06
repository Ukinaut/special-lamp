// ----------------------------------------------------
// AITUE COMUNICA S.A. - META WHATSAPP OFFICIAL CLOUD API MODULE
// ----------------------------------------------------
import express from 'express';

// Meta Cloud API Credentials from Environment Variables
const WA_CLOUD_PHONE_NUMBER_ID = process.env.WA_CLOUD_PHONE_NUMBER_ID || '';
const WA_CLOUD_ACCESS_TOKEN = process.env.WA_CLOUD_ACCESS_TOKEN || '';
const WA_CLOUD_VERIFY_TOKEN = process.env.WA_CLOUD_VERIFY_TOKEN || 'aitue_cloud_api_secret_token';
const WA_CLOUD_API_VERSION = process.env.WA_CLOUD_API_VERSION || 'v21.0';

/**
 * Send message via Official Meta WhatsApp Cloud API
 * @param {string} toPhone Target phone number in E.164 format (e.g. 5491123456789)
 * @param {object|string} content Text message string or message payload object
 */
export async function sendCloudApiMessage(toPhone, content) {
  if (!WA_CLOUD_PHONE_NUMBER_ID || !WA_CLOUD_ACCESS_TOKEN) {
    console.warn('[Cloud API] Faltan credenciales WA_CLOUD_PHONE_NUMBER_ID o WA_CLOUD_ACCESS_TOKEN en .env');
    return { success: false, error: 'Faltan credenciales WA_CLOUD_PHONE_NUMBER_ID o WA_CLOUD_ACCESS_TOKEN en el archivo .env' };
  }

  const cleanPhone = String(toPhone).replace(/\+/g, '').trim();
  const url = `https://graph.facebook.com/${WA_CLOUD_API_VERSION}/${WA_CLOUD_PHONE_NUMBER_ID}/messages`;

  const payload = typeof content === 'string' ? {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'text',
    text: { preview_url: true, body: content }
  } : {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    ...content
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WA_CLOUD_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('[Cloud API Send Error]:', data);
      return { success: false, error: data };
    }

    console.log(`[Cloud API Sent] Mensaje enviado exitosamente a ${cleanPhone}`);
    return { success: true, data };
  } catch (err) {
    console.error('[Cloud API Fetch Error]:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Factory function creating a fully configured Express Router for Meta Cloud API
 * @param {Function} messageHandler Function (phone, text, rawMsg) => Promise<string|null>
 */
export function createCloudApiRouter(messageHandler) {
  const router = express.Router();

  // Root status info for Cloud API
  router.get('/', (req, res) => {
    res.json({
      service: 'AITUE Meta WhatsApp Official Cloud API',
      configured: Boolean(WA_CLOUD_PHONE_NUMBER_ID && WA_CLOUD_ACCESS_TOKEN),
      phoneNumberId: WA_CLOUD_PHONE_NUMBER_ID ? 'Configurado' : 'Pendiente en .env',
      verifyTokenConfigured: Boolean(WA_CLOUD_VERIFY_TOKEN),
      apiVersion: WA_CLOUD_API_VERSION
    });
  });

  // GET /webhook - Meta Webhook Verification
  router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === WA_CLOUD_VERIFY_TOKEN) {
      console.log('[Cloud API Webhook] Webhook verificado correctamente por Meta.');
      return res.status(200).send(challenge);
    }

    // If accessed directly via browser without query params, return friendly info
    if (!mode && !token && !challenge) {
      return res.json({
        status: 'Active',
        endpoint: 'Meta WhatsApp Official Cloud API Webhook',
        instruction: 'Este endpoint recibe solicitudes GET de verificación y POST de eventos desde los servidores de Meta WhatsApp Cloud API.'
      });
    }

    console.warn('[Cloud API Webhook] Fallo en la verificación del token de webhook.');
    return res.status(403).json({ error: 'Fallo en la verificación del token de webhook' });
  });

  // POST /webhook - Meta Incoming Webhook Message Event Listener
  router.post('/webhook', async (req, res) => {
    res.status(200).send('EVENT_RECEIVED');

    try {
      const body = req.body;
      if (body?.object !== 'whatsapp_business_account') return;

      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;

      if (!value || !value.messages || value.messages.length === 0) return;

      const message = value.messages[0];
      const fromPhone = message.from;
      const messageType = message.type;

      let textContent = '';
      if (messageType === 'text') {
        textContent = message.text?.body || '';
      } else if (messageType === 'button') {
        textContent = message.button?.text || '';
      } else if (messageType === 'interactive') {
        textContent = message.interactive?.list_reply?.title || message.interactive?.button_reply?.title || '';
      }

      if (!textContent) return;

      console.log(`[Cloud API Incoming] Mensaje de ${fromPhone}: "${textContent}"`);

      if (typeof messageHandler === 'function') {
        const botResponse = await messageHandler(fromPhone, textContent, message);
        if (botResponse) {
          await sendCloudApiMessage(fromPhone, botResponse);
        }
      }
    } catch (err) {
      console.error('[Cloud API Webhook Exception]:', err);
    }
  });

  // POST /send - Manual send endpoint
  router.post('/send', async (req, res) => {
    const { to, message } = req.body || {};
    if (!to || !message) {
      return res.status(400).json({ error: 'Parámetros "to" y "message" son requeridos.' });
    }
    const result = await sendCloudApiMessage(to, message);
    res.status(result.success ? 200 : 500).json(result);
  });

  return router;
}

export default createCloudApiRouter;
