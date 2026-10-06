// ----------------------------------------------------
// AITUE COMUNICA S.A. - ÁREAS CORPORATIVAS Y REGLAS DE NEGOCIO POR ÁREA
// ----------------------------------------------------

import { CONTACTS, LINKS } from './contacts.js';
import { PROTOCOLS } from './protocols.js';

export const AREAS = {
  PRODUCTO_INFO: {
    id: 'PRODUCTO_INFO',
    name: 'Productos',
    objective: 'El cliente quiere conocer las líneas propias Aitue Standard, Aitue Pro y Ultra+, compatibles con terminales Starlink Mini y Mini X.',
    triggers: [
      'qué productos tienen', 'que productos tienen', 'qué es aitue standard', 'qué es aitue pro',
      'qué es ultra+', 'qué accesorios existen', 'para qué sirve', 'características',
      'qué soluciones tienen', 'quiero ver productos', 'accesorios',
      'quiero saber sobre el standard', 'quiero saber sobre el pro', 'quiero saber sobre el ultra+',
      'quiero saber sobre el modelo standard', 'quiero saber sobre el modelo pro', 'quiero saber sobre el modelo ultra+','qué es aitue modelo standard', 'qué es aitue modelo pro', 'qué es aitue modelo ultra+','qué es aitue standard', 'qué es aitue pro', 'quiero saber del modelo Aitue Pro', 'quiero saber del modelo Aitue Standard','quiero saber del modelo Aitue Ultra+'
    ],
    exclusions: ['comprar', 'precio', 'cotización', 'asesoramiento', 'se rompió', 'falla', 'roto'],
    responsible: [CONTACTS.comercial],
    action: 'DERIVE_TO_COMMERCIAL',
    priority: 8,
    baseResponse: 'El modelo "AITUE [MODELO]" ofrece [descripción general del producto], [beneficio clave 1], [beneficio clave 2] y [beneficio clave 3].\n\nCaracterísticas principales:\n- [Característica principal 1]\n- [Característica principal 2]\n- [Característica principal 3]\n\nIdeal para: [tipo de instalación o uso ideal]\n\nIncluye: [componentes / accesorios / protecciones incluidos]\n\nSi querés, te lo puedo explicar con más detalle para [uso fijo / móvil / integración avanzada].',
    relatedLinks: [LINKS.shop]
  },
  PRODUCTO_COMERCIAL: {
    id: 'PRODUCTO_COMERCIAL',
    name: 'Ventas en Cantidad y Asesoramiento (Gerencia Comercial)',
    objective: 'El cliente quiere ventas en cantidad, cotización, comprar, conocer precio, disponibilidad o propuesta comercial.',
    triggers: [
      'precio', 'cuánto cuesta', 'cuanto cuesta', 'cotización', 'cotizacion', 'presupuesto',
      'quiero comprar', 'disponibilidad', 'quiero uno',
      'asesoramiento comercial', 'propuesta comercial', 'ventas', 'ventas en cantidad',
      'starlink v2', 'v2', 'tienen v2', 'quiero saber si tienen v2', 'saber si tienen', 'tienen el', 'tienen la', 'tienen disponible', 'venden'
    ],
    exclusions: ['se rompió', 'falla', 'roto', 'no funciona', 'no tengo internet', 'internacional'],
    responsible: [CONTACTS.comercial],
    action: 'DERIVE_TO_COMMERCIAL',
    priority: 3,
    baseResponse: 'Para ventas en cantidad, cotizaciones, compras o asesoramiento, podés comunicarte con Gerencia Comercial:\n\n💼 Gerencia Comercial\n📧 ' + CONTACTS.comercial.email + ' | 📞 WhatsApp / Mensajes: +54 9 11 4164-0955 (Atención 24/7)\n\n🛒 Tienda oficial: ' + LINKS.shop,
    relatedLinks: [LINKS.shop]
  },
  COMERCIAL_INTERNACIONAL: {
    id: 'COMERCIAL_INTERNACIONAL',
    name: 'Atención Comercial Internacional',
    objective: 'El cliente solicita ventas en cantidad o asesoría comercial internacional.',
    triggers: [
      'internacional', 'ventas internacional', 'asesoria internacional', 'asesoría internacional',
      'compra internacional', 'desde el exterior', 'fuera de argentina', 'exportacion', 'exportación',
      'chile', 'uruguay', 'paraguay', 'brasil', 'bolivia', 'peru', 'colombia', 'mexico', 'españa',
      'estados unidos', 'eeuu', 'usa', 'exterior', 'afuera', 'fuera del pais', 'fuera del país',
      'dolares', 'dólares', 'usd', 'euros', 'paypal', 'wire transfer', 'transferencia internacional'
    ],
    exclusions: [],
    responsible: [CONTACTS.comercial_internacional],
    action: 'DERIVE_TO_INTERNATIONAL',
    priority: 2.5,
    baseResponse: 'Para ventas en cantidad o asesoría comercial internacional, podés comunicarte con Atención Comercial Internacional:\n\n💼 Atención Comercial Internacional\n📧 ' + CONTACTS.comercial_internacional.email + ' | 📞 WhatsApp / Mensajes: +54 9 11 6230-0000 (Atención 24/7)',
    relatedLinks: [LINKS.shop]
  },
  PRODUCTO_TECNICO: {
    id: 'PRODUCTO_TECNICO',
    name: 'Soporte Técnico y Productos',
    objective: 'El cliente reporta un problema técnico, consulta técnica, falla de conectividad o problema con un producto/cable.',
    triggers: [
      'se rompió', 'se rompio', 'roto', 'se dañó', 'se daño', 'no funciona', 'dejó de funcionar',
      'falla', 'está fallando', 'no prende', 'no alimenta', 'cable roto', 'cable de alimentación dañado',
      'accesorio roto', 'gabinete con problema', 'fijación dañada', 'problema de instalación',
      'configuración', 'diagnóstico', 'falla de producto', 'consulta técnica', 'problemas técnicos', 'problemas de conectividad'
    ],
    exclusions: ['quiero comprar un cable', 'precio de cable', 'cuanto cuesta el cable', 'comprar un soporte', 'quiero comprar un soporte', 'precio del soporte', 'quiero comprar un gabinete', 'precio del gabinete', 'asesoramiento', 'quiero comprar', 'precio', 'cotización', 'cotizacion', 'presupuesto'],
    responsible: [CONTACTS.soporte_tecnico],
    action: 'DERIVE_TO_TECH_SUPPORT',
    priority: 1,
    baseResponse: `Para comunicarte con Atención al Cliente, podés escribir directamente por WhatsApp:\n\n📞 ${CONTACTS.soporte_tecnico.phone}`,
    relatedLinks: []
  },
  INTERNET_COMERCIAL: {
    id: 'INTERNET_COMERCIAL',
    name: 'Internet Vía Satélite (Comercial)',
    objective: 'El cliente quiere información, precio, contratación, cotización o disponibilidad del servicio de Internet vía satélite.',
    triggers: [
      'quiero internet', 'quiero contratar', 'contratación', 'contratacion', 'precio internet',
      'cuánto cuesta internet', 'cotización internet', 'información del servicio', 'disponibilidad internet',
      'planes', 'servicio vía satélite', 'contratar para mi empresa', 'contratar para vehículo'
    ],
    exclusions: ['activar', 'desactivar', 'sin internet', 'no tengo internet', 'problema de red', 'problema de señal'],
    responsible: [CONTACTS.comercial],
    action: 'DERIVE_TO_INTERNET_COMMERCIAL',
    priority: 4,
    baseResponse: 'Para solicitar información, planes y cotizaciones sobre nuestros servicios de acceso a Internet vía satélite, podés contactar a Gerencia Comercial:\n\n💼 Gerencia Comercial\n📧 susana@aitue.net | 📞 WhatsApp / Mensajes: +54 9 11 4164-0955 (Atención 24/7)\n\n🌐 Conocé más sobre AITUE en ' + LINKS.web,
    relatedLinks: [LINKS.web]
  },
  INTERNET_SOPORTE: {
    id: 'INTERNET_SOPORTE',
    name: 'Internet Vía Satélite (Soporte y Conectividad)',
    objective: 'El cliente consulta por problemas técnicos, conectividad, problemas de internet, consumo de datos, activación o desactivación.',
    triggers: [
      'activar', 'activación', 'activacion', 'actibar', 'aktivar', 'actibacion',
      'desactivar', 'desactivación', 'desactivacion', 'desactibar', 'desaktivar',
      'baja', 'basja', 'vaja', 'vasja', 'cancelar', 'cancelacion', 'pausar', 'suspender',
      'ayuda para activar', 'ayuda activar', 'activar mi antena', 'activar antena',
      'no tengo internet', 'no funciona internet', 'problema de conexión', 'problema de red',
      'problema de señal', 'servicio caído', 'soporte de red', 'problema con el servicio',
      'conexion de mi antena', 'conexion de la antena', 'conectividad de mi antena', 'conectividad de la antena',
      'problemas con la conexion', 'problemas con la conexión', 'problema de conectividad', 'conectividad antena', 'conexion antena',
      'conectividad', 'internet', 'conectividad a internet', 'consumo de datos', 'consumo', 'interrupcion de conectividad', 'interrupcion'
    ],
    exclusions: ['quiero contratar', 'cuanto cuesta internet', 'planes de internet'],
    responsible: [CONTACTS.soporte_tecnico],
    action: 'DERIVE_TO_INTERNET_SUPPORT',
    priority: 2,
    baseResponse: `Para problemas de conectividad, técnicos, activación o soporte de red satelital, comunicate con Atención al Cliente:\n\n📡 Atención al Cliente — Conectividad y Red\n📞 WhatsApp / Mensajes: ${CONTACTS.soporte_tecnico.phone} (Atención 24/7)`,
    relatedLinks: []
  },
  DISTRIBUIDORES: {
    id: 'DISTRIBUIDORES',
    name: 'Atención a Distribuidores y Distribuidoras',
    objective: 'El cliente consulta por ser distribuidor, distribuidora o programa de distribución.',
    triggers: [
      'distribuidor', 'distribuidores', 'distribuidora', 'distribuidoras', 'quiero ser distribuidor',
      'venta mayorista distribuidor', 'programa de distribuidores'
    ],
    exclusions: [],
    responsible: [CONTACTS.distribuidores],
    action: 'DERIVE_TO_DISTRIBUTORS',
    priority: 4.5,
    baseResponse: 'Atención a Distribuidores y Distribuidoras revisará tu consulta y se pondrá en contacto con vos.',
    relatedLinks: [LINKS.web]
  },
  PAGO: {
    id: 'PAGO',
    name: 'Pagos',
    objective: 'El cliente solicita documentación de una compra o consulta por una operación de pago.',
    triggers: [
      'problema con pago', 'pago rechazado', 'pago no acreditado', 'inconveniente al pagar',
      'error de pago', 'comprobante de pago', 'no aparece el pago', 'pagos', 'quiero el comprobante de pago', 'quiero el comprobante de la transferencia', 'quiero el comprobante de la transacción', 'quiero la factura de la compra', 'quiero el comprobante de compra', 'remito', 'remitos', 'remito de compra'
    ],
    exclusions: ['quiero pagar para comprar', 'cuanto cuesta'],
    responsible: [CONTACTS.administracion],
    action: 'DERIVE_TO_PAYMENTS',
    priority: 6,
    baseResponse: 'Para gestiones de pago, verificación de transferencias o facturación, una persona de nuestro equipo continuará la atención por este chat.',
    relatedLinks: []
  },
  ENVIO_MERCADOLIBRE: {
    id: 'ENVIO_MERCADOLIBRE',
    name: 'Envíos, Despachos y Mercado Libre',
    objective: 'El cliente consulta por problemas de pedidos, despachos, entregas o compras en Mercado Libre.',
    triggers: [
      'envío', 'envio', 'entrega', 'seguimiento', 'despacho', 'despachos', 'pedido', 'pedidos', 'no llegó', 'no llego',
      'dónde está mi pedido', 'donde esta mi pedido', 'mercado libre', 'mercadolibre', 'problemas de pedidos'
    ],
    exclusions: ['cuanto cuesta el envio'],
    responsible: [CONTACTS.envios],
    action: 'DERIVE_TO_SHIPPING',
    priority: 5,
    baseResponse: '📦 Operativa de Envíos y Despachos\n📧 clientes@aitue.net (Lunes a viernes, 09:00 a 18:00 hs AR)',
    relatedLinks: []
  },
  B2B: {
    id: 'B2B',
    name: 'Empresas / Flotas / B2B',
    objective: 'El cliente representa una empresa, flota o compra en volumen y busca una solución comercial corporativa.',
    triggers: [
      'empresa', 'flota', 'varios vehículos', 'varias camionetas', 'varias unidades',
      'compra en volumen', 'minería', 'mineria', 'proyecto corporativo', 'implementación empresarial', 'b2b'
    ],
    exclusions: [],
    responsible: [CONTACTS.comercial],
    action: 'DERIVE_TO_B2B',
    priority: 7,
    baseResponse: 'Para proyectos corporativos, soluciones integrales para flotas vehiculares o compras institucionales en volumen, nuestra Gerencia Comercial brindará atención personalizada:\n\n💼 Gerencia Comercial\n📧 susana@aitue.net | 📞 WhatsApp / Mensajes: +54 9 11 4164-0955 (Atención 24/7)\n\n🌐 Portal Corporativo: ' + LINKS.web,
    relatedLinks: [LINKS.web]
  },
  VISITA_COMERCIAL: {
    id: 'VISITA_COMERCIAL',
    name: 'Visita Comercial',
    objective: 'El cliente quiere visitar AITUE o conocer productos personalmente.',
    triggers: [
      'visita', 'visitar', 'conocer oficina', 'ir presencialmente', 'conocer los productos en persona',
      'visita presencial', 'ir a ver aitue', 'pasar por ahi', 'pasar por la empresa', 'pasar por el local'
    ],
    exclusions: [],
    responsible: [CONTACTS.comercial],
    action: 'DERIVE_TO_COMMERCIAL',
    priority: 7.5,
    get baseResponse() { return PROTOCOLS.VISITA_PRESENCIAL; },
    relatedLinks: [LINKS.web]
  },
  UBICACION_GENERAL: {
    id: 'UBICACION_GENERAL',
    name: 'Presencia Internacional y Ubicación',
    objective: 'El cliente consulta sobre la ubicación, sedes, presencia o dónde se encuentra AITUE.',
    triggers: [
      'donde estan ubicados', 'donde estan', 'donde quedan', 'donde estan las sedes',
      'ubicación', 'ubicacion', 'sedes', 'donde se encuentran', 'donde stan', 'direccion', 'calle'
    ],
    exclusions: ['visitar', 'visita', 'ir presencialmente', 'ir a la oficina', 'ir a ver'],
    responsible: null,
    action: 'SEND_UBICACION_INFO',
    priority: 8.5,
    get baseResponse() { return PROTOCOLS.UBICACION_GENERAL; },
    relatedLinks: [LINKS.web]
  },
  EMPRESA_INFO: {
    id: 'EMPRESA_INFO',
    name: 'Información Institucional y Sitio Web',
    objective: 'El cliente quiere conocer AITUE, qué hace, qué ofrece, su página web oficial o información institucional.',
    triggers: [
      'qué es aitue', 'que es aitue', 'quienes son', 'quiénes son', 'qué hace aitue', 'a qué se dedican', 'sobre aitue', 'acerca de aitue',
      'página web', 'pagina web', 'sitio web', 'cuál es la página web', 'cual es la pagina web', 'cuál es la web', 'cual es la web',
      'link de la página', 'link de la pagina', 'link web', 'direccion web', 'dirección web', 'web oficial', 'sitio oficial',
      'página de aitue', 'pagina de aitue', 'web de aitue'
    ],
    exclusions: [],
    responsible: null,
    action: 'SEND_EMPRESA_INFO',
    priority: 9,
    get baseResponse() { return PROTOCOLS.EMPRESA_INFO; },
    relatedLinks: [LINKS.web, LINKS.shop]
  },
  OPERATIVA: {
    id: 'OPERATIVA',
    name: 'Operativa / Otras consultas',
    objective: 'Fallback final cuando ninguna de las áreas anteriores puede determinarse con suficiente confianza.',
    triggers: ['operativa', 'otras consultas'],
    exclusions: [],
    responsible: [CONTACTS.operativa],
    action: 'DERIVE_TO_OPERATIVA',
    priority: 99,
    baseResponse: '⚙️ Operativa — Canal General\n📧 clientes@aitue.net (Lunes a viernes, 09:00 a 18:00 hs AR)',
    relatedLinks: [LINKS.web]
  }
};
