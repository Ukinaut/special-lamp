import { escapeHtml } from './services/safe-html.js';
// Styles are loaded directly via link rel="stylesheet" in HTML files
import { OpenAIService } from './services/openai.js';

// Force scroll to top on page entry/refresh
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
window.addEventListener('load', () => {
  window.scrollTo(0, 0);
});

// ----------------------------------------------------
// 1. DYNAMIC TOP NAV INDICATOR & SCROLL SPY
// ----------------------------------------------------
const header = document.querySelector('.hud-header');
const navWrap = document.querySelector('.hud-nav-wrap');
const navLinks = document.querySelectorAll('.hud-nav-link');
const indicator = document.querySelector('.nav-indicator');
const sections = document.querySelectorAll('section[id], footer[id]');

function updateIndicator(element) {
  if (element && indicator) {
    indicator.style.left = `${element.offsetLeft}px`;
    indicator.style.width = `${element.offsetWidth}px`;
  }
}

// Initial positioning on load
window.addEventListener('load', () => {
  const activeLink = document.querySelector('.hud-nav-link.active');
  if (activeLink) {
    updateIndicator(activeLink);
  }
});

// Resize indicator on window resize
window.addEventListener('resize', () => {
  const activeLink = document.querySelector('.hud-nav-link.active');
  if (activeLink) {
    updateIndicator(activeLink);
  }
});

// ----------------------------------------------------
// 1.2 DYNAMIC 3D ROTATING LOGO SEQUENCE (3 IMAGES)
// ----------------------------------------------------
function initRotatingLogo() {
  const logoImgs = document.querySelectorAll('.logo-spinner .logo-img');
  if (logoImgs.length <= 1) return;

  let currentIndex = 0;

  function scheduleNext() {
    const currentImgSrc = logoImgs[currentIndex].getAttribute('src') || '';
    // Logos 4 and 5 pass faster (2000ms), while 1, 2, 3 remain for 5500ms
    const isFastLogo = currentImgSrc.includes('Log-win-nav4') || currentImgSrc.includes('Log-win-nav5');
    const delay = isFastLogo ? 2000 : 5500;

    setTimeout(() => {
      const prevIndex = currentIndex;
      currentIndex = (currentIndex + 1) % logoImgs.length;

      // Transition out previous logo with 3D exit flip
      logoImgs[prevIndex].classList.remove('active');
      logoImgs[prevIndex].classList.add('exit');

      setTimeout(() => {
        logoImgs[prevIndex].classList.remove('exit');
      }, 800);

      // Transition in new logo with 3D enter flip
      logoImgs[currentIndex].classList.add('active');

      scheduleNext();
    }, delay);
  }

  scheduleNext();
}

initRotatingLogo();

navLinks.forEach(link => {
  // Hover effect: slide indicator to hovered link
  link.addEventListener('mouseenter', () => {
    updateIndicator(link);
  });

  // Click behavior: smooth scroll to target section
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const targetId = link.getAttribute('data-target');
    const targetSection = document.getElementById(targetId);

    if (targetSection) {
      const headerOffset = 75;
      const elementPosition = targetSection.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }

    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    updateIndicator(link);
  });
});

// Reset indicator to active link when mouse leaves nav
if (navWrap) {
  navWrap.addEventListener('mouseleave', () => {
    const activeLink = document.querySelector('.hud-nav-link.active');
    if (activeLink) {
      updateIndicator(activeLink);
    }
  });
}

// Scroll Spy: Update active link as page is scrolled
window.addEventListener('scroll', () => {
  // Header Shrunk state
  if (header) {
    if (window.scrollY > 40) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  }

  let currentSectionId = '';
  const scrollPosition = window.scrollY + 120; // offset for nav height

  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    const sectionHeight = section.offsetHeight;

    if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
      currentSectionId = section.getAttribute('id');
    }
  });

  if (currentSectionId) {
    const matchingLink = document.querySelector(`.hud-nav-link[data-target="${currentSectionId}"]`);
    if (matchingLink && !matchingLink.classList.contains('active')) {
      navLinks.forEach(l => l.classList.remove('active'));
      matchingLink.classList.add('active');
      updateIndicator(matchingLink);
    }
  }
});

// ----------------------------------------------------
// 2. MAGNETIC GLOW CARD MOUSE-TRACKING EFFECT
// ----------------------------------------------------
document.addEventListener('mousemove', (e) => {
  const cards = document.querySelectorAll('.glow-card');
  cards.forEach(card => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// ----------------------------------------------------
// 3. CANVAS 3D PARALLAX ORBITAL SYSTEM (HERO)
// ----------------------------------------------------
const canvas = document.getElementById('stars-canvas');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let width = canvas.width = canvas.offsetWidth;
  let height = canvas.height = canvas.offsetHeight;

  let isVisible = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { isVisible = entry.isIntersecting; });
    }, { threshold: 0.05 });
    observer.observe(canvas);
  } else {
    isVisible = true;
  }

  let mouseX = 0;
  let mouseY = 0;
  let targetTiltX = 0;
  let targetTiltY = 0;
  let currentTiltX = 0;
  let currentTiltY = 0;

  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX - window.innerWidth / 2) / (window.innerWidth / 2);
    mouseY = (e.clientY - window.innerHeight / 2) / (window.innerHeight / 2);

    targetTiltX = mouseX * 0.3;
    targetTiltY = mouseY * 0.12;
  });

  const resizeCanvas = () => {
    if (canvas.offsetWidth > 0) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  };
  window.addEventListener('resize', resizeCanvas);

  const orbitsCount = 4;
  const particlesPerOrbit = 8;
  const particles = [];

  class Satellite {
    constructor(orbitIndex, angle) {
      this.orbitIndex = orbitIndex;
      this.angle = angle;
      this.speed = 0.003 + (orbitIndex * 0.0015);
      this.size = Math.random() * 2 + 1.2;
      this.baseRadiusX = 100 + (orbitIndex * 40);
      this.baseRadiusY = 30 + (orbitIndex * 10);
      this.color = orbitIndex % 2 === 0 ? 'rgba(89, 168, 255, 0.7)' : 'rgba(217, 70, 239, 0.7)';
    }

    update() {
      this.angle += this.speed;
      if (this.angle > Math.PI * 2) this.angle -= Math.PI * 2;
    }

    draw(tiltX, tiltY) {
      const cos = Math.cos(this.angle);
      const sin = Math.sin(this.angle);

      const rx = this.baseRadiusX;
      const ry = this.baseRadiusY;

      let x = cos * rx;
      let y = sin * ry;

      const rotatedX = x * Math.cos(tiltX) - y * Math.sin(tiltX);
      const rotatedY = x * Math.sin(tiltX) + y * Math.cos(tiltX) + (cos * tiltY * 70);

      // Shift orbit center to center of canvas
      const centerX = width * 0.5;
      const centerY = height * 0.5;

      const finalX = centerX + rotatedX;
      const finalY = centerY + rotatedY;

      const depthScale = (sin + 1.5) / 2.5;
      const size = this.size * depthScale;

      if (depthScale > 0.4) {
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.lineTo(finalX, finalY);
        ctx.strokeStyle = this.orbitIndex % 2 === 0 ? `rgba(89, 168, 255, ${depthScale * 0.03})` : `rgba(217, 70, 239, ${depthScale * 0.02})`;
        ctx.stroke();
      }

      ctx.beginPath();
      ctx.arc(finalX, finalY, size, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.fill();
    }
  }

  for (let o = 0; o < orbitsCount; o++) {
    for (let p = 0; p < particlesPerOrbit; p++) {
      const startAngle = (p / particlesPerOrbit) * Math.PI * 2;
      particles.push(new Satellite(o, startAngle));
    }
  }

  function drawOrbitsPath(tiltX, tiltY) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    for (let o = 0; o < orbitsCount; o++) {
      const rx = 100 + (o * 40);
      const ry = 30 + (o * 10);

      ctx.beginPath();
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(tiltX);
      ctx.scale(1, ry / rx);
      ctx.arc(0, 0, rx, 0, Math.PI * 2);
      ctx.restore();

      ctx.strokeStyle = o % 2 === 0 ? 'rgba(89, 168, 255, 0.04)' : 'rgba(217, 70, 239, 0.02)';
      ctx.stroke();
    }

    // Core central node
    ctx.beginPath();
    ctx.arc(centerX, centerY, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(12, 35, 74, 0.85)';
    ctx.strokeStyle = 'rgba(89, 168, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#59A8FF';
    ctx.fill();
  }

  function animate() {
    if (!isVisible) {
      requestAnimationFrame(animate);
      return;
    }
    ctx.clearRect(0, 0, width, height);

    currentTiltX += (targetTiltX - currentTiltX) * 0.05;
    currentTiltY += (targetTiltY - currentTiltY) * 0.05;

    drawOrbitsPath(currentTiltX, currentTiltY);

    particles.forEach(satellite => {
      satellite.update();
      satellite.draw(currentTiltX, currentTiltY);
    });

    requestAnimationFrame(animate);
  }
  animate();
}

