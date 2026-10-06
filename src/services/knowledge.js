let cachedArticles = null;

// ----------------------------------------------------
// AITUE COMUNICA S.A. - BASE DE CONOCIMIENTO CENTRALIZADA POR ÁREAS
// ----------------------------------------------------

export class KnowledgeService {
  static getArticles() {
    return structuredClone(cachedArticles ?? this.getKnowledgeArticles());
  }
  static async fetchServerKnowledge() {
    const res = await fetch('/api/config/knowledge');
    if (!res.ok) throw new Error('No se pudo cargar la base de conocimiento.');
    const data = await res.json();
    cachedArticles = Array.isArray(data.articles) ? data.articles : [];
    return data;
  }
  static async saveArticles(articles) {
    const res = await fetch('/api/config/knowledge', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articles })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar el conocimiento.');
    cachedArticles = structuredClone(articles);
    return this.getArticles();
  }
  static addArticle(article) {
    return this.saveArticles([...this.getArticles(), { ...article, id: 'kb_' + crypto.randomUUID(), updatedAt: new Date().toISOString() }]);
  }
  static updateArticle(article) {
    return this.saveArticles(this.getArticles().map(item => item.id === article.id ? { ...item, ...article, updatedAt: new Date().toISOString() } : item));
  }
  static deleteArticle(id) { return this.saveArticles(this.getArticles().filter(item => item.id !== id)); }
  static resetToDefaults() { return this.saveArticles(this.getKnowledgeArticles()); }

  static getKnowledgeArticles() {
    return [
      {
        id: 'kb_empresa_info',
        category: '1. Información Institucional',
        title: '🛰️ ¿Qué es AITUE COMUNICA S.A.?',
        content: `AITUE COMUNICA S.A. es una empresa líder, especializada en soluciones de conectividad satelital en movimiento. Si ves el cielo, estamos.

Desarrolla soluciones 360° para resguardar, integrar y adaptar equipos Starlink Mini y Mini X para instalaciones permanentes (Aitue Standard), vehículos (Aitue Pro) y plataformas configurables (Ultra+).

Además, desarrolla accesorios para equipos Starlink, incluyendo soluciones de alimentación, sistemas y componentes de fijación, y otros elementos compatibles según los requerimientos de cada instalación.

AITUE también brinda servicios de acceso a Internet vía satélite.

Tecnologías utilizadas: satelital, Wi-Fi, LTE, GPS, seguimiento, administración remota y transmisión de cámaras en tiempo real.

Presencia internacional: AITUE cuenta con sedes sociales en Argentina, Brasil, Colombia, Chile, países del MERCOSUR, España y la Unión Europea.`,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'kb_productos_servicios',
        category: '1. Información Institucional',
        title: '📦 Productos, Soluciones y Tienda Oficial',
        content: `AITUE ofrece soluciones 360° desarrolladas para proteger, integrar y adaptar equipos Starlink Mini y Mini X:
• Aitue Standard: Protección para instalaciones fijas y estructuras permanentes. Rígida, segura, prolija y funcional.
• Aitue Pro: Orientada a conectividad en movimiento, con un sistema de fijación magnética para vehículos sin perforaciones permanentes.
• Ultra+: Plataforma modular y configurable que integra en un mismo gabinete módulos de conectividad, rastreo, video, administración de red y gestión operativa.

🛒 CATÁLOGO OFICIAL EN TIENDA (https://shop.aitue.net/):

1. SOPORTES DE PARED:
• Mástil Móvil Regulable: Soporte para instalación fija residencial, industrial, comercial, agropecuaria, institucional, infraestructura y espacios públicos.

2. CABLES DE ALIMENTACIÓN:
• Cable USB-C: Repuesto USB-C para el adaptador de auto/coche de Starlink. Compatible siempre que se cuente con un adaptador de coche Starlink o uno que entregue 20V.
• Cable 30V con Elevador de Tensión para Starlink Mini: Para una alimentación constante de la antena o si el vehículo entrega 12V / -12V.
• Cable de 12V para Starlink Mini: Alimentación para Starlink Mini con conector macho de encendedor.
• DBT (Direct Battery Power): Kit de autoinstalación para protección directa a batería de vehículo y equipo, evitando dejar al vehículo sin energía.
• Puente de Conexión: Si el cliente cuenta con nuestra solución Standard o Pro y cables de alimentación (original de Starlink de 15m / DBT / 30V), el cable puente es la opción para alimentar la antena internamente de forma segura.

3. ACCESORIOS STARLINK MINI ORIGINALES:
• Adaptador Ethernet: Repuesto original Starlink.
• Fuente de Alimentación a 220V: Disponible versión original Starlink o fabricada por AITUE.
• Adaptador para Mástil de Starlink Mini: Repuesto original Starlink.
• Pie de Antena a 20° Original: Repuesto original Starlink.

4. ACCESORIOS AITUE PARA SOLUCIONES 360°:
• Pack de 4 Imanes de Neodimio de alta adherencia: Fijación magnética vehicular/móvil de alta resistencia.
• Gabinete MIAITUE — Carcasa para Starlink Mini: Gabinete protector de máxima resistencia.
• Nuevo Protector Aerodinámico con O-ring de Goma: Protección exterior aerodinámica con sellado estanco.

REGLA DE DERIVACIÓN PARA ACCESORIOS Y PRODUCTOS DE TIENDA:
Derivar a Tienda Oficial (https://shop.aitue.net/) para compras del catálogo, a Susana en Gerencia Comercial (susana@aitue.net | 📞 +54 9 11 4164-0955 | https://wa.me/5491141640955 - Atención 24/7) para ventas en cantidad o asesoría, y a clientes@aitue.net para problemas técnicos, consultas técnicas o productos.`,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'kb_ventas_cotizaciones_protocol',
        category: '2. Ventas y Cotizaciones',
        title: '💼 Protocolo 3: Ventas, Precios y Cotizaciones (Gerencia Comercial)',
        content: `VENTAS EN CANTIDAD Y ASESORÍA:
- Ventas en cantidad o asesoría (Susana): 📧 susana@aitue.net | 📞 +54 9 11 4164-0955 | 🔗 https://wa.me/5491141640955 (Atención 24/7).
- Ventas en cantidad o asesoría internacional (Alejandro): 📧 alejandro@aitue.net | 📞 +54 9 11 6230-0000 | 🔗 https://wa.me/5491162300000 (Atención 24/7).
- 🛒 Tienda oficial: https://shop.aitue.net/`,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'kb_soporte_tecnico_protocol',
        category: '3. Soporte Técnico',
        title: '🛠️ Protocolo 4: Soporte Técnico (Servicio de Soporte Técnico)',
        content: `SOPORTE TÉCNICO, CONECTIVIDAD Y PRODUCTOS:
- Problemas técnicos, de conectividad, consultas técnicas o productos -> 📧 clientes@aitue.net | 📞 +54 9 11 7358-3768 (Atención 24/7).`,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'kb_internet_satelital_rutas',
        category: '4. Internet Vía Satélite',
        title: '📡 Protocolo 5: Internet Vía Satélite y Conectividad (Soporte de Red Vía Satelital)',
        content: `INTERNET VÍA SATÉLITE Y CONEXIÓN A INTERNET:
1. Contratar / consultar / precio / cotización / información / disponibilidad / alta:
   → Gerencia Comercial (comercial@aitue.net | 📞 +54 9 11 4164-0955 - 24/7).
2. Activar / desactivar / problemas de conectividad / consumo de datos / interrupción de conectividad / red / señal / sin Internet:
   → Derivar PRIMERO a Soporte de Red Vía Satelital (somos@aitue.net | 📞 +54 9 3872 12-7974 - 24/7) para activaciones, consumo de datos o interrupción de conectividad.
   → Y TAMBIÉN a Servicio de Soporte Técnico (laboratorio@aitue.net / desarrollo@aitue.net | 📞 +54 9 11 7358-3768 / +54 9 3875 01-4000 - 24/7) por si el problema es interno del equipo o de alimentación.`,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'kb_pagos_envios_b2b_operativa',
        category: '5. Pagos, Envíos, B2B y Operativa',
        title: '💳📦🏢 Protocolos 6, 7, 8 y 9: Pagos, Envíos, B2B y Operativa',
        content: `💳 PAGOS:
- Pagos, rechazado, no acreditado, error al pagar -> Facturación y Administración (📧 clientes@aitue.net - Lunes a viernes, de 09:00 a 18:00 hs AR).

📦 PROBLEMAS DE PEDIDOS, DESPACHOS Y MERCADO LIBRE (MARTIN):
- Problemas de pedidos, despachos y Mercado Libre -> Operativa de Envíos y Despachos (📧 clientes@aitue.net - Lunes a viernes, de 09:00 a 18:00 hs AR).

🏬 DISTRIBUIDORES Y DISTRIBUIDORAS:
- Distribuidores o distribuidoras -> 📧 facturacion@aitue.net (Lunes a viernes de 09:00 a 18:00 hs AR).

🏢 EMPRESAS / FLOTAS / B2B:
- Empresa, Flota, B2B, minería, camiones, volumen -> Susana en Gerencia Comercial (📧 susana@aitue.net | 📞 +54 9 11 4164-0955).

⚙️ OPERATIVA:
- Canal de respaldo (📧 clientes@aitue.net - Lunes a viernes, de 09:00 a 18:00 hs AR). Usar solo cuando la consulta no pueda clasificarse.`,
        updatedAt: new Date().toISOString()
      },
      {
        id: 'kb_lo_sentimos_despedida',
        category: '6. Protocolos Especiales',
        title: '⚠️ Protocolo 10 ("Lo sentimos") y Protocolo 11 (Despedida y Redes)',
        content: `PROTOCOLO DE "LO SENTIMOS":
Mensaje oficial: "Lo sentimos, no cuento con esa información. ¿Podés ampliar un poco más qué necesitás para que podamos ayudarte?"
Usar ÚNICAMENTE si la info no está disponible y no se conoce derivación.

PROTOCOLO DE DESPEDIDA:
Mensaje oficial: "¡Gracias por comunicarte con AITUE! 🛰️ Esperamos haberte ayudado con tu consulta. Te invitamos a seguir conectados para conocer nuestras nuevas soluciones, novedades e innovaciones. Si ves el cielo, estamos. 📡

Podés seguirnos en nuestras redes sociales oficiales:
🌐 Web: https://aitue.net/
🛒 Tienda: https://shop.aitue.net/
🔵 Facebook: https://www.facebook.com/aituecomunicasa
📸 Instagram: https://www.instagram.com/aituecomunicasa
💼 LinkedIn: https://www.linkedin.com/company/aitue-comunicasa-sa"`,
        updatedAt: new Date().toISOString()
      }
    ];
  }

  static getKnowledgeContext(queryText) {
    const articles = this.getArticles();
    let contextText = '=== BASE DE CONOCIMIENTO CORPORATIVA Y REGLAS DE NEGOCIO ===\n';
    articles.forEach(art => {
      contextText += `\n📌 [CATEGORÍA: ${art.category.toUpperCase()}] ${art.title}:\n${art.content}\n`;
    });
    contextText += '==================================================\n';
    return contextText;
  }
}
