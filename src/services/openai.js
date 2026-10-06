let serverConfig = null;

// ----------------------------------------------------
// AITUE COMUNICA S.A. - OpenAI & Chatbots Service
// ----------------------------------------------------

import { KnowledgeService } from './knowledge.js';
import { SYSTEM_PROMPT } from '../../server/protocols.js';

const STORAGE_KEY = 'aitue_openai_config_v2';
const CHAT_LOGS_KEY = 'aitue_chat_logs';

const OFFICIAL_SYSTEM_PROMPT = SYSTEM_PROMPT;

const DEFAULT_CONFIG = {
  apiKey: '',
  organizationId: '',
  baseUrl: '',
  model: 'gpt-5.6-luna',
  temperature: 0.5,
  maxTokens: 300,
  assistantSystemPrompt: OFFICIAL_SYSTEM_PROMPT,
  wpSystemPrompt: OFFICIAL_SYSTEM_PROMPT,
  wpStatus: 'active',
  wpTriggers: [
    { keyword: 'cotizar', response: 'Para consultas sobre precios, presupuestos y propuestas comerciales, podés comunicarte con Gerencia Comercial al 📧 comercial@aitue.net o 📞 +54 9 11 4164-0955 (Atención 24/7).' },
    { keyword: 'starlink', response: 'AITUE ofrece soluciones 360° desarrolladas para proteger, integrar y adaptar equipos Starlink Mini y Mini X (Aitue Standard, Aitue Pro, Ultra+). Podés ver más en https://shop.aitue.net/.' },
    { keyword: 'soporte', response: 'Para soporte técnico podés contactar a Servicio de Soporte Técnico en 📧 laboratorio@aitue.net / 📧 desarrollo@aitue.net (📞 +54 9 11 7358-3768 / 📞 +54 9 3875 01-4000) con atención 24/7.' }
  ]
};