// ----------------------------------------------------
// 4. AITUE ULTRA+ SEAMLESS INFINITE 3D CAROUSEL ENGINE
// ----------------------------------------------------
const carousel3dStage = document.getElementById('carousel-3d-stage');
const carousel3dCards = document.querySelectorAll('.carousel-3d-card');
const carousel3dDots = document.querySelectorAll('.carousel-dot');
const carousel3dPrev = document.getElementById('carousel-3d-prev');
const carousel3dNext = document.getElementById('carousel-3d-next');

const autodiagStatusText = document.getElementById('autodiag-status-text');
const autodiagPauseBadge = document.getElementById('autodiag-pause-badge');

const infoTitle = document.getElementById('cabinet-info-title');
const infoDesc = document.getElementById('cabinet-info-desc');
const specLbl1 = document.getElementById('spec-lbl-1');
const specVal1 = document.getElementById('spec-val-1');
const specLbl2 = document.getElementById('spec-lbl-2');
const specVal2 = document.getElementById('spec-val-2');
const specLbl3 = document.getElementById('spec-lbl-3');
const specVal3 = document.getElementById('spec-val-3');
const specLbl4 = document.getElementById('spec-lbl-4');
const specVal4 = document.getElementById('spec-val-4');

const serviceData = {
  wifi: {
    title: "WI FI + LTE // SERVICIO DE ENLACE",
    desc: "Acceso a internet de alta velocidad de órbita baja (LEO) vía satélite combinado con respaldo LTE redundante. Tráfico y ancho de banda inteligente a demanda de uso para operaciones en movimiento.",
    specs: [
      { label: "CONECTIVIDAD:", val: "SATELITAL + CELULAR LTE" },
      { label: "ANCHO DE BANDA:", val: "HASTA 220 Mbps" },
      { label: "LATENCIA:", val: "25ms - 40ms MÍNIMA" },
      { label: "COBERTURA:", val: "GLOBAL 100% TERRESTRE" }
    ]
  },
  video: {
    title: "MONITOREO DE VIDEO // SEGURIDAD EN VIVO",
    desc: "Transmisión y gestión de imágenes de cámaras de seguridad en tiempo real. Gestor de video integrado con almacenamiento en disco SSD local para auditorías de ruta y seguridad patrimonial.",
    specs: [
      { label: "CÁMARAS:", val: "HASTA 4 EN VIVO SIMULTÁNEAS" },
      { label: "GRABACIÓN:", val: "24/7 EN DISCO SSD INTEGRADO" },
      { label: "COMPRESIÓN:", val: "H.265 DE ALTA EFICIENCIA" },
      { label: "ACCESO:", val: "STREAMING REMOTO CIFRADO" }
    ]
  },
  trackeo: {
    title: "TRACKEO GPS + TELEMETRÍA // LOGÍSTICA ACTIVA",
    desc: "Gestión y rastreo integrado de red LTE y WiFi con geolocalización satelital activa. Monitoreo constante de velocidad, ruta y cobertura en zonas geográficamente desafiantes.",
    specs: [
      { label: "RASTREO:", val: "GPS ACTIVO EN TIEMPO REAL" },
      { label: "TELEMETRÍA:", val: "VELOCIDAD, RUTA Y SEÑAL" },
      { label: "ALERTAS:", val: "GEOCERCAS E IMPACTOS (G-SENSOR)" },
      { label: "HISTORIAL:", val: "ALMACENAMIENTO DE DATOS 90 DÍAS" }
    ]
  },
  admin: {
    title: "ADMINISTRACIÓN // CONTROL DE TRÁFICO",
    desc: "Plataforma APPCONTROL para la gestión completa de usuarios, reglas de contenido y límites de tráfico. Incluye pasarela de pagos integrada para cobro de acceso en transportes públicos.",
    specs: [
      { label: "GESTIÓN:", val: "APPCONTROL MÓVIL Y WEB" },
      { label: "PORTAL:", val: "AUTENTICACIÓN CAPTIVE PORTAL" },
      { label: "PAGOS:", val: "PASARELA MULTIPAGO INTEGRADA" },
      { label: "POLÍTICAS:", val: "FILTRADO DE CONTENIDO Y QOS" }
    ]
  },
  operativa: {
    title: "OPERATIVA IOT // TELEMETRÍA INDUSTRIAL",
    desc: "Control total e inteligente de periféricos y sensores industriales mediante protocolo IoT. Monitoreo activo de temperatura, energía y estado físico del gabinete blindado.",
    specs: [
      { label: "DISPOSITIVOS:", val: "CONTROL IOT DE PERIFÉRICOS" },
      { label: "TELEMETRÍA:", val: "TEMPERATURA, ENERGÍA Y TENSIÓN" },
      { label: "ALERTAS:", val: "APERTURA DE PUERTAS E INTRUSIÓN" },
      { label: "PROTOCOLOS:", val: "MQTT, MODBUS E INTERFAZ CAN" }
    ]
  }
};

