// ----------------------------------------------------
// AITUE COMUNICA S.A. - CONTACTOS CENTRALIZADOS POR ÁREA
// ----------------------------------------------------

export const CONTACTS = {
  comercial: {
    id: 'comercial',
    name: 'Gerencia Comercial',
    role: 'Ventas en Cantidad, Cotizaciones y Asesoramiento',
    email: 'susana@aitue.net',
    phone: '+54 9 11 4164-0955',
    phoneLabel: '📞 WhatsApp / Mensajes: +54 9 11 4164-0955',
    waLink: 'https://wa.me/5491141640955',
    hours: 'Atención 24/7',
    areas: ['PRODUCTO_COMERCIAL', 'INTERNET_COMERCIAL', 'B2B', 'VISITA_COMERCIAL'],
    getVCard() {
      return `BEGIN:VCARD\nVERSION:3.0\nN:Comercial;Gerencia - AITUE;;;\nFN:Gerencia Comercial AITUE\nORG:AITUE COMUNICA S.A.\nTEL;type=CELL;type=VOICE;waid=5491141640955:+54 9 11 4164-0955\nEMAIL:susana@aitue.net\nURL:https://aitue.net/\nEND:VCARD`;
    }
  },
  comercial_internacional: {
    id: 'comercial_internacional',
    name: 'Atención Comercial Internacional',
    role: 'Ventas en Cantidad y Asesoría Internacional',
    email: 'alejandro@aitue.net',
    phone: '+54 9 11 6230-0000',
    phoneLabel: '📞 WhatsApp / Mensajes: +54 9 11 6230-0000',
    waLink: 'https://wa.me/5491162300000',
    hours: 'Atención 24/7',
    areas: ['COMERCIAL_INTERNACIONAL'],
    getVCard() {
      return `BEGIN:VCARD\nVERSION:3.0\nN:Internacional;Comercial - AITUE;;;\nFN:Atención Comercial Internacional AITUE\nORG:AITUE COMUNICA S.A.\nTEL;type=CELL;type=VOICE;waid=5491162300000:+54 9 11 6230-0000\nEMAIL:alejandro@aitue.net\nURL:https://aitue.net/\nEND:VCARD`;
    }
  },
  soporte_tecnico: {
    id: 'soporte_tecnico',
    name: 'Atención al Cliente',
    role: 'Atención al Cliente y Consultas Generales',
    email: 'clientes@aitue.net',
    phone: '+54 9 3872 12-7974',
    phoneLabel: '📞 WhatsApp / Mensajes: +54 9 3872 12-7974',
    waLink: 'https://wa.me/5493872127974',
    hours: 'Atención 24/7',
    areas: ['PRODUCTO_TECNICO'],
    getVCard() {
      return `BEGIN:VCARD\nVERSION:3.0\nN:Atencion al Cliente;AITUE;;;\nFN:Atención al Cliente AITUE\nORG:AITUE COMUNICA S.A.\nTEL;type=CELL;type=VOICE;waid=5493872127974:+54 9 3872 12-7974\nEMAIL:clientes@aitue.net\nURL:https://aitue.net/\nEND:VCARD`;
    }
  },
  soporte_red: {
    id: 'soporte_red',
    name: 'Atención al Cliente (Conectividad y Red)',
    role: 'Problemas de Conectividad y Soporte de Red',
    email: 'clientes@aitue.net',
    phone: '+54 9 3872 12-7974',
    phoneLabel: '📞 WhatsApp / Mensajes: +54 9 3872 12-7974',
    waLink: 'https://wa.me/5493872127974',
    hours: 'Atención 24/7',
    areas: ['INTERNET_SOPORTE'],
    getVCard() {
      return `BEGIN:VCARD\nVERSION:3.0\nN:Conectividad y Red;Soporte Satelital - AITUE;;;\nFN:Conectividad y Red AITUE\nORG:AITUE COMUNICA S.A.\nTEL;type=CELL;type=VOICE;waid=5493872127974:+54 9 3872 12-7974\nEMAIL:clientes@aitue.net\nURL:https://aitue.net/\nEND:VCARD`;
    }
  },
  distribuidores: {
    id: 'distribuidores',
    name: 'Atención a Distribuidores y Distribuidoras',
    role: 'Programa y Consultas de Distribuidores',
    email: '',
    phone: '+54 9 11 4164-0955',
    phoneLabel: '📞 WhatsApp / Mensajes: +54 9 11 4164-0955',
    waLink: 'https://wa.me/5491141640955',
    hours: 'Lunes a viernes, 09:00 a 18:00 hs AR',
    areas: ['DISTRIBUIDORES'],
    getVCard() {
      return `BEGIN:VCARD\nVERSION:3.0\nN:Distribuidores;AITUE;;;\nFN:Atención a Distribuidores AITUE\nORG:AITUE COMUNICA S.A.\nTEL;type=CELL;type=VOICE;waid=5491141640955:+54 9 11 4164-0955\nURL:https://aitue.net/\nEND:VCARD`;
    }
  },
  administracion: {
    id: 'administracion',
    name: 'Facturación y Administración',
    role: 'Gestión de Pagos, Comprobantes y Facturación',
    email: 'clientes@aitue.net',
    phone: '',
    phoneLabel: '📧 Email: clientes@aitue.net',
    waLink: '',
    hours: 'Lunes a viernes, 09:00 a 18:00 hs AR',
    areas: ['PAGO'],
    getVCard() {
      return `BEGIN:VCARD\nVERSION:3.0\nN:Facturacion;Administracion - AITUE;;;\nFN:Facturación y Administración AITUE\nORG:AITUE COMUNICA S.A.\nEMAIL:clientes@aitue.net\nURL:https://aitue.net/\nEND:VCARD`;
    }
  },
  envios: {
    id: 'envios',
    name: 'Operativa de Envíos y Despachos',
    role: 'Problemas de Pedidos, Despachos y Mercado Libre',
    email: 'clientes@aitue.net',
    phone: '',
    notifyOnHandoff: false,
    phoneLabel: '📧 Email: clientes@aitue.net',
    waLink: '',
    hours: 'Lunes a viernes, 09:00 a 18:00 hs AR',
    areas: ['ENVIO_MERCADOLIBRE'],
    getVCard() {
      return `BEGIN:VCARD\nVERSION:3.0\nN:Envios;Operativa - AITUE;;;\nFN:Operativa de Envíos AITUE\nORG:AITUE COMUNICA S.A.\nEMAIL:clientes@aitue.net\nURL:https://aitue.net/\nEND:VCARD`;
    }
  },
  operativa: {
    id: 'operativa',
    name: 'Operativa — Canal General',
    role: 'Respaldo y Consultas Generales',
    email: 'clientes@aitue.net',
    phone: '',
    notifyOnHandoff: false,
    phoneLabel: '📧 Email: clientes@aitue.net',
    waLink: '',
    hours: 'Lunes a viernes, 09:00 a 18:00 hs AR',
    areas: ['OPERATIVA'],
    getVCard() {
      return `BEGIN:VCARD\nVERSION:3.0\nN:Operativa;Canal General - AITUE;;;\nFN:Operativa Canal General AITUE\nORG:AITUE COMUNICA S.A.\nEMAIL:clientes@aitue.net\nURL:https://aitue.net/\nEND:VCARD`;
    }
  }
};

export const LINKS = {
  web: 'https://aitue.net/',
  shop: 'https://shop.aitue.net/',
  facebook: 'https://www.facebook.com/aituecomunicasa',
  instagram: 'https://www.instagram.com/aituecomunicasa',
  linkedin: 'https://www.linkedin.com/company/aitue-comunicasa-sa'
};