export class OpenAIService {
  static getConfig() { return { ...DEFAULT_CONFIG, ...(serverConfig || {}), apiKey: '', whisperApiKey: '' }; }
  static async loadConfig() {
    // Remove keys left by older versions; secrets are now stored only on the server.
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem('aitue_whisper_key'); } catch {}
    const res = await fetch('/api/config/knowledge');
    if (!res.ok) throw new Error('No se pudo cargar la configuración del servidor.');
    const data = await res.json();
    serverConfig = { ...data, wpSystemPrompt: data.systemPrompt, assistantSystemPrompt: data.assistantSystemPrompt || data.systemPrompt };
    return this.getConfig();
  }
  static async saveConfig(config) {
    const res = await fetch('/api/config/settings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar la configuración.');
    await this.loadConfig();
    return true;
  }

  static getLogs() {
    try {
      const saved = localStorage.getItem(CHAT_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  }

  static logInteraction(source, userMsg, botReply) {
    try {
      const logs = this.getLogs();
      logs.unshift({
        id: Date.now(),
        timestamp: new Date().toISOString(),
        source,
        userMsg,
        botReply
      });
      if (logs.length > 100) logs.pop();
      localStorage.setItem(CHAT_LOGS_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Error saving log:', e);
    }
  }

  static getEndpointUrl(config) {
    const key = (config?.apiKey || '').trim();
    if (config?.baseUrl && config.baseUrl.trim()) {
      return config.baseUrl.trim().replace(/\/+$/, '') + '/chat/completions';
    }
    if (key.startsWith('nvapi-')) {
      return 'https://integrate.api.nvidia.com/v1/chat/completions';
    }
    return 'https://api.openai.com/v1/chat/completions';
  }

  static async testConnection(apiKey, model) {
    const res = await fetch('/api/config/test', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ apiKey, model })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo verificar la conexión.');
    return true;
  }

  static async sendMessage(userMessage, systemPromptType = 'assistant', historyMessages = []) {
    const config = this.getConfig();

    try {
      const backendUrl = '/api/chat';
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const sessionRes = await fetch('/api/web-assistant/session', { method: 'POST' });
      if (!sessionRes.ok) throw new Error('No se pudo iniciar el chat.');
      const { sessionId } = await sessionRes.json();
      const serverRes = await fetch(backendUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage, sessionId, systemPromptType }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (serverRes.ok) {
        const data = await serverRes.json();
        if (data.reply) {
          this.logInteraction(systemPromptType === 'whatsapp' ? 'whatsapp_bot' : 'virtual_assistant', userMessage, data.reply);
          return data.reply;
        }
      }
    } catch (e) {
      console.log('Servidor backend wp-server no accesible, utilizando IA directa o motor RAG fallback local:', e.message);
    }

    const baseSystemPrompt = systemPromptType === 'whatsapp'
      ? config.wpSystemPrompt
      : config.assistantSystemPrompt;

    const knowledgeContext = KnowledgeService.getKnowledgeContext(userMessage);
    const fullSystemPrompt = `${baseSystemPrompt}\n\n${knowledgeContext}`;

    const fallbackReply = this.cleanDuplicateContacts(this.getFallbackReply(userMessage, systemPromptType));
    this.logInteraction(systemPromptType === 'whatsapp' ? 'whatsapp_bot' : 'virtual_assistant', userMessage, fallbackReply);
    return fallbackReply;
  }

  static cleanDuplicateContacts(rawText) {
    if (!rawText) return rawText;
    let text = rawText.trim();

    // Deduplicar contacto de Gerencia Comercial
    const susanaMatches = text.match(/comercial@aitue\.net/gi);
    if (susanaMatches && susanaMatches.length > 1) {
      const comercialBlock = `💼 **Gerencia Comercial**\n📧 comercial@aitue.net | 📞 +54 9 11 4164-0955 (Atención 24/7)`;
      text = text.replace(/(?:💼[^\n]*Gerencia Comercial[^\n]*\n?|📧\s*comercial@aitue\.net[^\n]*\n?|📞\s*\+54 9 11 4164-0955[^\n]*\n?)+/gi, '\n__COMER_MARKER__\n');
      text = text.replace(/(?:__COMER_MARKER__\s*)+/g, `\n${comercialBlock}\n`).trim();
    }

    // Deduplicar contacto de Facturación y Administración
    const davidMatches = text.match(/clientes@aitue\.net/gi);
    if (davidMatches && davidMatches.length > 2) {
      const davidBlock = `📄 **Facturación y Administración**\n📧 clientes@aitue.net (Lunes a viernes, de 09:00 a 18:00 hs AR)`;
      text = text.replace(/(?:📄[^\n]*Facturación y Administración[^\n]*\n?|📧\s*clientes@aitue\.net[^\n]*\n?)+/gi, '\n__ADMIN_MARKER__\n');
      text = text.replace(/(?:__ADMIN_MARKER__\s*)+/g, `\n${davidBlock}\n`).trim();
    }

    return text;
  }

  static getFallbackReply(userMessage, type = 'assistant') {
    const text = userMessage.toLowerCase().trim();
    const config = this.getConfig();

    if (type === 'whatsapp' && config.wpTriggers) {
      for (const trigger of config.wpTriggers) {
        if (trigger.keyword && text.includes(trigger.keyword.toLowerCase())) {
          return trigger.response;
        }
      }
    }

    if (text.includes('hello') || text.includes('hi ') || text === 'hi' || text.includes('hey') || text.includes('english')) {
      return `👋 Hi! Welcome to AITUE COMUNICA S.A. 🛰️📡\nWe offer 360° solutions for Starlink Mini and Mini X equipment and satellite internet access.\nTell us what you need and we will help you.`;
    }
    if (text.includes('ola') || text.includes('olá') || text.includes('bom dia') || text.includes('portugues')) {
      return `👋 Olá! Bem-vindo ao mundo AITUE COMUNICA S.A. 🛰️📡\nSomos uma empresa de Soluções Globais em Telecomunicações que oferece soluções 360° para equipamentos Starlink Mini e Mini X.\nConte-nos o que você precisa e nós o ajudaremos.`;
    }

    if (text.includes('[audio]') || text.includes('[imagen]') || text.includes('[video]') || text.includes('[archivo]')) {
      return "Por favor, escribí tu consulta o describí el contenido por texto para que podamos ayudarte.";
    }

    if (text.includes('gracias') || text.includes('adios') || text.includes('adiós') || text.includes('chau') || text.includes('hasta luego')) {
      return "¡Gracias por comunicarte con AITUE! 🛰️ Esperamos haberte ayudado con tu consulta. Seguimos conectados. Si ves el cielo, estamos. 📡";
    }

    if (text.includes('pedido') || text.includes('pedidos') || text.includes('envio') || text.includes('envío') || text.includes('despacho') || text.includes('seguimiento') || text.includes('mercado libre')) {
      return "📦 Operativa de Envíos y Despachos\n📧 clientes@aitue.net (Lun-Vie 09:00 a 18:00 hs AR)";
    }

    if (text.includes('distribuidor') || text.includes('distribuidores') || text.includes('distribuidora') || text.includes('distribuidoras')) {
      return "Para consultas sobre el programa de distribuidores o distribuidoras, podés escribir a:\n\n🏢 Atención a Distribuidores y Distribuidoras\n📧 facturacion@aitue.net (Lun-Vie 09:00 a 18:00 hs AR)";
    }

    if (text.includes('que es aitue') || text.includes('qué es aitue') || text.includes('quienes son') || text.includes('quiénes son')) {
      return "🛰️ AITUE COMUNICA S.A. es una empresa líder especializada en soluciones de conectividad satelital en movimiento.\n\nSi ves el cielo, estamos.\n\n🌐 https://aitue.net/";
    }

    if (text.includes('visita') || text.includes('visitar') || text.includes('presencial') || text.includes('oficina') || text.includes('showroom')) {
      return "Para consultar sobre la posibilidad de realizar una visita presencial, podés comunicarte con Susana en Gerencia Comercial:\n\n💼 Gerencia Comercial — Susana\n📧 susana@aitue.net | 📞 +54 9 11 4164-0955 (Atención 24/7)\n🌐 https://aitue.net/";
    }

    if (text.includes('activar') || text.includes('activación') || text.includes('desactivar') || text.includes('sin señal') || text.includes('ya pague')) {
      return "Para activaciones de antena, problemas técnicos o conectividad del servicio satelital, comunicate con:\n\n📡 Atención al Cliente — Conectividad y Red\n📧 clientes@aitue.net | 📞 +54 9 3872 12-7974 (Atención 24/7)";
    }

    if (text.includes('internet') || text.includes('satelital') || text.includes('contratar') || text.includes('plan')) {
      return "Para solicitar información, planes y cotizaciones sobre nuestros servicios de acceso a Internet vía satélite, contactá a Susana en Gerencia Comercial:\n\n💼 Gerencia Comercial — Susana\n📧 susana@aitue.net | 📞 +54 9 11 4164-0955 (Atención 24/7)";
    }

    if (text.includes('factura') || text.includes('facturación') || text.includes('comprobante') || text.includes('problema de pago')) {
      return "Si tenés un inconveniente con un pago o facturación, podés comunicarte con:\n\n📄 Facturación y Administración\n📧 clientes@aitue.net (Lun-Vie 09:00 a 18:00 hs AR)";
    }

    if (text.includes('v2') || text.includes('starlink v2') || text.includes('cotizar') || text.includes('precio') || text.includes('comprar')) {
      return "Para consultas sobre precios, presupuestos, cotización, compras o asesoría, contactá a Susana en Gerencia Comercial:\n\n💼 Gerencia Comercial — Susana\n📧 susana@aitue.net | 📞 +54 9 11 4164-0955 (Atención 24/7)\n🛒 Tienda: https://shop.aitue.net/";
    }

    if (text.includes('se rompio') || text.includes('roto') || text.includes('falla') || text.includes('no funciona') || text.includes('cable')) {
      return "Si tenés una falla técnica, cable o accesorio dañado en tu equipo AITUE, contactá a:\n\n🛠️ Atención al Cliente — Técnico y Productos\n📧 clientes@aitue.net | 📞 +54 9 11 7358-3768 (Atención 24/7)";
    }

    return "Lo sentimos, no contamos con información suficiente para responder esa consulta con precisión. Podés ampliar un poco más qué necesitás y te ayudamos a encontrar el área indicada.";
  }
}