if (carousel3dCards.length > 0) {
  const totalCards = carousel3dCards.length;
  let targetIndex = 0;
  let currentIndex = 0;
  let isAutoPlayPaused = false;
  let lastAutoStepTime = Date.now();
  const AUTO_STEP_INTERVAL = 4000;

  let isDragging = false;
  let startX = 0;
  let dragDeltaX = 0;

  function update3DLayout() {
    currentIndex += (targetIndex - currentIndex) * 0.12;

    const activeRoundedIdx = Math.round((currentIndex % totalCards + totalCards) % totalCards);

    carousel3dCards.forEach((card, i) => {
      let diff = i - (currentIndex % totalCards);
      diff = (diff + totalCards) % totalCards;
      if (diff > totalCards / 2) diff -= totalCards;

      const isMobile = window.innerWidth < 768;
      const spacingX = isMobile ? 180 : 250;
      const posX = diff * spacingX;
      const posZ = -Math.abs(diff) * (isMobile ? 80 : 120) + (Math.abs(diff) < 0.1 ? 80 : 0);
      const rotY = -diff * (isMobile ? 20 : 28);
      const scale = Math.max(0.6, 1.05 - Math.abs(diff) * 0.22);
      const opacity = Math.max(0, 1 - Math.abs(diff) * 0.45);

      card.style.transform = `translate3d(${posX}px, 0px, ${posZ}px) rotateY(${rotY}deg) scale(${scale})`;
      card.style.opacity = opacity.toFixed(2);
      card.style.zIndex = Math.round(10 - Math.abs(diff) * 3);

      if (Math.abs(diff) < 0.4) {
        card.classList.add('active');
        card.setAttribute('aria-hidden', 'false');
      } else {
        card.classList.remove('active');
        card.setAttribute('aria-hidden', 'true');
      }
    });

    carousel3dDots.forEach((dot, idx) => {
      if (idx === activeRoundedIdx) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    const activeCard = carousel3dCards[activeRoundedIdx];
    if (activeCard) {
      const serviceKey = activeCard.getAttribute('data-service');
      const data = serviceData[serviceKey];

      if (autodiagStatusText && serviceKey) {
        const numStr = String(activeRoundedIdx + 1).padStart(2, '0');
        autodiagStatusText.textContent = `AUTODIAGNÓSTICO // MÓDULO ${numStr}/05 [${serviceKey.toUpperCase()}] // 100% OPERATIVO`;
      }

      if (data && infoTitle && infoTitle.getAttribute('data-active-key') !== serviceKey) {
        infoTitle.setAttribute('data-active-key', serviceKey);
        
        const hudPanel = document.querySelector('.blueprint-details-hud');
        if (hudPanel) {
          hudPanel.style.opacity = '0.7';
        }

        setTimeout(() => {
          if (infoTitle) infoTitle.textContent = data.title;
          if (infoDesc) infoDesc.textContent = data.desc;

          if (specLbl1 && specVal1) { specLbl1.textContent = data.specs[0].label; specVal1.textContent = data.specs[0].val; }
          if (specLbl2 && specVal2) { specLbl2.textContent = data.specs[1].label; specVal2.textContent = data.specs[1].val; }
          if (specLbl3 && specVal3) { specLbl3.textContent = data.specs[2].label; specVal3.textContent = data.specs[2].val; }
          if (specLbl4 && specVal4) { specLbl4.textContent = data.specs[3].label; specVal4.textContent = data.specs[3].val; }

          if (hudPanel) {
            hudPanel.style.opacity = '1';
            hudPanel.style.transition = 'opacity 0.2s ease-out';
          }
        }, 50);
      }
    }
  }

  function loop() {
    if (!isAutoPlayPaused && !isDragging) {
      const now = Date.now();
      if (now - lastAutoStepTime >= AUTO_STEP_INTERVAL) {
        targetIndex += 1;
        lastAutoStepTime = now;
      }
    }
    update3DLayout();
    requestAnimationFrame(loop);
  }

  carousel3dCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      let diff = idx - (targetIndex % totalCards);
      diff = (diff + totalCards) % totalCards;
      if (diff > totalCards / 2) diff -= totalCards;
      targetIndex += diff;
      lastAutoStepTime = Date.now();
    });
  });

  carousel3dDots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      let diff = idx - (targetIndex % totalCards);
      diff = (diff + totalCards) % totalCards;
      if (diff > totalCards / 2) diff -= totalCards;
      targetIndex += diff;
      lastAutoStepTime = Date.now();
    });
  });

  if (carousel3dPrev) {
    carousel3dPrev.addEventListener('click', () => {
      targetIndex -= 1;
      lastAutoStepTime = Date.now();
    });
  }

  if (carousel3dNext) {
    carousel3dNext.addEventListener('click', () => {
      targetIndex += 1;
      lastAutoStepTime = Date.now();
    });
  }

  if (carousel3dStage) {
    carousel3dStage.addEventListener('mouseenter', () => {
      isAutoPlayPaused = true;
      if (autodiagPauseBadge) {
        autodiagPauseBadge.textContent = 'PAUSADO (MANUAL)';
        autodiagPauseBadge.classList.add('paused');
      }
    });

    carousel3dStage.addEventListener('mouseleave', () => {
      isAutoPlayPaused = false;
      lastAutoStepTime = Date.now();
      if (autodiagPauseBadge) {
        autodiagPauseBadge.textContent = 'AUTO-CYCLE ON';
        autodiagPauseBadge.classList.remove('paused');
      }
    });

    const handleDragStart = (e) => {
      isDragging = true;
      startX = e.pageX || (e.touches && e.touches[0].pageX);
      dragDeltaX = 0;
    };

    const handleDragMove = (e) => {
      if (!isDragging) return;
      const currentX = e.pageX || (e.touches && e.touches[0].pageX);
      dragDeltaX = currentX - startX;
    };

    const handleDragEnd = () => {
      if (!isDragging) return;
      isDragging = false;
      if (Math.abs(dragDeltaX) > 40) {
        if (dragDeltaX > 0) {
          targetIndex -= 1;
        } else {
          targetIndex += 1;
        }
      }
      lastAutoStepTime = Date.now();
    };

    carousel3dStage.addEventListener('mousedown', handleDragStart);
    window.addEventListener('mousemove', handleDragMove);
    window.addEventListener('mouseup', handleDragEnd);

    carousel3dStage.addEventListener('touchstart', handleDragStart, { passive: true });
    window.addEventListener('touchmove', handleDragMove, { passive: true });
    window.addEventListener('touchend', handleDragEnd);
  }

  requestAnimationFrame(loop);
}


// ----------------------------------------------------
// 5. B2B CONFIGURATOR DRAWER MANAGER
// ----------------------------------------------------
const backdrop = document.getElementById('config-backdrop');
const drawer = document.getElementById('config-drawer');
const drawerCloseBtn = document.getElementById('drawer-close-btn');

const openConfiguratorBtns = document.querySelectorAll('.open-configurator');
const heroConfiguratorBtn = document.getElementById('hero-to-configurator');
const partnersCtaBtn = document.getElementById('cta-partners-distribuidor');

function openDrawer() {
  if (backdrop && drawer) {
    backdrop.classList.add('active');
    drawer.classList.add('active');
    document.body.style.overflow = 'hidden'; // block page scroll
  }
}

function closeDrawer() {
  if (backdrop && drawer) {
    backdrop.classList.remove('active');
    drawer.classList.remove('active');
    document.body.style.overflow = ''; // restore scroll
  }
}

// Attach open events
openConfiguratorBtns.forEach(btn => btn.addEventListener('click', openDrawer));
if (heroConfiguratorBtn) heroConfiguratorBtn.addEventListener('click', openDrawer);
if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
if (backdrop) backdrop.addEventListener('click', closeDrawer);

// Partners special setup: prefill and open drawer form directly
if (partnersCtaBtn) {
  partnersCtaBtn.addEventListener('click', () => {
    openDrawer();

    // Prefill notes field
    const notesField = document.getElementById('quote-notes');
    if (notesField) {
      notesField.value = "Interés en unirme a la red de distribuidores de AITUE COMUNICA en mi país/región.";
    }

    // Go straight to step/form transition if desired
    const configSteps = document.getElementById('drawer-steps-content');
    const b2bForm = document.getElementById('drawer-form-content');
    const backBtn = document.getElementById('config-back-action');
    const mainActionBtn = document.getElementById('config-main-action');

    if (configSteps && b2bForm) {
      configSteps.style.display = 'none';
      b2bForm.style.display = 'block';
      if (backBtn) backBtn.style.display = 'block';
      if (mainActionBtn) mainActionBtn.textContent = 'Enviar Solicitud âœ“';
      currentDrawerState = 'form';
    }
  });
}

// Option selection handler inside drawer
const optionCards = document.querySelectorAll('.option-card');
const drawerStepsContent = document.getElementById('drawer-steps-content');
const drawerFormContent = document.getElementById('drawer-form-content');
const configMainAction = document.getElementById('config-main-action');
const configBackAction = document.getElementById('config-back-action');
const totalPriceValue = document.getElementById('config-total-price');
const quoteForm = document.getElementById('b2b-quote-form');

optionCards.forEach(card => {
  card.addEventListener('click', () => {
    const step = card.getAttribute('data-step');

    if (step === "1" || step === "2") {
      document.querySelectorAll(`.option-card[data-step="${step}"]`).forEach(c => {
        c.classList.remove('selected');
      });
      card.classList.add('selected');
    } else if (step === "3") {
      card.classList.toggle('selected');
    }

    calculateTotal();
  });
});

function calculateTotal() {
  let total = 0;
  const selectedOptions = [];

  document.querySelectorAll('.option-card.selected').forEach(card => {
    const price = parseInt(card.getAttribute('data-price')) || 0;
    total += price;
    selectedOptions.push(card.getAttribute('data-name'));
  });

  if (totalPriceValue) {
    totalPriceValue.innerHTML = `$${total.toLocaleString()} <span>USD</span>`;
  }
  return { total, selectedOptions };
}

let currentDrawerState = 'steps';

if (configMainAction) {
  configMainAction.addEventListener('click', () => {
    if (currentDrawerState === 'steps') {
      drawerStepsContent.style.display = 'none';
      drawerFormContent.style.display = 'block';
      configBackAction.style.display = 'block';
      configMainAction.textContent = 'Enviar Solicitud âœ“';
      currentDrawerState = 'form';
    } else if (currentDrawerState === 'form') {
      if (quoteForm.checkValidity()) {
        submitDrawerLead();
      } else {
        quoteForm.reportValidity();
      }
    }
  });
}

if (configBackAction) {
  configBackAction.addEventListener('click', () => {
    if (currentDrawerState === 'form') {
      drawerStepsContent.style.display = 'flex';
      drawerFormContent.style.display = 'none';
      configBackAction.style.display = 'none';
      configMainAction.textContent = 'Solicitar Propuesta Comercial →';
      currentDrawerState = 'steps';
    }
  });
}

function submitDrawerLead() {
  const { total, selectedOptions } = calculateTotal();
  const name = document.getElementById('quote-name').value;
  const email = document.getElementById('quote-email').value;
  const company = document.getElementById('quote-company').value;
  const fleet = document.getElementById('quote-fleet').value;

  // Replace drawer body with success screen
  const drawerBody = document.querySelector('.drawer-body');
  if (drawerBody) {
    drawerBody.innerHTML = `
      <div class="config-success">
        <div class="success-icon">âœ“</div>
        <h3 style="font-family: var(--font-title); text-transform: uppercase; margin-bottom: 0.5rem;">Propuesta Solicitada</h3>
        <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.6; margin-bottom: 1.5rem;">
          Operador <strong>${name}</strong> registrado.<br>
          Configuración solicitada para una flota de <strong>${fleet}</strong> unidades.
        </p>
        
        <div style="background: rgba(1, 4, 13, 0.7); border: 1px solid rgba(89, 168, 255, 0.15); padding: 1rem; border-radius: 4px; text-align: left; width: 100%; font-family: var(--font-mono); font-size: 0.75rem; margin-bottom: 1.5rem;">
          <strong style="color: var(--color-accent); display: block; margin-bottom: 0.6rem;">TELEMETRÍA CONFIGURADA:</strong>
          <ul style="list-style: none; padding-left: 0; color: var(--text-secondary);">
            ${selectedOptions.map(opt => `<li style="margin-bottom: 0.3rem;">> ${opt}</li>`).join('')}
          </ul>
        </div>
        
        <p style="color: var(--text-muted); font-size: 0.8rem; line-height: 1.6;">
          Enviamos el dossier comercial de hardware a <strong>${email}</strong>. Un especialista de AITUE validará los requisitos de tu flota en breve.
        </p>
        <button class="btn btn-primary" id="drawer-success-reset" style="margin-top: 1.5rem; width: 100%;">Reiniciar Operación</button>
      </div>
    `;

    // Hide calculations buttons footer
    const drawerFooter = document.querySelector('.drawer-footer');
    if (drawerFooter) drawerFooter.style.display = 'none';

    document.getElementById('drawer-success-reset').addEventListener('click', () => {
      location.reload();
    });
  }
}

// ----------------------------------------------------
// 1.3 DYNAMIC 3D ROTATING WHATSAPP BUTTON SEQUENCE
// ----------------------------------------------------
function initRotatingWhatsapp() {
  const whatsappImgs = document.querySelectorAll('.whatsapp-spinner .logo-img');
  if (whatsappImgs.length <= 1) return;

  let currentIndex = 0;

  function scheduleNext() {
    setTimeout(() => {
      const prevIndex = currentIndex;
      currentIndex = (currentIndex + 1) % whatsappImgs.length;

      // Transition out previous logo with 3D exit flip
      whatsappImgs[prevIndex].classList.remove('active');
      whatsappImgs[prevIndex].classList.add('exit');

      setTimeout(() => {
        whatsappImgs[prevIndex].classList.remove('exit');
      }, 800);

      // Transition in new logo with 3D enter flip
      whatsappImgs[currentIndex].classList.add('active');

      // Dynamically update glow variables depending on active logo
      const parentBtn = document.getElementById('whatsapp-float-btn');
      if (parentBtn) {
        if (currentIndex === 0) {
          // WhatsApp Active Color Variables (Green Glow)
          parentBtn.style.setProperty('--whatsapp-active-color', 'rgba(37, 211, 102, 0.4)');
          parentBtn.style.setProperty('--whatsapp-glow-color', 'rgba(37, 211, 102, 0.2)');
          parentBtn.style.setProperty('--whatsapp-active-hover-color', 'rgba(37, 211, 102, 0.8)');
          parentBtn.style.setProperty('--whatsapp-glow-hover-color', 'rgba(37, 211, 102, 0.4)');
        } else {
          // AITUE Active Color Variables (Cyan Glow)
          parentBtn.style.setProperty('--whatsapp-active-color', 'rgba(89, 168, 255, 0.4)');
          parentBtn.style.setProperty('--whatsapp-glow-color', 'rgba(89, 168, 255, 0.2)');
          parentBtn.style.setProperty('--whatsapp-active-hover-color', 'rgba(89, 168, 255, 0.8)');
          parentBtn.style.setProperty('--whatsapp-glow-hover-color', 'rgba(89, 168, 255, 0.4)');
        }
      }

      scheduleNext();
    }, 4500);
  }

  scheduleNext();
}

initRotatingWhatsapp();

// Dynamic contrast logic for floating WhatsApp button
function updateWhatsappContrast() {
  const btn = document.getElementById('whatsapp-float-btn');
  const lightSections = document.querySelectorAll('.star-products-section');
  if (!btn || lightSections.length === 0) return;

  const btnRect = btn.getBoundingClientRect();
  let overlapsLight = false;

  lightSections.forEach(section => {
    const secRect = section.getBoundingClientRect();
    // Check if the button overlaps the vertical range of the light section
    if (btnRect.bottom > secRect.top && btnRect.top < secRect.bottom) {
      overlapsLight = true;
    }
  });

  if (overlapsLight) {
    btn.classList.add('contrast-light');
  } else {
    btn.classList.remove('contrast-light');
  }
}

window.addEventListener('scroll', updateWhatsappContrast);
window.addEventListener('resize', updateWhatsappContrast);
window.addEventListener('load', updateWhatsappContrast);
updateWhatsappContrast();

// Assistance Hub Menu Toggle Logic
const hubContainer = document.getElementById('assistance-hub');
const floatBtn = document.getElementById('whatsapp-float-btn');
if (floatBtn && hubContainer) {
  floatBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    hubContainer.classList.toggle('open');
  });
}

// Close menu when clicking outside
document.addEventListener('click', () => {
  if (hubContainer) {
    hubContainer.classList.remove('open');
  }
});

// Virtual Assistant Chat Interface Logic
function initAssistantChat() {
  const chatContainer = document.getElementById('assistant-chat');
  const chatCloseBtn = document.getElementById('chat-close-btn');
  const chatInput = document.getElementById('chat-input');
  const chatSendBtn = document.getElementById('chat-send-btn');
  const chatMessages = document.getElementById('chat-messages');
  const botTrigger = document.getElementById('bot-assistance-trigger');

  if (!chatContainer) return;

  // Generate or get unique session JID/ID for web client
  let sessionId = null;
  let sessionPromise;
  function ensureSession() {
    if (!sessionPromise) sessionPromise = fetch('/api/web-assistant/session', { method: 'POST' })
      .then(async res => { if (!res.ok) throw new Error('No se pudo iniciar el chat.'); sessionId = (await res.json()).sessionId; return sessionId; })
      .catch(err => { sessionPromise = null; throw err; });
    return sessionPromise;
  }

  // Open Chat from Assistance Menu
  if (botTrigger) {
    botTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const hubContainer = document.getElementById('hud-menu-hub');
      if (hubContainer) hubContainer.classList.remove('open');
      chatContainer.classList.add('active');
      chatInput.focus();
      pollMessages();
    });
  }

  // Close Chat
  if (chatCloseBtn) {
    chatCloseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      chatContainer.classList.remove('active');
    });
  }

  // Prevent closing when clicking inside the chatbox
  chatContainer.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Track messages already rendered to avoid duplicates/flicker
  let renderedMessageIds = new Set();

  function renderMessages(messages) {
    let changed = false;
    messages.forEach((msg) => {
      const msgId = msg.id || (msg.timestamp + msg.text);
      if (!renderedMessageIds.has(msgId)) {
        renderedMessageIds.add(msgId);
        
        const msgDiv = document.createElement('div');
        // Map backend sender (user/operator/bot) to CSS class (user/bot)
        const senderClass = msg.sender === 'user' ? 'user' : 'bot';
        msgDiv.className = `chat-message ${senderClass}`;

        const time = new Date(msg.timestamp || Date.now());
        const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;

        msgDiv.innerHTML = `<p>${escapeHtml(msg.text)}</p><span class="message-time">${timeStr}</span>`;
        chatMessages.appendChild(msgDiv);
        changed = true;
      }
    });

    if (changed) {
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  // Poll for messages in real-time
  let polling = false;
  async function pollMessages() {
    if (polling || document.hidden || !chatContainer.classList.contains('active')) return;
    polling = true;
    try {
      await ensureSession();
      const res = await fetch(`/api/web-assistant/poll/${sessionId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          // Clear first greeting if server messages exist
          if (renderedMessageIds.size === 0 && chatMessages.children.length > 0) {
            chatMessages.innerHTML = '';
          }
          renderMessages(data.messages);
        }
      }
    } catch (e) {
      console.warn('Error polling messages from server:', e);
    } finally { polling = false; }
  }

  // Start polling
  pollMessages();
  setInterval(pollMessages, 2000);

  // Send message function
  async function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    chatInput.value = '';
    showTypingIndicator();
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
      await ensureSession();
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, sessionId: sessionId })
      });
      removeTypingIndicator();
      if (!res.ok) { const data = await res.json(); throw new Error(data.error || 'No se pudo enviar el mensaje.'); }
      pollMessages();
    } catch (e) {
      removeTypingIndicator();
      const error = document.createElement('div');
      error.className = 'chat-message bot';
      error.textContent = e.message || 'No se pudo enviar el mensaje. Intentá nuevamente.';
      chatMessages.appendChild(error);
      chatInput.value = text;
    }
  }

  let typingIndicator = null;

  function showTypingIndicator() {
    if (typingIndicator) return;
    typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    `;
    chatMessages.appendChild(typingIndicator);
  }

  function removeTypingIndicator() {
    if (typingIndicator) {
      typingIndicator.remove();
      typingIndicator = null;
    }
  }

  // Event Listeners
  if (chatSendBtn) {
    chatSendBtn.addEventListener('click', sendMessage);
  }

  // Voice Dictation (Web Speech API)
  const chatMicBtn = document.getElementById('chat-mic-btn');
  if (chatMicBtn && chatInput) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-AR';
      recognition.interimResults = true;
      recognition.continuous = false;

      let isListening = false;

      chatMicBtn.addEventListener('click', () => {
        if (!isListening) {
          try {
            recognition.start();
            isListening = true;
            chatMicBtn.style.transform = 'scale(1.3)';
            chatMicBtn.style.color = '#ff4d6d';
            chatMicBtn.title = 'Escuchando... Hablá ahora';
          } catch (e) {
            console.error('Speech recognition error:', e);
          }
        } else {
          recognition.stop();
          isListening = false;
          chatMicBtn.style.transform = 'scale(1)';
          chatMicBtn.style.color = '#59A8FF';
        }
      });

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');
        chatInput.value = transcript;
      };

      recognition.onerror = () => {
        isListening = false;
        chatMicBtn.style.transform = 'scale(1)';
        chatMicBtn.style.color = '#59A8FF';
      };

      recognition.onend = () => {
        isListening = false;
        chatMicBtn.style.transform = 'scale(1)';
        chatMicBtn.style.color = '#59A8FF';
        chatMicBtn.title = 'Dictar mensaje por voz';
      };
    } else {
      chatMicBtn.title = 'Dictado de voz no soportado en este navegador';
    }
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });
  }
}

// Global hidden entry triggers (Ctrl+Shift+A and 5 nav logo clicks)
window.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
    e.preventDefault();
    window.location.href = '/admin.html?access=aitue-secure';
  }
});

const logoWrap = document.querySelector('.brand-logo-wrap');
if (logoWrap) {
  let clickCount = 0;
  let lastClickTime = 0;
  logoWrap.addEventListener('click', () => {
    const now = Date.now();
    if (now - lastClickTime < 1200) {
      clickCount++;
    } else {
      clickCount = 1;
    }
    lastClickTime = now;
    
    if (clickCount >= 5) {
      window.location.href = '/admin.html?access=aitue-secure';
    }
  });
}

// Call on initialize
initAssistantChat();

// Interactive Card Stack Cycling
function initCardStack() {
  const stack = document.getElementById('interactive-card-stack');
  const indexDisplay = document.getElementById('stack-index-display');
  if (!stack) return;

  let isCycling = false;

  stack.addEventListener('click', () => {
    if (isCycling) return;
    isCycling = true;

    // Find the current card at the top (data-index="1")
    const cards = Array.from(stack.querySelectorAll('.stack-card'));
    const topCard = cards.find(card => card.getAttribute('data-index') === '1');

    if (!topCard) {
      isCycling = false;
      return;
    }

    // Add slide-out class for animation
    topCard.classList.add('slide-out');

    setTimeout(() => {
      // Shift data-indexes to cycle the cards
      cards.forEach(card => {
        let currentIndex = parseInt(card.getAttribute('data-index'));
        let nextIndex = currentIndex - 1;
        if (nextIndex < 1) {
          nextIndex = cards.length;
        }
        card.setAttribute('data-index', nextIndex.toString());
      });

      // Remove slide-out from the old top card
      topCard.classList.remove('slide-out');

      // Update active classes and update stack index display
      cards.forEach(card => {
        if (card.getAttribute('data-index') === '1') {
          card.classList.add('active');
        } else {
          card.classList.remove('active');
        }
      });

      // Find new active card to update the HUD telemetry text
      const newActive = cards.find(card => card.getAttribute('data-index') === '1');
      if (indexDisplay && newActive) {
        // Find its original position order in the DOM
        const origPosition = cards.indexOf(newActive) + 1;
        const tagText = newActive.querySelector('.card-tag').textContent.replace('#', '').toUpperCase();
        indexDisplay.textContent = `${origPosition} / ${cards.length} [${tagText}]`;
      }

      isCycling = false;
    }, 600); // matches the 0.6s css transition duration
  });
}

// Initialize Card Stack
initCardStack();

// ----------------------------------------------------
// 10. PRODUCT GALLERY & LIGHTBOX INTERACTIVITY
// ----------------------------------------------------
function initProductGallery() {
  const standardImages = [
    { src: '/src/assets/standar-1.png', label: 'FOTO 1/3: VISTA FRONTAL CERRADA', title: 'Gabinete AITUE Standard - Vista Frontal' },
    { src: '/src/assets/standar-2.png', label: 'FOTO 2/3: DESPIECE / INTERIOR Y CABLEADO', title: 'Gabinete AITUE Standard - Vista Abierta' },
    { src: '/src/assets/standar-3.png', label: 'FOTO 3/3: PLACA INTERNA Y TAPA CUBIERTA', title: 'Gabinete AITUE Standard - Componentes' }
  ];

  const proImages = [
    { src: '/src/assets/pro-1.png', label: 'FOTO 1/3: BASES MAGNÉTICAS 360°', title: 'Gabinete AITUE Pro - Soportes Magnéticos' },
    { src: '/src/assets/pro-2.png', label: 'FOTO 2/3: DESPIECE / BASE Y TORNILLERÍA', title: 'Gabinete AITUE Pro - Despiece Industrial' },
    { src: '/src/assets/pro-3.png', label: 'FOTO 3/3: MONTAJE INTERNO Y SOPORTES', title: 'Gabinete AITUE Pro - Estructura Interna' }
  ];

  function setupCardGallery(cardType, images, mainId, labelId, btnSelector, lightboxTriggerId) {
    const mainImg = document.getElementById(mainId);
    const labelSpan = document.getElementById(labelId);
    const thumbBtns = document.querySelectorAll(btnSelector);
    const openLightboxBtn = document.getElementById(lightboxTriggerId);

    let localIndex = 0;

    thumbBtns.forEach((btn, idx) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        thumbBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const src = btn.getAttribute('data-src');
        const label = btn.getAttribute('data-label');

        if (mainImg) {
          mainImg.style.opacity = '0';
          setTimeout(() => {
            mainImg.src = src;
            mainImg.style.opacity = '1';
          }, 150);
        }
        if (labelSpan) {
          labelSpan.textContent = label;
        }
        localIndex = idx;
      });
    });

    function launchLightbox() {
      openLightboxWithGallery(images, localIndex);
    }

    if (openLightboxBtn) {
      openLightboxBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        launchLightbox();
      });
    }

    if (mainImg) {
      mainImg.addEventListener('click', (e) => {
        e.stopPropagation();
        launchLightbox();
      });
    }
  }

  // Setup Standard Card Gallery
  setupCardGallery('standard', standardImages, 'standard-gallery-main', 'standard-gallery-label', '.product-thumb-btn:not(.pro-thumb)', 'open-lightbox-standard');

  // Setup Pro Card Gallery
  setupCardGallery('pro', proImages, 'pro-gallery-main', 'pro-gallery-label', '.pro-thumb', 'open-lightbox-pro');

  // Lightbox Shared Modal Logic
  let activeGalleryImages = [];
  let activeGalleryIndex = 0;

  const lightboxModal = document.getElementById('product-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCounter = document.getElementById('lightbox-counter');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const lightboxBackdrop = document.getElementById('lightbox-backdrop');
  const lightboxPrevBtn = document.getElementById('lightbox-prev-btn');
  const lightboxNextBtn = document.getElementById('lightbox-next-btn');

  function updateLightbox() {
    if (!activeGalleryImages.length) return;
    const currentData = activeGalleryImages[activeGalleryIndex];
    if (lightboxImg) lightboxImg.src = currentData.src;
    if (lightboxTitle) lightboxTitle.textContent = currentData.title;
    if (lightboxCaption) lightboxCaption.textContent = currentData.label;
    if (lightboxCounter) lightboxCounter.textContent = `${activeGalleryIndex + 1} / ${activeGalleryImages.length}`;
  }

  function openLightboxWithGallery(imagesList, initialIndex) {
    if (!lightboxModal) return;
    activeGalleryImages = imagesList;
    activeGalleryIndex = initialIndex || 0;
    updateLightbox();
    lightboxModal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightboxModal) return;
    lightboxModal.classList.remove('active');
    document.body.style.overflow = '';
  }

  if (lightboxCloseBtn) lightboxCloseBtn.addEventListener('click', closeLightbox);
  if (lightboxBackdrop) lightboxBackdrop.addEventListener('click', closeLightbox);

  if (lightboxPrevBtn) {
    lightboxPrevBtn.addEventListener('click', () => {
      if (!activeGalleryImages.length) return;
      activeGalleryIndex = (activeGalleryIndex - 1 + activeGalleryImages.length) % activeGalleryImages.length;
      updateLightbox();
    });
  }

  if (lightboxNextBtn) {
    lightboxNextBtn.addEventListener('click', () => {
      if (!activeGalleryImages.length) return;
      activeGalleryIndex = (activeGalleryIndex + 1) % activeGalleryImages.length;
      updateLightbox();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!lightboxModal || !lightboxModal.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && activeGalleryImages.length) {
      activeGalleryIndex = (activeGalleryIndex - 1 + activeGalleryImages.length) % activeGalleryImages.length;
      updateLightbox();
    }
    if (e.key === 'ArrowRight' && activeGalleryImages.length) {
      activeGalleryIndex = (activeGalleryIndex + 1) % activeGalleryImages.length;
      updateLightbox();
    }
  });
}

initProductGallery();

// ----------------------------------------------------
// 11. PRODUCT HOVER POPUP INTERACTIVITY (STANDARD & PRO)
// ----------------------------------------------------
function initHoverDetails() {
  function setupHoverPopover(cardId, hintId, popoverId, closeId, backdropId) {
    const cardContainer = document.getElementById(cardId);
    const hoverHint = document.getElementById(hintId);
    const popover = document.getElementById(popoverId);
    const closeBtn = document.getElementById(closeId);
    const backdrop = document.getElementById(backdropId);

    if (!cardContainer || !popover) return;

    let hoverTimer = null;

    function openPopover() {
      popover.classList.add('active');
      document.body.style.overflow = 'hidden';
      if (hoverHint) hoverHint.classList.remove('active-hover');
    }

    function closePopover() {
      popover.classList.remove('active');
      document.body.style.overflow = '';
    }

    cardContainer.addEventListener('mouseenter', () => {
      if (hoverHint) hoverHint.classList.add('active-hover');
      hoverTimer = setTimeout(() => {
        openPopover();
      }, 1400);
    });

    cardContainer.addEventListener('mouseleave', () => {
      if (hoverHint) hoverHint.classList.remove('active-hover');
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
    });

    if (hoverHint) {
      hoverHint.addEventListener('click', (e) => {
        e.stopPropagation();
        openPopover();
      });
    }

    if (closeBtn) closeBtn.addEventListener('click', closePopover);
    if (backdrop) backdrop.addEventListener('click', closePopover);

    document.addEventListener('keydown', (e) => {
      if (popover && popover.classList.contains('active') && e.key === 'Escape') {
        closePopover();
      }
    });
  }

  // Setup Standard Popover
  setupHoverPopover('card-standard-container', 'standard-hover-hint', 'standard-hover-popover', 'popover-close-standard', 'popover-backdrop-standard');

  // Setup Pro Popover
  setupHoverPopover('card-pro-container', 'pro-hover-hint', 'pro-hover-popover', 'popover-close-pro', 'popover-backdrop-pro');
}

initHoverDetails();

// ----------------------------------------------------
// 12. NETWORK CONSTELLATION BACKGROUND ANIMATION
// ----------------------------------------------------
function initNetworkConstellation() {
  const canvases = document.querySelectorAll('.products-bg-canvas');
  if (!canvases.length) return;

  canvases.forEach(canvas => {
    const ctx = canvas.getContext('2d');
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    let isVisible = false;
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => { isVisible = entry.isIntersecting; });
      }, { threshold: 0.05 });
      observer.observe(canvas);
    } else {
      isVisible = true;
    }

    // Resize handler
    window.addEventListener('resize', () => {
      if (canvas.offsetWidth > 0) {
        width = canvas.width = canvas.offsetWidth;
        height = canvas.height = canvas.offsetHeight;
      }
    });

    const nodes = [];
    const maxNodes = 25;
    const connectionDistance = 140;

    // Pulse Rings Array
    const pulses = [];
    const maxPulses = 4;

    class Node {
      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.45;
        this.vy = (Math.random() - 0.5) * 0.45;
        this.radius = Math.random() * 2.5 + 1.5;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off walls
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#59A8FF';
        ctx.shadowColor = '#59A8FF';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0; // reset
      }
    }

    class PulseRing {
      constructor(x, y) {
        this.x = x || Math.random() * width;
        this.y = y || Math.random() * height;
        this.radius = 1;
        this.maxRadius = Math.random() * 40 + 25;
        this.opacity = 1;
        this.speed = Math.random() * 0.3 + 0.2;
      }

      update() {
        this.radius += this.speed;
        this.opacity = 1 - this.radius / this.maxRadius;
      }

      draw() {
        ctx.strokeStyle = `rgba(89, 168, 255, ${this.opacity * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Double ring effect
        if (this.radius > 10) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.35})`;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius - 8, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
    }

    // Populate Nodes
    for (let i = 0; i < maxNodes; i++) {
      nodes.push(new Node());
    }

    // Spawn periodic pulse rings
    setInterval(() => {
      if (pulses.length < maxPulses) {
        if (nodes.length > 0 && Math.random() > 0.4) {
          const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
          pulses.push(new PulseRing(randomNode.x, randomNode.y));
        } else {
          pulses.push(new PulseRing());
        }
      }
    }, 1800);

    function animate() {
      if (!isVisible) {
        requestAnimationFrame(animate);
        return;
      }
      ctx.clearRect(0, 0, width, height);

      // Draw grid lines
      ctx.strokeStyle = 'rgba(89, 168, 255, 0.025)';
      ctx.lineWidth = 0.5;
      const gridSize = 80;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Update and draw pulse rings
      for (let i = pulses.length - 1; i >= 0; i--) {
        const p = pulses[i];
        p.update();
        p.draw();
        if (p.radius >= p.maxRadius) {
          pulses.splice(i, 1);
        }
      }

      // Connect nodes
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = n1.x - n2.x;
          if (Math.abs(dx) >= connectionDistance) continue;
          const dy = n1.y - n2.y;
          if (Math.abs(dy) >= connectionDistance) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDistance) {
            const alpha = 1 - dist / connectionDistance;
            ctx.strokeStyle = `rgba(89, 168, 255, ${alpha * 0.15})`;
            ctx.lineWidth = alpha * 0.85;
            ctx.beginPath();
            ctx.moveTo(n1.x, n1.y);
            ctx.lineTo(n2.x, n2.y);
            ctx.stroke();
          }
        }
      }

      // Draw and update nodes
      nodes.forEach((node) => {
        node.update();
        node.draw();
      });

      requestAnimationFrame(animate);
    }

    animate();
  });
}

initNetworkConstellation();

// Initial total calc
calculateTotal();

// ─────────────────────────────────────────────────────────────
// PRODUCT TABS — switching logic
// ─────────────────────────────────────────────────────────────
document.querySelectorAll('.prod-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    const target = tab.dataset.tab;
    document.querySelectorAll('.prod-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.prod-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    const panel = document.getElementById('panel-' + target);
    if (panel) panel.classList.add('active');
  });
});

// New product thumbnail handler (prod-thumb class)
document.querySelectorAll('.prod-thumb').forEach(btn => {
  btn.addEventListener('click', () => {
    const src = btn.dataset.src;
    const targetId = btn.dataset.target;
    const mainImg = document.getElementById(targetId);
    if (mainImg && src) {
      mainImg.style.opacity = '0';
      setTimeout(() => {
        mainImg.src = src;
        mainImg.style.opacity = '1';
      }, 200);
    }
    // Update active state within the same thumb row
    const row = btn.closest('.prod-thumb-row');
    if (row) {
      row.querySelectorAll('.prod-thumb').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    }
  });
});

// ─────────────────────────────────────────────────────────────
// TRUST STRIP — animated counter
// ─────────────────────────────────────────────────────────────
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1200;
  const start = performance.now();
  function step(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(eased * target);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.trust-num[data-target]').forEach(el => {
  counterObserver.observe(el);
});


// ─────────────────────────────────────────────────────────────
// (Disabled) Scroll Reveal Observer
// const revealObserver = new IntersectionObserver((entries) => {
//   entries.forEach(entry => {
//     if (entry.isIntersecting) {
//       entry.target.classList.add('visible');
//     }
//   });
// }, {
//   threshold: 0.12,
//   rootMargin: '0px 0px -40px 0px'
// });
// 
// document.querySelectorAll('.reveal-item').forEach(el => {
//   revealObserver.observe(el);
// });

// ─────────────────────────────────────────────────────────────
// SCROLL INDICATOR CLICK — smooth scroll to next section
// ─────────────────────────────────────────────────────────────
const scrollIndicator = document.querySelector('.hero-scroll-indicator');
if (scrollIndicator) {
  scrollIndicator.addEventListener('click', () => {
    const productsSection = document.querySelector('.star-products-section');
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth' });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// ACCORDION GALLERY INTERACTION
// ─────────────────────────────────────────────────────────────
(function initAccordionGallery() {
  const accordionCards = document.querySelectorAll('.accordion-card');
  if (accordionCards.length === 0) return;

  accordionCards.forEach(card => {
    // Hover event for desktop
    card.addEventListener('mouseenter', () => {
      accordionCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });

    // Touch/click event for mobile and fallback
    card.addEventListener('click', () => {
      accordionCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
    });
  });
})();


// ─────────────────────────────────────────────────────────────
// GRADIENT WAVES BACKGROUND ANIMATION (FOOTER)
// ─────────────────────────────────────────────────────────────
(function initFooterWaves() {
  const canvas = document.getElementById('footer-waves-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  let isVisible = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { isVisible = entry.isIntersecting; });
    }, { threshold: 0.05 });
    observer.observe(canvas);
  } else {
    isVisible = true;
  }

  // Resize handler
  window.addEventListener('resize', () => {
    if (canvas.offsetWidth > 0) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  });

  // Define Wave configuration (overlapping layers)
  // We use gradients that match the site theme (cyan, magenta, deep blue)
  const waveLayers = [
    {
      baseY: 0.55,      // Position in canvas (55% from top)
      amplitude: 38,     // Height of the sine wave
      wavelength: 0.003, // Wavelength frequency
      speed: 0.007,      // Speed of shifting phase
      phase: 0,
      gradientColors: ['rgba(0, 240, 255, 0.22)', 'rgba(89, 168, 255, 0.01)'] // Cyan to transparent
    },
    {
      baseY: 0.62,
      amplitude: 28,
      wavelength: 0.0045,
      speed: -0.005,
      phase: Math.PI / 4,
      gradientColors: ['rgba(217, 70, 239, 0.18)', 'rgba(89, 168, 255, 0.01)'] // Magenta to transparent
    },
    {
      baseY: 0.48,
      amplitude: 45,
      wavelength: 0.002,
      speed: 0.0035,
      phase: Math.PI * 1.2,
      gradientColors: ['rgba(89, 168, 255, 0.25)', 'rgba(7, 22, 47, 0.01)'] // Blue to transparent
    }
  ];

  function animate() {
    if (!isVisible) {
      requestAnimationFrame(animate);
      return;
    }
    ctx.clearRect(0, 0, width, height);

    // Render each wave layer
    waveLayers.forEach(wave => {
      ctx.beginPath();

      // Starting point at bottom left
      ctx.moveTo(0, height);

      // Draw bezier-like sin curve across the width of canvas
      for (let x = 0; x <= width; x += 8) {
        // base y coordinate
        const targetBaseY = height * wave.baseY;
        // add sinusoidal displacement
        const y = targetBaseY + Math.sin(x * wave.wavelength + wave.phase) * wave.amplitude;
        ctx.lineTo(x, y);
      }

      // Connect to bottom right and bottom left to close the fill region
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      // Create vertical gradient matching the wave top coordinate down to bottom
      const gradient = ctx.createLinearGradient(0, height * wave.baseY - wave.amplitude, 0, height);
      gradient.addColorStop(0, wave.gradientColors[0]);
      gradient.addColorStop(1, wave.gradientColors[1]);

      ctx.fillStyle = gradient;
      ctx.fill();

      // Shift phase for the next frame
      wave.phase += wave.speed;
    });

    requestAnimationFrame(animate);
  }

  animate();
})();

// ─────────────────────────────────────────────────────────────
// GRADIENT WAVES BACKGROUND ANIMATION (HEADER)
// ─────────────────────────────────────────────────────────────
(function initHeaderWaves() {
  const canvas = document.getElementById('header-waves-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = canvas.offsetWidth);
  let height = (canvas.height = canvas.offsetHeight);

  let isVisible = true;

  // Resize handler
  window.addEventListener('resize', () => {
    if (canvas.offsetWidth > 0) {
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    }
  });

  // Wave configuration (very subtle, matching footer)
  const waveLayers = [
    {
      baseY: 0.85,      // Position near bottom of header
      amplitude: 10,     // Gentle wave amplitude
      wavelength: 0.003,
      speed: 0.007,
      phase: 0,
      gradientColors: ['rgba(0, 240, 255, 0.08)', 'rgba(7, 22, 47, 0.01)']
    },
    {
      baseY: 0.9,
      amplitude: 7,
      wavelength: 0.0045,
      speed: -0.005,
      phase: Math.PI / 4,
      gradientColors: ['rgba(217, 70, 239, 0.06)', 'rgba(7, 22, 47, 0.01)']
    },
    {
      baseY: 0.8,
      amplitude: 12,
      wavelength: 0.002,
      speed: 0.0035,
      phase: Math.PI * 1.2,
      gradientColors: ['rgba(89, 168, 255, 0.1)', 'rgba(7, 22, 47, 0.01)']
    }
  ];

  function animate() {
    if (!isVisible) {
      requestAnimationFrame(animate);
      return;
    }
    // Dynamically adjust height to header shrink animations (80px vs 65px)
    if (canvas.offsetHeight !== height) {
      height = canvas.height = canvas.offsetHeight;
    }
    ctx.clearRect(0, 0, width, height);

    waveLayers.forEach(wave => {
      ctx.beginPath();
      // Start at top left
      ctx.moveTo(0, 0);

      // Draw bezier-like sin curve across the width of canvas
      for (let x = 0; x <= width; x += 8) {
        const targetBaseY = height * wave.baseY;
        const y = targetBaseY + Math.sin(x * wave.wavelength + wave.phase) * wave.amplitude;
        ctx.lineTo(x, y);
      }

      // Connect to top right and top left to close region
      ctx.lineTo(width, 0);
      ctx.lineTo(0, 0);
      ctx.closePath();

      // Create vertical gradient matching top to wave edge
      const gradient = ctx.createLinearGradient(0, 0, 0, height * wave.baseY + wave.amplitude);
      gradient.addColorStop(0, wave.gradientColors[0]);
      gradient.addColorStop(1, wave.gradientColors[1]);

      ctx.fillStyle = gradient;
      ctx.fill();

      // Shift phase
      wave.phase += wave.speed;
    });

    requestAnimationFrame(animate);
  }

  animate();
})();

// LETTER GLITCH BACKGROUND ANIMATION (WHY AITUE)
// ─────────────────────────────────────────────────────────────
(function initWhyGlitch() {
  const canvas = document.getElementById('why-glitch-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  let isVisible = false;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { isVisible = entry.isIntersecting; });
    }, { threshold: 0.05 });
    observer.observe(canvas);
  } else {
    isVisible = true;
  }

  // Custom glitch colors matching AITUE's dark theme (dark blue, cyan, light blue, magenta)
  const glitchColors = ['#1e293b', '#00f0ff', '#89a8ff', '#d946ef'];
  const glitchSpeed = 80;
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ!@#$&*()-_+=/[]{};:<>.,0123456789';
  const charList = Array.from(characters);

  const fontSize = 22;
  const charWidth = 14;
  const charHeight = 26;

  let width = 0;
  let height = 0;
  let columns = 0;
  let rows = 0;
  let letters = [];
  let animationFrameId = null;
  let lastGlitchTime = Date.now();

  const getRandomChar = () => charList[Math.floor(Math.random() * charList.length)];
  const getRandomColor = () => glitchColors[Math.floor(Math.random() * glitchColors.length)];

  const hexToRgb = (hex) => {
    if (hex.startsWith('rgb')) {
      const match = hex.match(/\d+/g);
      return match ? { r: parseInt(match[0]), g: parseInt(match[1]), b: parseInt(match[2]) } : null;
    }
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    const cleanHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(cleanHex);
    return result ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : null;
  };

  const interpolateColor = (start, end, factor) => {
    return `rgb(${Math.round(start.r + (end.r - start.r) * factor)}, ${Math.round(start.g + (end.g - start.g) * factor)}, ${Math.round(start.b + (end.b - start.b) * factor)})`;
  };

  const resizeCanvas = () => {
    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    width = rect.width;
    height = rect.height;
    columns = Math.ceil(width / charWidth);
    rows = Math.ceil(height / charHeight);

    const totalLetters = columns * rows;
    letters = Array.from({ length: totalLetters }, () => {
      const color = getRandomColor();
      return {
        char: getRandomChar(),
        color: color,
        targetColor: getRandomColor(),
        colorProgress: 1
      };
    });

    drawLetters();
  };

  const drawLetters = () => {
    if (letters.length === 0) return;
    ctx.clearRect(0, 0, width, height);
    ctx.font = `${fontSize}px monospace`;
    ctx.textBaseline = 'top';

    letters.forEach((letter, index) => {
      const x = (index % columns) * charWidth;
      const y = Math.floor(index / columns) * charHeight;
      ctx.fillStyle = letter.color;
      ctx.fillText(letter.char, x, y);
    });
  };

  const updateLetters = () => {
    if (letters.length === 0) return;
    const updateCount = Math.max(1, Math.floor(letters.length * 0.04));

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * letters.length);
      if (!letters[index]) continue;
      letters[index].char = getRandomChar();
      letters[index].targetColor = getRandomColor();
      letters[index].colorProgress = 0;
    }
  };

  const handleSmoothTransitions = () => {
    let needsRedraw = false;
    letters.forEach(letter => {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.1;
        if (letter.colorProgress > 1) letter.colorProgress = 1;

        const startRgb = hexToRgb(letter.color);
        const endRgb = hexToRgb(letter.targetColor);
        if (startRgb && endRgb) {
          letter.color = interpolateColor(startRgb, endRgb, letter.colorProgress);
          needsRedraw = true;
        }
      }
    });

    if (needsRedraw) {
      drawLetters();
    }
  };

  const animate = () => {
    if (!isVisible) {
      animationFrameId = requestAnimationFrame(animate);
      return;
    }
    const now = Date.now();
    if (now - lastGlitchTime >= glitchSpeed) {
      updateLetters();
      drawLetters();
      lastGlitchTime = now;
    }

    handleSmoothTransitions();
    animationFrameId = requestAnimationFrame(animate);
  };

  resizeCanvas();
  animate();

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cancelAnimationFrame(animationFrameId);
      resizeCanvas();
      animate();
    }, 100);
  });
})();

// ----------------------------------------------------
// MOVING NETWORK CONSTELLATION BACKGROUND (WHY AITUE)
// ----------------------------------------------------
(function initWhyNetworkCanvas() {
  const canvas = document.getElementById('why-network-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let particles = [];
  let animFrameId = null;

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const rect = parent.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    canvas.width = width;
    canvas.height = height;

    const count = Math.min(Math.floor((width * height) / 11000), 70);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2 + 1.2,
      color: Math.random() > 0.35 ? 'rgba(89, 168, 255, ' : 'rgba(0, 245, 212, ',
      alpha: Math.random() * 0.65 + 0.3
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 135) {
          const lineAlpha = (1 - dist / 135) * 0.3;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(89, 168, 255, ${lineAlpha})`;
          ctx.lineWidth = 0.85;
          ctx.stroke();
        }
      }
    }

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > width) p.vx *= -1;
      if (p.y < 0 || p.y > height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = `${p.color}${p.alpha})`;
      ctx.shadowBlur = 8;
      ctx.shadowColor = p.color + '0.8)';
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    animFrameId = requestAnimationFrame(draw);
  }

  resize();
  draw();

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(animFrameId);
      resize();
      draw();
    }, 150);
  });
})();



