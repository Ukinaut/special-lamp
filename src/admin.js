import { escapeHtml } from './services/safe-html.js';
// Styles are loaded directly via link rel="stylesheet" in admin.html
import { OpenAIService } from './services/openai.js';
import { KnowledgeService } from './services/knowledge.js';
import { initMemoryRagPanel } from './memory-rag-panel.js';
import { UsersService } from './services/users.js';

const ADMIN_SESSION_KEY = 'aitue_admin_session';

document.addEventListener('DOMContentLoaded', () => {

  // ----------------------------------------------------
  // DOM ELEMENTS
  // ----------------------------------------------------
  const loginView = document.getElementById('admin-login-view');
  const dashboardView = document.getElementById('admin-dashboard-view');
  const loginForm = document.getElementById('admin-login-form');
  const loginEmailInput = document.getElementById('login-email');
  const loginPasswordInput = document.getElementById('login-password');
  const loginFeedbackMsg = document.getElementById('login-feedback-msg');
  const logoutBtn = document.getElementById('admin-logout-btn');
  const userDisplay = document.getElementById('admin-user-display');

  const tabBtns = document.querySelectorAll('.sidebar-nav-item, .tab-btn');
  const tabViews = document.querySelectorAll('.tab-content-view');
  const launcherCards = document.querySelectorAll('.hub-launcher-card, [data-launch]');

  // Header Bot & API status DOM
  const globalBotToggle = document.getElementById('global-bot-toggle');
  const botStatusBadge = document.getElementById('bot-status-badge');
  const headerRestartBotBtn = document.getElementById('header-restart-bot-btn');
  const apiStatusDot = document.getElementById('api-status-dot');
  const apiStatusText = document.getElementById('api-status-text');
  const sidebarLiveCount = document.getElementById('sidebar-live-count');

  // OpenAI tab DOM
  const cfgApiKey = document.getElementById('cfg-api-key');
  const cfgWhisperKey = document.getElementById('cfg-whisper-key');
  const cfgModel = document.getElementById('cfg-model');
  const cfgMaxTokens = document.getElementById('cfg-max-tokens');
  const cfgTemperature = document.getElementById('cfg-temperature');
  const tempValDisplay = document.getElementById('temp-val-display');
  const toggleShowKeyBtn = document.getElementById('toggle-show-key');
  const openaiTestFeedback = document.getElementById('openai-test-feedback');
  const testOpenAiBtn = document.getElementById('test-openai-btn');

  // Prompts config
  const promptWebAssistant = document.getElementById('prompt-web-assistant');
  const saveWebPromptBtn = document.getElementById('save-web-prompt-btn');
  const promptWpBot = document.getElementById('prompt-wp-bot');
  const saveWpPromptBtn = document.getElementById('save-wp-prompt-btn');

  const openaiStatusText = document.getElementById('openai-status-text');
  const openaiStatusPill = document.getElementById('openai-status-pill');

  // Knowledge Base RAG DOM
  const addKbForm = document.getElementById('add-kb-form');
  const kbCategory = document.getElementById('kb-category');
  const kbTitle = document.getElementById('kb-title');
  const kbContent = document.getElementById('kb-content');
  const kbCardsContainer = document.getElementById('kb-cards-container');
  const kbSearchInput = document.getElementById('kb-search-input');
  let knowledgeRevision;
  let editingKnowledgeRevision;
  async function refreshKnowledge() {
    const data = await KnowledgeService.fetchServerKnowledge();
    knowledgeRevision = data.revision;
    renderKnowledgeCards(kbSearchInput?.value.trim() || '');
  }
  const memoryRagPanel = initMemoryRagPanel({ document, fetchImpl: (...args) => fetch(...args), onRefresh: refreshKnowledge });

  // WhatsApp QR DOM
  const wpQrImg = document.getElementById('wp-qr-img');
  const qrOverlayStatus = document.getElementById('qr-overlay-status');
  const connectedPhoneDisplay = document.getElementById('connected-phone-display');
  const regenerateQrBtn = document.getElementById('regenerate-qr-btn');
  const togglePauseBotBtn = document.getElementById('toggle-pause-bot-btn');
  const disconnectWpBtn = document.getElementById('disconnect-wp-btn');
  const qrStatusLabel = document.getElementById('qr-status-label');
  const wpQrStatusPill = document.getElementById('wp-qr-status-pill');
  const wpQrStatusText = document.getElementById('wp-qr-status-text');
  const simWpNumberTag = document.getElementById('sim-wp-number-tag');

  // Live Chat Hub DOM
  const threadsContainer = document.getElementById('livechat-threads-container');
  const activeChatView = document.getElementById('livechat-view-active');
  const activeChatEmpty = document.getElementById('livechat-view-empty');
  const activeChatName = document.getElementById('active-chat-name');
  const activeChatChannel = document.getElementById('active-chat-channel');
  const activeChatBotToggle = document.getElementById('active-chat-bot-toggle');
  const activeChatCloseBtn = document.getElementById('active-chat-close-btn');
  const activeChatMessages = document.getElementById('active-chat-messages');
  const liveChatInputForm = document.getElementById('livechat-input-form');
  const liveChatMsgInput = document.getElementById('livechat-msg-input');
  const liveChatSearch = document.getElementById('livechat-search');

  // CRM COLLAPSIBLE PANEL DOM
  const crmPanel = document.getElementById('livechat-crm-panel');
  const crmClientId = document.getElementById('crm-client-id');
  const crmClientName = document.getElementById('crm-client-name');
  const crmClientCompany = document.getElementById('crm-client-company');
  const crmClientEmail = document.getElementById('crm-client-email');
  const crmClientPhone = document.getElementById('crm-client-phone');
  const crmClientTag = document.getElementById('crm-client-tag');
  const crmClientStatus = document.getElementById('crm-client-status');
  const crmClientProducts = document.getElementById('crm-client-products');
  const crmClientDevices = document.getElementById('crm-client-devices');
  const crmClientQueries = document.getElementById('crm-client-queries');
  const crmClientProblems = document.getElementById('crm-client-problems');
  const crmClientInterests = document.getElementById('crm-client-interests');
  const crmClientNotes = document.getElementById('crm-client-notes');
  const crmApptDate = document.getElementById('crm-appt-date');
  const crmApptTime = document.getElementById('crm-appt-time');
  const crmApptOperator = document.getElementById('crm-appt-operator');
  const crmApptArea = document.getElementById('crm-appt-area');
  const crmApptNotes = document.getElementById('crm-appt-notes');
  const crmSaveProfileBtn = document.getElementById('crm-save-profile-btn');

  // CRM DIRECTORY TAB DOM
  const crmManualClientForm = document.getElementById('crm-manual-client-form');
  const crmDirectoryTableBody = document.getElementById('crm-directory-table-body');
  const crmDirectorySearch = document.getElementById('crm-directory-search');

  // APPOINTMENTS TAB DOM
  const apptRulesForm = document.getElementById('appt-rules-form');
  const apptOpenTime = document.getElementById('appt-open-time');
  const apptCloseTime = document.getElementById('appt-close-time');
  const apptDuration = document.getElementById('appt-duration');
  const apptAdvanceHours = document.getElementById('appt-advance-hours');
  const apptMaxConcurrent = document.getElementById('appt-max-concurrent');
  const apptBlockedDates = document.getElementById('appt-blocked-dates');
  const apptsTableBody = document.getElementById('appts-table-body');

  // OPERATORS TAB DOM
  const addUserForm = document.getElementById('add-user-form');
  const usrName = document.getElementById('usr-name');
  const usrPhone = document.getElementById('usr-phone');
  const usrArea = document.getElementById('usr-area');
  const usersTableBody = document.getElementById('users-table-body');

  // CYBERPUNK METRICS DOM
  const metricTotalChats = document.getElementById('metric-total-chats');
  const logsTableBody = document.getElementById('logs-table-body');
  const clearLogsBtn = document.getElementById('clear-logs-btn');
  const headerOperatorToggleBtn = document.getElementById('header-operator-toggle-btn');

  const mockConversationsCount = document.getElementById('mock-conversations-count');
  const mockCustomersCount = document.getElementById('mock-customers-count');
  const mockLeadsCount = document.getElementById('mock-leads-count');
  const mockProgressBarFill = document.getElementById('mock-progress-bar-fill');
  const mockIaResolvedPct = document.getElementById('mock-ia-resolved-pct');
  const mockHumanResolvedPct = document.getElementById('mock-human-resolved-pct');
  const mockPendingResolvedPct = document.getElementById('mock-pending-resolved-pct');
  const statsSalesCount = document.getElementById('stats-sales-count');
  const statsTechCount = document.getElementById('stats-tech-count');

  // State Variables
  let isWpConnected = false;
  let activeConnectedPhone = '+54 9 11 5456-5634';
  let isBotPausedState = false;
  let selectedChatId = null;
  let liveChatsList = [];
  let operatorsList = [];
  let customersList = [];
  let appointmentsList = [];

  // ----------------------------------------------------
  // 1. CENTRALIZED TAB SWITCHING FUNCTION
  // ----------------------------------------------------
  function switchToTab(targetTabId) {
    if (!targetTabId) return;

    tabBtns.forEach(b => {
      if (b.getAttribute('data-tab') === targetTabId) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    tabViews.forEach(v => {
      if (v.id === targetTabId) {
        v.classList.add('active');
      } else {
        v.classList.remove('active');
      }
    });

    // Load corresponding tab contents
    if (targetTabId === 'tab-live-chats') {
      loadLiveChats();
    } else if (targetTabId === 'tab-crm-directory') {
      loadCrmDirectory();
    } else if (targetTabId === 'tab-appointments') {
      loadAppointments();
      loadAppointmentConfig();
    } else if (targetTabId === 'tab-knowledge') {
      renderKnowledgeCards();
      memoryRagPanel.load();
    } else if (targetTabId === 'tab-users') {
      loadOperators();
    } else if (targetTabId === 'tab-analytics') {
      loadCyberpunkMetrics();
      renderLogs();
    }
  }

  // Attach tab button listeners
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      switchToTab(targetTabId);
    });
  });

  // Attach launcher cards listeners (Command Center launcher cards)
  launcherCards.forEach(card => {
    card.addEventListener('click', (e) => {
      e.preventDefault();
      const targetTab = card.getAttribute('data-launch') || card.closest('[data-launch]')?.getAttribute('data-launch');
      if (targetTab) {
        switchToTab(targetTab);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });

  // ----------------------------------------------------
  // HEADER STATUS CONTROLS (BOT TOGGLE, API STATUS & RESTART)
  // ----------------------------------------------------
  async function updateHeaderStatus() {
    try {
      const res = await fetch('/api/admin/status');
      if (res.ok) {
        const data = await res.json();
        const status = data.status;

        if (globalBotToggle) {
          globalBotToggle.checked = !status.isBotPaused;
        }
        if (botStatusBadge) {
          botStatusBadge.textContent = status.isBotPaused ? 'OFF' : 'ON';
          botStatusBadge.className = status.isBotPaused ? 'badge-status-off' : 'badge-status-on';
        }
        if (simWpNumberTag) {
          simWpNumberTag.textContent = `${status.connectedPhone || 'Desconectado'} // ${status.isBotPaused ? 'PAUSADO' : 'ONLINE'}`;
        }
      }
    } catch (err) {
      console.warn('Error actualizando estado del header:', err);
    }
  }

  if (globalBotToggle) {
    globalBotToggle.addEventListener('change', async () => {
      const isEnabled = globalBotToggle.checked;
      try {
        const res = await fetch('/api/admin/toggle-bot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paused: !isEnabled })
        });
        if (res.ok) {
          await updateHeaderStatus();
        }
      } catch (err) {
        console.warn('Error cambiando estado del bot:', err);
      }
    });
  }

  if (headerRestartBotBtn) {
    headerRestartBotBtn.addEventListener('click', async () => {
      const restartIcon = headerRestartBotBtn.querySelector('.restart-icon');
      const restartText = headerRestartBotBtn.querySelector('.restart-text');

      headerRestartBotBtn.disabled = true;
      if (restartIcon) restartIcon.style.display = 'inline-block';
      if (restartText) restartText.textContent = 'Reiniciando...';

      try {
        const res = await fetch('/api/admin/restart-bot', { method: 'POST' });
        if (res.ok) {
          if (restartText) restartText.textContent = '¡Reiniciado!';
        } else {
          if (restartText) restartText.textContent = 'Error al reiniciar';
        }
      } catch (err) {
        if (restartText) restartText.textContent = 'Error de servidor';
      } finally {
        setTimeout(() => {
          headerRestartBotBtn.disabled = false;
          if (restartText) restartText.textContent = 'Reiniciar Bot';
        }, 1800);
      }
    });
  }

  async function checkApiStatus() {
    try {
      const res = await fetch('/api/whatsapp/status');
      const data = res.ok ? await res.json() : {};
      if (data.status === 'CONNECTED') {
        if (apiStatusDot) { apiStatusDot.className = 'status-indicator status-online'; }
        if (apiStatusText) { apiStatusText.textContent = 'WhatsApp: Vinculado'; }
      } else {
        if (apiStatusDot) { apiStatusDot.className = 'status-indicator status-offline'; }
        if (apiStatusText) { apiStatusText.textContent = data.status === 'SCAN_QR' ? 'WhatsApp: Esperando QR' : 'WhatsApp: Desconectado'; }
      }
    } catch (e) {
      if (apiStatusDot) { apiStatusDot.className = 'status-indicator status-offline'; }
      if (apiStatusText) { apiStatusText.textContent = 'WhatsApp: Desconectado'; }
    }
  }

  // Poll API and Header status every 15 seconds
  setInterval(() => {
    checkApiStatus();
    updateHeaderStatus();
  }, 15000);

  checkApiStatus();
  updateHeaderStatus();

  // ----------------------------------------------------
  // 2. SESSION & LOGIN MANAGEMENT (ACCESO DIRECTO LIBRE)
  // ----------------------------------------------------
  let dashboardInitialized = false;
  let isAdminAuthenticated = false;
  async function checkSession() {
    try {
      const res = await fetch('/api/auth/session', { credentials: 'same-origin' });
      if (res.status === 401) {
        isAdminAuthenticated = false;
        if (loginView) loginView.style.display = 'flex';
        if (dashboardView) dashboardView.style.display = 'none';
        return;
      }
      if (!res.ok) throw new Error('Iniciá sesión.');
      const data = await res.json();
      isAdminAuthenticated = true;
      if (userDisplay) userDisplay.textContent = data.user;
      if (loginView) loginView.style.display = 'none';
      if (dashboardView) dashboardView.style.display = 'grid';
      if (!dashboardInitialized) { await initDashboardData(); dashboardInitialized = true; }
    } catch (err) {
      isAdminAuthenticated = false;
      if (loginView) loginView.style.display = 'flex';
      if (dashboardView) dashboardView.style.display = 'none';
    }
  }

  async function performLogin() {
    const emailVal = (loginEmailInput?.value || '').trim();
    const passVal = loginPasswordInput?.value || '';

    if (!emailVal || !passVal) {
      showLoginMsg('Ingresá el correo de usuario y la contraseña de administración.', 'error');
      return;
    }

    try {
      showLoginMsg('Verificando credenciales...', 'info');
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ email: emailVal, password: passVal })
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Respuesta inválida del servidor. Verificá que el backend esté activo.');
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Usuario o contraseña incorrectos.');

      showLoginMsg('Acceso concedido. Iniciando sesión...', 'success');
      if (loginPasswordInput) loginPasswordInput.value = '';
      await checkSession();
    } catch (err) {
      showLoginMsg(err.message, 'error');
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      performLogin();
    });
  }

  const loginSubmitBtn = document.getElementById('login-submit-btn');
  if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      performLogin();
    });
  }

  // Initial session check on page load
  checkSession();

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await fetch('/api/auth/logout', { method: 'POST' });
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      localStorage.removeItem('aitue_admin_logged_in');
      window.location.href = '/';
    });
  }

  function showLoginMsg(msg, type) {
    if (!loginFeedbackMsg) return;
    loginFeedbackMsg.textContent = msg;
    loginFeedbackMsg.className = `login-msg ${type}`;
  }

  // ----------------------------------------------------
  // 3. DASHBOARD DATA INITIALIZATION & SYNC
  // ----------------------------------------------------
  async function initDashboardData() {
    const config = await OpenAIService.loadConfig();
    if (cfgApiKey) cfgApiKey.value = config.apiKey || '';
    if (cfgWhisperKey) cfgWhisperKey.value = '';
    if (cfgModel) cfgModel.value = config.model || 'meta/llama-3.1-8b-instruct';
    if (cfgMaxTokens) cfgMaxTokens.value = config.maxTokens || 300;
    if (cfgTemperature) cfgTemperature.value = config.temperature || 0.5;
    if (tempValDisplay) tempValDisplay.textContent = config.temperature || 0.5;

    if (promptWebAssistant) promptWebAssistant.value = config.assistantSystemPrompt || '';
    if (promptWpBot) promptWpBot.value = config.wpSystemPrompt || '';

    updateSystemBadges(config);
    
    // Sync live RAG knowledge from backend server first if available
    await refreshKnowledge();

    loadOperators();
    initWpQrCode();
    loadOperatorAvailability();
    updateDashboardKpiStats();
  }

  async function updateDashboardKpiStats() {
    try {
      const [chatsRes, crmRes, apptsRes, statusRes] = await Promise.allSettled([
        fetch('/api/live-chats'),
        fetch('/api/customers'),
        fetch('/api/appointments'),
        fetch('/api/whatsapp/status')
      ]);

      if (chatsRes.status === 'fulfilled' && chatsRes.value.ok) {
        const chats = await chatsRes.value.json();
        const totalElem = document.getElementById('dash-stat-total-chats');
        const quickElem = document.getElementById('dash-quick-chats-count');
        if (totalElem) totalElem.textContent = chats.length;
        if (quickElem) quickElem.textContent = chats.filter(c => c.botPaused).length;
      }

      if (crmRes.status === 'fulfilled' && crmRes.value.ok) {
        const crmData = await crmRes.value.json();
        const crmElem = document.getElementById('dash-stat-crm-count');
        const count = Array.isArray(crmData) ? crmData.length : Object.keys(crmData || {}).length;
        if (crmElem) crmElem.textContent = count;
      }

      if (apptsRes.status === 'fulfilled' && apptsRes.value.ok) {
        const apptsData = await apptsRes.value.json();
        const apptsElem = document.getElementById('dash-stat-appts-count');
        const count = Array.isArray(apptsData) ? apptsData.length : 0;
        if (apptsElem) apptsElem.textContent = count;
      }

      if (statusRes.status === 'fulfilled' && statusRes.value.ok) {
        const statusData = await statusRes.value.json();
        const phoneElem = document.getElementById('dash-connected-phone-text');
        if (phoneElem) phoneElem.textContent = statusData.connectedPhone || (statusData.status === 'CONNECTED' ? 'Conectado (WhatsApp)' : 'Sin vincular');
      }

      const modelElem = document.getElementById('dash-infra-model');
      if (modelElem && cfgModel?.value) {
        modelElem.textContent = cfgModel.value.split('/').pop();
      }
    } catch (e) {
      console.warn('Error cargando estadísticas del dashboard:', e);
    }
  }

  async function syncServerKnowledgeAndPrompt() {
    try {
      const config = OpenAIService.getConfig();
      await OpenAIService.saveConfig({
        model: cfgModel?.value || config.model,
        temperature: Number(cfgTemperature?.value ?? config.temperature),
        maxTokens: Number(cfgMaxTokens?.value ?? config.maxTokens),
        wpSystemPrompt: promptWpBot?.value || config.wpSystemPrompt,
        assistantSystemPrompt: promptWebAssistant?.value || config.assistantSystemPrompt
      });
    } catch (err) { showTestMsg(err.message, 'error'); throw err; }
  }

  function updateSystemBadges(config) {
    if (config.apiKeyConfigured) {
      if (openaiStatusText) openaiStatusText.textContent = `OpenAI: Activo (${config.model})`;
      if (openaiStatusPill) openaiStatusPill.className = 'status-badge-pill active';
    } else {
      if (openaiStatusText) openaiStatusText.textContent = 'OpenAI: Sin API Key';
      if (openaiStatusPill) openaiStatusPill.className = 'status-badge-pill inactive';
    }
  }

  // ----------------------------------------------------
  // 4. LIVE CHATS HUB (ATENCIÓN MANUAL & HANDOFF)
  // ----------------------------------------------------
  async function loadLiveChats() {
    try {
      const res = await fetch('/api/live-chats');
      if (res.ok) {
        liveChatsList = await res.json();
        renderLiveChatThreads();
      }
    } catch (e) {
      console.error('Error cargando Live Chats:', e);
    }
  }

  const liveChatAreaFilter = document.getElementById('livechat-area-filter');

  const AREA_LABELS = {
    PRODUCTO_INFO: '🛒 Productos (Info)',
    PRODUCTO_COMERCIAL: '💼 Ventas',
    PRODUCTO_TECNICO: '🛠️ Soporte Técnico',
    INTERNET_COMERCIAL: '🛰️ Internet Comercial',
    INTERNET_SOPORTE: '📡 Internet Soporte',
    PAGO: '💳 Pagos',
    ENVIO_MERCADOLIBRE: '📦 Envíos / ML',
    B2B: '🏢 B2B / Flotas',
    VISITA_COMERCIAL: '🤝 Visita Comercial',
    EMPRESA_INFO: 'ℹ️ Institucional',
    OPERATIVA: '⚙️ Operativa'
  };

  function renderLiveChatThreads() {
    if (!threadsContainer) return;
    threadsContainer.innerHTML = '';

    const filterText = liveChatSearch ? liveChatSearch.value.toLowerCase().trim() : '';
    const selectedArea = liveChatAreaFilter ? liveChatAreaFilter.value : 'ALL';

    const filtered = liveChatsList.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(filterText) || c.id.toLowerCase().includes(filterText);
      const matchesArea = selectedArea === 'ALL' || (c.primary_area && c.primary_area === selectedArea);
      return matchesSearch && matchesArea;
    });

    if (filtered.length === 0) {
      threadsContainer.innerHTML = '<div style="text-align:center; padding:2rem; color:#64748b; font-size:0.85rem;">No hay chats activos en este filtro.</div>';
      return;
    }

    filtered.forEach(chat => {
      const threadDiv = document.createElement('div');
      threadDiv.className = `livechat-thread-item ${chat.id === selectedChatId ? 'active' : ''}`;
      
      const lastMsgText = chat.lastMessage ? chat.lastMessage.text : 'Sin mensajes';
      const channelLabel = chat.type === 'whatsapp' ? 'WP' : 'WEB';
      const statusBadge = chat.botPaused
        ? `<span class="thread-badge manual">${chat.pauseReason === 'always' ? 'Permanente' : chat.pauseReason === 'human' ? 'Persona' : 'Manual'}</span>`
        : '<span class="thread-badge auto">Auto</span>';

      const areaBadgeText = AREA_LABELS[chat.primary_area] || chat.primary_area || '⚙️ Operativa';
      const confPercent = Math.round((chat.confidence ?? 0) * 100);

      threadDiv.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <span style="font-weight:700; color:#ffffff; font-size:0.9rem;">${escapeHtml(chat.name)}</span>
          <span class="thread-channel-tag ${chat.type}">${channelLabel}</span>
        </div>
        <div style="font-size:0.75rem; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">
          ${escapeHtml(lastMsgText)}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
          <span style="font-size:0.68rem; color:#38bdf8; background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.25); border-radius:4px; padding:2px 6px; font-weight:600;">
            ${escapeHtml(areaBadgeText)} (${confPercent}%)
          </span>
          ${statusBadge}
        </div>
      `;

      threadDiv.addEventListener('click', () => {
        selectedChatId = chat.id;
        document.querySelectorAll('.livechat-thread-item').forEach(el => el.classList.remove('active'));
        threadDiv.classList.add('active');
        openChatSession(chat);
      });

      threadsContainer.appendChild(threadDiv);
    });
  }

  if (liveChatSearch) {
    liveChatSearch.addEventListener('input', renderLiveChatThreads);
  }
  if (liveChatAreaFilter) {
    liveChatAreaFilter.addEventListener('change', renderLiveChatThreads);
  }

  async function openChatSession(chat) {
    if (activeChatEmpty) activeChatEmpty.style.display = 'none';
    if (activeChatView) activeChatView.style.display = 'flex';
    if (crmPanel) crmPanel.style.display = 'block';

    activeChatName.textContent = chat.name;
    activeChatChannel.textContent = chat.type === 'whatsapp' ? 'WHATSAPP BOT // REAL' : 'WEB ASSISTANT // PORTAL';

    updateBotToggleButtonUI(chat.botPaused, chat.pauseReason);
    renderChatMemory({});
    loadChatMessages(chat.id);
    loadCustomerProfileCRM(chat.id);
  }

  function updateBotToggleButtonUI(isPaused, pauseReason = null) {
    if (isPaused) {
      activeChatBotToggle.textContent = pauseReason === 'always'
        ? '🔴 BOT PAUSADO (Permanente)'
        : pauseReason === 'human'
          ? '🔴 BOT PAUSADO (Persona)'
          : '🔴 BOT PAUSADO (Manual)';
      activeChatBotToggle.style.background = 'linear-gradient(135deg, #ff4d6d 0%, #c9184a 100%)';
      activeChatBotToggle.style.borderColor = '#ff4d6d';
    } else {
      activeChatBotToggle.textContent = '🟢 BOT ACTIVO (Auto)';
      activeChatBotToggle.style.background = 'linear-gradient(135deg, #00f5d4 0%, #00bbf9 100%)';
      activeChatBotToggle.style.borderColor = '#00f5d4';
    }
  }

  // Toggle single bot pause
  if (activeChatBotToggle) {
    activeChatBotToggle.addEventListener('click', async () => {
      if (!selectedChatId) return;
      try {
        const chat = liveChatsList.find(c => c.id === selectedChatId);
        const newState = chat ? !chat.botPaused : true;
        
        const res = await fetch(`/api/live-chats/${selectedChatId}/toggle-pause`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paused: newState })
        });
        const data = await res.json();
        if (!res.ok) {
          alert(data.error || 'No se pudo cambiar el estado del bot.');
          return;
        }
        if (chat) {
          chat.botPaused = data.paused;
          chat.pauseReason = data.paused ? data.pauseReason : null;
        }
        updateBotToggleButtonUI(data.paused, data.pauseReason);
        loadLiveChats(); // refresh sidebar badges
      } catch (e) {
        console.error('Error toggling single bot pause:', e);
      }
    });
  }

  async function loadChatMessages(chatId) {
    try {
      const res = await fetch(`/api/live-chats/${chatId}`);
      if (res.ok) {
        const chatData = await res.json();
        if (selectedChatId !== chatId) return;
        renderChatMessagesList(chatData.messages);
        renderChatMemory(chatData);
      }
    } catch (e) {
      console.error('Error obteniendo mensajes del chat:', e);
    }
  }

  function renderChatMemory(chatData) {
    const container = document.getElementById('active-chat-memory');
    const evidence = document.getElementById('active-chat-ai-evidence');
    const labels = { equipo: 'Equipo declarado', producto_interes: 'Producto de interés', uso: 'Uso previsto', requiere_instalacion: 'Necesita instalación' };
    const facts = chatData.assistantMemory?.datos_declarados || {};
    if (container) {
      const rows = Object.entries(labels).filter(([field]) => typeof facts[field]?.valor === 'string').map(([field, label]) => {
        const fact = facts[field];
        const expires = new Date(fact.expiresAt).toLocaleDateString('es-AR');
        return `<div style="margin-bottom:6px;"><strong>${label}:</strong> ${escapeHtml(fact.valor)} <span style="color:#94a3b8;">(vence ${escapeHtml(expires)})</span></div>`;
      });
      container.innerHTML = rows.length ? rows.join('') : 'Todavía no hay datos declarados guardados.';
    }
    if (evidence) {
      const audit = chatData.lastAiAudit;
      evidence.textContent = audit?.status === 'grounded'
        ? `Fuentes de la última consulta de IA: ${[...new Set(audit.sourceTitles || [])].join(', ') || 'base de conocimiento'}.`
        : audit ? 'En la última consulta de IA se utilizó una respuesta existente o se pidió una aclaración.' : '';
    }
  }

  function renderChatMessagesList(messages) {
    if (!activeChatMessages) return;
    activeChatMessages.innerHTML = '';

    if (!messages || messages.length === 0) {
      activeChatMessages.innerHTML = '<div style="text-align:center; padding:3rem; color:#64748b;">No hay mensajes en este chat.</div>';
      return;
    }

    messages.forEach(msg => {
      const bubble = document.createElement('div');
      bubble.className = `sim-msg ${msg.sender === 'user' ? 'user' : msg.sender === 'operator' ? 'operator' : 'bot'}`;
      
      // Determine time
      const time = new Date(msg.timestamp || Date.now());
      const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`;
      
      const senderLabel = msg.sender === 'user' ? 'Cliente' : msg.sender === 'operator' ? 'Operador' : 'IA';

      bubble.innerHTML = `${escapeHtml(msg.text)} <span class="sim-msg-meta">${senderLabel} // ${timeStr}</span>`;
      activeChatMessages.appendChild(bubble);
    });

    activeChatMessages.scrollTop = activeChatMessages.scrollHeight;
  }

  // Operator sends manual message
  if (liveChatInputForm) {
    liveChatInputForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = liveChatMsgInput.value.trim();
      if (!text || !selectedChatId) return;

      liveChatMsgInput.value = '';
      try {
        const res = await fetch('/api/live-chats/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chatId: selectedChatId, message: text })
        });
        if (res.ok) {
          loadChatMessages(selectedChatId);
          loadLiveChats(); // Refresh sidebar order
        }
      } catch (err) {
        console.error('Error enviando mensaje del operador:', err);
      }
    });
  }

  // Auto-summarization on close chat session
  if (activeChatCloseBtn) {
    activeChatCloseBtn.addEventListener('click', async () => {
      if (!selectedChatId) return;
      if (!confirm('¿Deseás cerrar la conversación y generar el auto-resumen por IA?')) return;

      activeChatCloseBtn.disabled = true;
      activeChatCloseBtn.textContent = '⏳ Resumiendo...';

      try {
        const res = await fetch(`/api/live-chats/${selectedChatId}/close`, { method: 'POST' });
        if (res.ok) {
          const data = await res.json();
          const summary = data.summary;
          
          alert(`🤖 AUTO-RESUMEN GENERADO POR IA (Guardado en el CRM):

📝 RESUMEN:
${summary.resumen}

💙 INTERÉS:
${summary.interes}

🚨 PROBLEMA:
${summary.problema}

➔ PRÓXIMO PASO:
${summary.proximoPaso}

📌 PRIORIDAD:
${summary.prioridad}`);

          // Close active chat view
          activeChatView.style.display = 'none';
          activeChatEmpty.style.display = 'flex';
          crmPanel.style.display = 'none';
          selectedChatId = null;
          loadLiveChats();
        }
      } catch (err) {
        console.error('Error cerrando conversación:', err);
      } finally {
        activeChatCloseBtn.disabled = false;
        activeChatCloseBtn.textContent = 'Cerrar Chat & Resumir';
      }
    });
  }

  // Poll chat messages in real time if a chat is active
  setInterval(() => {
    if (isAdminAuthenticated && selectedChatId && document.getElementById('tab-live-chats')?.classList.contains('active') && !document.hidden) {
      loadChatMessages(selectedChatId);
    }
  }, 3000);

  // ----------------------------------------------------
  // 5. CRM CLIENT PROFILE (Collapsible Sidebar Fields)
  // ----------------------------------------------------
  async function loadCustomerProfileCRM(customerId) {
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (res.ok) {
        const client = await res.json();
        fillCRMFields(client);
      } else {
        // Clear or prepopulate default
        clearCRMFields(customerId);
      }
    } catch (e) {
      clearCRMFields(customerId);
    }
  }

  function fillCRMFields(client) {
    crmClientId.value = client.id || '';
    crmClientName.value = client.name || '';
    crmClientCompany.value = client.company || '';
    crmClientEmail.value = client.email || '';
    crmClientPhone.value = client.phone || '';
    crmClientTag.value = client.tag || '🟢 Nuevo';
    crmClientStatus.value = client.status || 'Nuevo';
    crmClientProducts.value = client.products || '';
    crmClientDevices.value = client.installedDevices || '';
    crmClientQueries.value = client.previousQueries || '';
    crmClientProblems.value = client.problems || '';
    crmClientInterests.value = client.interests || '';
    crmClientNotes.value = client.notes || '';

    if (client.nextAppointment) {
      crmApptDate.value = client.nextAppointment.date || '';
      crmApptTime.value = client.nextAppointment.time || '';
      crmApptOperator.value = client.nextAppointment.operatorName || '';
      crmApptArea.value = client.nextAppointment.area || '';
      crmApptNotes.value = client.nextAppointment.notes || '';
    } else {
      crmApptDate.value = '';
      crmApptTime.value = '';
      crmApptOperator.value = '';
      crmApptArea.value = '';
      crmApptNotes.value = '';
    }
  }

  function clearCRMFields(customerId) {
    crmClientId.value = customerId;
    crmClientName.value = customerId.includes('@') ? `WhatsApp: ${customerId.split('@')[0]}` : 'Usuario Web';
    crmClientCompany.value = '';
    crmClientEmail.value = '';
    crmClientPhone.value = customerId.includes('@') ? '+' + customerId.split('@')[0] : '';
    crmClientTag.value = '🟢 Nuevo';
    crmClientStatus.value = 'Nuevo';
    crmClientProducts.value = '';
    crmClientDevices.value = '';
    crmClientQueries.value = '';
    crmClientProblems.value = '';
    crmClientInterests.value = '';
    crmClientNotes.value = '';
    crmApptDate.value = '';
    crmApptTime.value = '';
    crmApptOperator.value = '';
    crmApptArea.value = '';
    crmApptNotes.value = '';
  }

  if (crmSaveProfileBtn) {
    crmSaveProfileBtn.addEventListener('click', async () => {
      const id = crmClientId.value;
      if (!id) return;

      let nextAppointment = null;
      if (crmApptDate.value && crmApptTime.value) {
        nextAppointment = {
          date: crmApptDate.value,
          time: crmApptTime.value,
          operatorName: crmApptOperator.value,
          area: crmApptArea.value,
          notes: crmApptNotes.value
        };
      }

      const payload = {
        id,
        name: crmClientName.value.trim(),
        company: crmClientCompany.value.trim(),
        email: crmClientEmail.value.trim(),
        phone: crmClientPhone.value.trim(),
        tag: crmClientTag.value,
        status: crmClientStatus.value,
        products: crmClientProducts.value.trim(),
        installedDevices: crmClientDevices.value.trim(),
        previousQueries: crmClientQueries.value.trim(),
        problems: crmClientProblems.value.trim(),
        interests: crmClientInterests.value.trim(),
        notes: crmClientNotes.value.trim(),
        nextAppointment
      };

      try {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Ficha de memoria del cliente guardada con éxito en el CRM.');
          loadLiveChats(); // update name in sidebar if changed
        }
      } catch (err) {
        console.error('Error guardando CRM:', err);
      }
    });
  }

  // ----------------------------------------------------
  // 6. CRM DIRECTORY
  // ----------------------------------------------------
  async function loadCrmDirectory() {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        customersList = await res.json();
        renderCrmDirectory();
      }
    } catch (e) {
      console.error('Error cargando CRM Directorio:', e);
    }
  }

  function renderCrmDirectory() {
    if (!crmDirectoryTableBody) return;
    crmDirectoryTableBody.innerHTML = '';

    const filter = crmDirectorySearch ? crmDirectorySearch.value.toLowerCase().trim() : '';
    const filtered = customersList.filter(c => {
      return c.name.toLowerCase().includes(filter) || 
             (c.company || '').toLowerCase().includes(filter) ||
             c.id.toLowerCase().includes(filter);
    });

    if (filtered.length === 0) {
      crmDirectoryTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748b; padding:2rem;">No hay clientes en el directorio.</td></tr>';
      return;
    }

    filtered.forEach(c => {
      const tr = document.createElement('tr');
      const timeStr = c.lastInteraction ? new Date(c.lastInteraction).toLocaleDateString() : '-';
      
      tr.innerHTML = `
        <td style="font-weight:700; color:#ffffff;">${escapeHtml(c.name)}</td>
        <td style="font-family:'Share Tech Mono', monospace; font-size:0.8rem; color:#00f5d4;">${escapeHtml(c.id.split('@')[0])}</td>
        <td style="color:#cbd5e1;">${escapeHtml(c.company || '-')}</td>
        <td><span class="thread-badge" style="background:rgba(255,255,255,0.06); padding:2px 8px; border-radius:4px;">${escapeHtml(c.tag)}</span></td>
        <td><span style="font-size:0.8rem; font-weight:600;">${escapeHtml(c.status)}</span></td>
        <td style="font-family:'Share Tech Mono', monospace; font-size:0.75rem; color:#94a3b8;">${timeStr}</td>
        <td>
          <button class="btn-admin-ghost crm-view-btn" data-id="${escapeHtml(c.id)}" style="padding:2px 8px; font-size:0.7rem; color:#59a8ff; border-color:rgba(89,168,255,0.4);">
            📂 Ficha
          </button>
        </td>
      `;

      tr.querySelector('.crm-view-btn').addEventListener('click', () => {
        selectedChatId = c.id;
        switchToTab('tab-live-chats');
        openChatSession({ id: c.id, name: c.name, type: c.id.includes('@') ? 'whatsapp' : 'web', botPaused: false });
      });

      crmDirectoryTableBody.appendChild(tr);
    });
  }

  if (crmDirectorySearch) {
    crmDirectorySearch.addEventListener('input', renderCrmDirectory);
  }

  // Register manual customer
  if (crmManualClientForm) {
    crmManualClientForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('manual-client-id').value.trim();
      const name = document.getElementById('manual-client-name').value.trim();
      const company = document.getElementById('manual-client-company').value.trim();
      const email = document.getElementById('manual-client-email').value.trim();
      const tag = document.getElementById('manual-client-tag').value;
      const notes = document.getElementById('manual-client-notes').value.trim();

      const payload = {
        id, name, company, email, tag, status: 'Nuevo', notes, phone: id.includes('@') ? '+' + id.split('@')[0] : ''
      };

      try {
        const res = await fetch('/api/customers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Cliente registrado con éxito.');
          crmManualClientForm.reset();
          loadCrmDirectory();
        }
      } catch (err) {
        console.error('Error al registrar cliente:', err);
      }
    });
  }

  // ----------------------------------------------------
  // 7. APPOINTMENTS AGENDA & RULES
  // ----------------------------------------------------
  async function loadAppointments() {
    try {
      const res = await fetch('/api/appointments');
      if (res.ok) {
        appointmentsList = await res.json();
        renderAppointments();
      }
    } catch (e) {
      console.error('Error cargando Citas:', e);
    }
  }

  function renderAppointments() {
    if (!apptsTableBody) return;
    apptsTableBody.innerHTML = '';

    if (appointmentsList.length === 0) {
      apptsTableBody.innerHTML = '<tr><td colspan="7" style="text-align:center; color:#64748b; padding:2rem;">No hay citas agendadas.</td></tr>';
      return;
    }

    // Sort by date/time ascending
    appointmentsList.sort((a,b) => new Date(a.dateTime) - new Date(b.dateTime));

    appointmentsList.forEach(app => {
      const tr = document.createElement('tr');
      const dateDisplay = new Date(app.date + 'T12:00:00').toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
      const reminderBadge = app.reminderSent
        ? '<span style="color:#00f5d4; font-family:\'Share Tech Mono\', monospace; font-size:0.7rem; font-weight:700;">🟢 ENVIADO</span>'
        : '<span style="color:#94a3b8; font-family:\'Share Tech Mono\', monospace; font-size:0.7rem;">⏳ Pendiente</span>';

      tr.innerHTML = `
        <td style="font-weight:700; color:#ffffff;">${dateDisplay}</td>
        <td style="font-family:'Share Tech Mono', monospace; font-size:0.85rem; color:#00f5d4; font-weight:bold;">${escapeHtml(app.time)}</td>
        <td style="color:#cbd5e1; font-weight:600;">${escapeHtml(app.customerName)}</td>
        <td>👤 ${escapeHtml(app.operatorName)}</td>
        <td><span class="thread-channel-tag whatsapp">${escapeHtml(app.area)}</span></td>
        <td style="font-size:0.8rem; color:#94a3b8; max-width:240px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(app.notes || '-')}</td>
        <td>${reminderBadge}</td>
      `;
      apptsTableBody.appendChild(tr);
    });
  }

  async function loadAppointmentConfig() {
    try {
      const res = await fetch('/api/appointments/config');
      if (res.ok) {
        const config = await res.json();
        
        apptOpenTime.value = config.openTime || "09:00";
        apptCloseTime.value = config.closeTime || "18:30";
        apptDuration.value = config.durationMin || "30";
        apptAdvanceHours.value = config.minAdvanceHours || "2";
        apptMaxConcurrent.value = config.maxConcurrent || 1;
        apptBlockedDates.value = (config.blockedDates || []).join(', ');

        // Check workdays
        const checkboxes = apptRulesForm.querySelectorAll('input[name="workDay"]');
        checkboxes.forEach(cb => {
          cb.checked = config.workDays.includes(parseInt(cb.value));
        });
      }
    } catch (e) {
      console.error('Error cargando config de agenda:', e);
    }
  }

  if (apptRulesForm) {
    apptRulesForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const workDays = [];
      const checkboxes = apptRulesForm.querySelectorAll('input[name="workDay"]:checked');
      checkboxes.forEach(cb => workDays.push(parseInt(cb.value)));

      const blockedDates = apptBlockedDates.value.split(',').map(s => s.trim()).filter(Boolean);

      const payload = {
        workDays,
        openTime: apptOpenTime.value,
        closeTime: apptCloseTime.value,
        durationMin: parseInt(apptDuration.value),
        minAdvanceHours: parseInt(apptAdvanceHours.value),
        maxConcurrent: parseInt(apptMaxConcurrent.value),
        blockedDates
      };

      try {
        const res = await fetch('/api/appointments/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Reglas de la agenda de citas guardadas con éxito.');
          await syncServerKnowledgeAndPrompt(); // Sync settings
        }
      } catch (err) {
        console.error('Error guardando config de agenda:', err);
      }
    });
  }

  // ----------------------------------------------------
  // 8. OPENAI CONFIGURATION
  // ----------------------------------------------------
  if (cfgTemperature && tempValDisplay) {
    cfgTemperature.addEventListener('input', () => {
      tempValDisplay.textContent = parseFloat(cfgTemperature.value).toFixed(2);
    });
  }

  const openAiConfigForm = document.getElementById('openai-config-form');
  if (openAiConfigForm) {
    openAiConfigForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
      const config = OpenAIService.getConfig();
      config.apiKey = cfgApiKey.value.trim();
      const whisperKey = cfgWhisperKey ? cfgWhisperKey.value.trim() : '';
      config.whisperApiKey = whisperKey;

      config.model = cfgModel.value;
      config.maxTokens = parseInt(cfgMaxTokens.value) || 300;
      config.temperature = parseFloat(cfgTemperature.value) || 0.5;

      if (await OpenAIService.saveConfig(config)) {
        try {
          await fetch('/api/config/whisper-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ whisperKey })
          });
        } catch (e) {}

        await syncServerKnowledgeAndPrompt();
        cfgApiKey.value = '';
        if (cfgWhisperKey) cfgWhisperKey.value = '';
        showTestMsg('Configuración de API guardada y sincronizada correctamente.', 'success');
        updateSystemBadges(OpenAIService.getConfig());
      } else {
        showTestMsg('No se pudo guardar la configuración.', 'error');
      }
      } catch (err) { showTestMsg(err.message, 'error'); }
    });
  }

  if (testOpenAiBtn) {
    testOpenAiBtn.addEventListener('click', async () => {
      const key = cfgApiKey ? cfgApiKey.value.trim() : '';
      const model = cfgModel ? cfgModel.value : 'meta/llama-3.1-8b-instruct';

      if (!key && !OpenAIService.getConfig().apiKeyConfigured) {
        showTestMsg('Ingresa una API Key para probar la conexión.', 'error');
        return;
      }

      testOpenAiBtn.disabled = true;
      testOpenAiBtn.textContent = '⚡ Conectando...';

      try {
        await OpenAIService.testConnection(key, model);
        showTestMsg(`¡Conexión exitosa con ${model}! Clave verificada.`, 'success');
      } catch (err) {
        showTestMsg(`Error de conexión: ${err.message}`, 'error');
      } finally {
        testOpenAiBtn.disabled = false;
        testOpenAiBtn.textContent = '⚡ Probar Conexión OpenAI';
      }
    });
  }

  function showTestMsg(msg, type) {
    if (!openaiTestFeedback) return;
    openaiTestFeedback.textContent = msg;
    openaiTestFeedback.className = `login-msg ${type}`;
  }

  if (saveWebPromptBtn && promptWebAssistant) {
    saveWebPromptBtn.addEventListener('click', async () => {
      try { await syncServerKnowledgeAndPrompt(); alert('Prompt del Asistente Web guardado.'); }
      catch (err) { alert(err.message); }
    });
  }
  if (saveWpPromptBtn && promptWpBot) {
    saveWpPromptBtn.addEventListener('click', async () => {
      try { await syncServerKnowledgeAndPrompt(); alert('Prompt del Bot de WhatsApp guardado.'); }
      catch (err) { alert(err.message); }
    });
  }

  // 9. MEMORIA & RAG (KNOWLEDGE BASE)
  // ----------------------------------------------------
  async function saveKnowledge(action, value, revision = knowledgeRevision) {
    let articles = KnowledgeService.getArticles();
    const updatedAt = new Date().toISOString();
    if (action === 'add') articles.push({ ...value, id: `kb_${crypto.randomUUID()}`, updatedAt });
    else if (action === 'update') {
      if (!articles.some(item => item.id === value.id)) throw new Error('El documento ya no existe. Actualizá la lista.');
      articles = articles.map(item => item.id === value.id ? { ...item, ...value, updatedAt } : item);
    } else if (action === 'delete') articles = articles.filter(item => item.id !== value);
    else if (action === 'reset') articles = KnowledgeService.getKnowledgeArticles();
    const res = await fetch('/api/config/knowledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ articles, revision }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar el documento.');
    await refreshKnowledge();
  }
  if (addKbForm) {
    addKbForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      try {
      const title = kbTitle.value.trim();
      const content = kbContent.value.trim();
      const category = kbCategory.value;

      if (!title || !content) return;

      await saveKnowledge('add', { title, content, category, approved: true, status: 'active' });
      kbTitle.value = '';
      kbContent.value = '';
      renderKnowledgeCards();
      alert('Pauta de RAG guardada y cargada en el servidor.');
      } catch (err) { alert(err.message); }
    });
  }

  if (kbSearchInput) {
    kbSearchInput.addEventListener('input', () => {
      renderKnowledgeCards(kbSearchInput.value.trim());
    });
  }

  const resetKbBtn = document.getElementById('reset-kb-btn');
  if (resetKbBtn) {
    resetKbBtn.addEventListener('click', async () => {
      if (confirm('¿Restaurar las pautas de conocimiento corporativas de AITUE por defecto?')) {
        try { await saveKnowledge('reset'); } catch (err) { alert(err.message); return; }
        renderKnowledgeCards();
          alert('Base de conocimientos restaurada.');
      }
    });
  }

  // ----------------------------------------------------
  // REINICIAR BOT (APAGAR / PRENDER) HANDLERS
  // ----------------------------------------------------
  async function handleBotRestart() {
    if (!confirm('⚡ ¿Deseas reiniciar el motor del Bot (apagar y reencender)? Esto refrescará la memoria RAG, los prompts del sistema y las sesiones activas, manteniendo tu sesión de WhatsApp 100% conectada.')) {
      return;
    }

    const btns = [
      document.getElementById('restart-bot-card-btn'),
      document.getElementById('restart-bot-kb-btn'),
      document.getElementById('header-restart-bot-btn')
    ].filter(Boolean);

    btns.forEach(b => {
      b.disabled = true;
      b.textContent = '⚡ Reiniciando...';
    });

    try {
      await syncServerKnowledgeAndPrompt();
      const res = await fetch('/api/bot/restart', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert('✅ ¡Bot reiniciado exitosamente!\n' + (data.message || 'Motor de IA restablecido.'));
      } else {
        throw new Error('No se pudo reiniciar el bot.');
      }
    } catch (e) {
      console.warn('Error llamando API de reinicio backend, sincronizando local:', e);
      alert(e.message);
    } finally {
      btns.forEach(b => {
        b.disabled = false;
      });
      const cardBtn = document.getElementById('restart-bot-card-btn');
      if (cardBtn) cardBtn.textContent = '⚡ REINICIAR BOT EN VIVO (APAGAR / PRENDER)';
      const kbBtn = document.getElementById('restart-bot-kb-btn');
      if (kbBtn) kbBtn.textContent = '⚡ REINICIAR BOT';
      const headerBtn = document.getElementById('header-restart-bot-btn');
      if (headerBtn) headerBtn.textContent = '⚡ REINICIAR BOT';
    }
  }

  const restartBotCardBtn = document.getElementById('restart-bot-card-btn');
  if (restartBotCardBtn) restartBotCardBtn.addEventListener('click', handleBotRestart);

  const restartBotKbBtn = document.getElementById('restart-bot-kb-btn');
  if (restartBotKbBtn) restartBotKbBtn.addEventListener('click', handleBotRestart);

  if (headerRestartBotBtn) headerRestartBotBtn.addEventListener('click', handleBotRestart);

  function renderKnowledgeCards(searchFilter = '') {
    if (!kbCardsContainer) return;
    let articles = KnowledgeService.getArticles();

    if (!articles) articles = [];

    const filtered = searchFilter 
      ? articles.filter(a => a.title.toLowerCase().includes(searchFilter.toLowerCase()) || a.content.toLowerCase().includes(searchFilter.toLowerCase()))
      : articles;

    kbCardsContainer.innerHTML = '';
    filtered.forEach(art => {
      const card = document.createElement('div');
      card.style.cssText = 'background:rgba(7,22,47,0.85); border:1px solid rgba(89,168,255,0.25); border-radius:12px; padding:1.2rem; display:flex; flex-direction:column; gap:0.6rem; position:relative;';
      
      const timeStr = art.updatedAt && Number.isFinite(Date.parse(art.updatedAt)) ? new Date(art.updatedAt).toLocaleDateString('es-AR') : 'Sin fecha registrada';

      card.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span style="font-family:'Share Tech Mono', monospace; font-size:0.68rem; color:#00f5d4; background:rgba(0,245,212,0.1); border:1px solid rgba(0,245,212,0.3); padding:2px 8px; border-radius:4px; text-transform:uppercase;">
            ${escapeHtml(art.category)}
          </span>
          <div style="display:flex; gap:6px;">
            <button type="button" class="btn-admin-ghost edit-kb-btn" data-id="${escapeHtml(art.id)}" style="padding:4px 10px; font-size:0.7rem; color:#00f5d4; border-color:rgba(0,245,212,0.4); cursor:pointer;">✏️ Editar</button>
            <button type="button" class="btn-admin-ghost delete-kb-btn" data-id="${escapeHtml(art.id)}" style="padding:4px 10px; font-size:0.7rem; color:#ff4d6d; border-color:rgba(255,77,109,0.4); cursor:pointer;">🗑️ Eliminar</button>
          </div>
        </div>
        <h4 style="font-family:'Outfit', sans-serif; font-size:1rem; color:#ffffff; margin:0;">${escapeHtml(art.title)}</h4>
        <p style="font-size:0.8rem; color:#cbd5e1; margin:0;">${escapeHtml(art.content.slice(0, 180))}${art.content.length > 180 ? '…' : ''}</p>
        <details style="font-size:0.8rem; color:#cbd5e1;"><summary style="cursor:pointer; color:#59a8ff;">Ver contenido completo</summary><p style="white-space:pre-line; line-height:1.5;">${escapeHtml(art.content)}</p></details>
        <span style="font-size:0.72rem; color:#94a3b8;">${art.visibility === 'internal' ? 'Sólo operadores' : art.approved === false || ['draft', 'archived', 'rejected'].includes(art.status) ? 'No disponible para la IA' : 'Disponible para consultas'}${art.validUntil ? ` · Vigente hasta ${escapeHtml(new Date(art.validUntil).toLocaleDateString('es-AR'))}` : ''}</span>
        <span style="font-family:'Share Tech Mono', monospace; font-size:0.62rem; color:#64748b;">Actualizado: ${timeStr}</span>
      `;
      kbCardsContainer.appendChild(card);
    });

    // Delete handlers
    kbCardsContainer.querySelectorAll('.delete-kb-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        if (confirm('¿Eliminar esta pauta de conocimiento?')) {
          try { await saveKnowledge('delete', id); } catch (err) { alert(err.message); return; }
          renderKnowledgeCards(kbSearchInput ? kbSearchInput.value.trim() : '');
            }
      });
    });

    // Edit handlers
    kbCardsContainer.querySelectorAll('.edit-kb-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const id = btn.getAttribute('data-id');
        const articles = KnowledgeService.getArticles();
        const art = articles.find(a => a.id === id);
        if (!art) return;

        const editModal = document.getElementById('edit-kb-modal');
        const editId = document.getElementById('edit-kb-id');
        const editCat = document.getElementById('edit-kb-category');
        const editTitle = document.getElementById('edit-kb-title');
        const editContent = document.getElementById('edit-kb-content');

        if (editModal && editId && editCat && editTitle && editContent) {
          editId.value = art.id;
          editCat.value = art.category || 'General';
          editTitle.value = art.title || '';
          editContent.value = art.content || '';
          editingKnowledgeRevision = knowledgeRevision;
          const day = value => value ? new Date(value).toLocaleDateString('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }) : '';
          document.getElementById('edit-kb-status').value = art.approved === false ? 'rejected' : art.status || 'active';
          document.getElementById('edit-kb-visibility').value = art.visibility || 'public';
          document.getElementById('edit-kb-valid-from').value = day(art.validFrom);
          document.getElementById('edit-kb-valid-until').value = day(art.validUntil || art.expiresAt);
          document.getElementById('edit-kb-commercial-until').value = day(art.commercialValidUntil);
          document.getElementById('edit-kb-client').value = art.clientId || art.customerId || '';
          editModal.style.display = 'flex';
        }
      });
    });
  }

  // Edit Modal Handlers
  const editKbModal = document.getElementById('edit-kb-modal');
  const editKbForm = document.getElementById('edit-kb-form');
  const saveEditKbBtn = document.getElementById('save-edit-kb-btn');
  const cancelEditKbBtn = document.getElementById('cancel-edit-kb-btn');
  const closeEditKbModalX = document.getElementById('close-edit-kb-modal-x');

  function hideEditKbModal() {
    if (editKbModal) editKbModal.style.display = 'none';
  }

  if (cancelEditKbBtn) cancelEditKbBtn.addEventListener('click', hideEditKbModal);
  if (closeEditKbModalX) closeEditKbModalX.addEventListener('click', hideEditKbModal);

  async function executeSaveArticle(event) {
    event?.preventDefault();
    const id = document.getElementById('edit-kb-id')?.value;
    const category = document.getElementById('edit-kb-category')?.value.trim();
    const title = document.getElementById('edit-kb-title')?.value.trim();
    const content = document.getElementById('edit-kb-content')?.value.trim();

    if (!id || !title || !content) return;

    const status = document.getElementById('edit-kb-status').value;
    const date = (field, end = true) => {
      const value = document.getElementById(field).value;
      return value ? `${value}T${end ? '23:59:59.999' : '00:00:00'}-03:00` : null;
    };
    const metadata = { status, approved: status === 'active', visibility: document.getElementById('edit-kb-visibility').value, validFrom: date('edit-kb-valid-from', false), validUntil: date('edit-kb-valid-until'), expiresAt: null, commercialValidUntil: date('edit-kb-commercial-until'), clientId: document.getElementById('edit-kb-client').value.trim() || null, customerId: null };
    try { await saveKnowledge('update', { id, category, title, content, ...metadata }, editingKnowledgeRevision); } catch (err) { alert(err.message); return; }
    hideEditKbModal();
    renderKnowledgeCards(kbSearchInput ? kbSearchInput.value.trim() : '');
    alert('Pauta de conocimiento actualizada.');
  }

  if (saveEditKbBtn) saveEditKbBtn.addEventListener('click', executeSaveArticle);
  if (editKbForm) editKbForm.addEventListener('submit', executeSaveArticle);

  // ----------------------------------------------------
  // 10. WHATSAPP QR VINCULACIÓN
  // ----------------------------------------------------
  let qrPollingStarted = false;
  function initWpQrCode() {
    if (qrPollingStarted) return;
    qrPollingStarted = true;
    pollBaileysStatus();
    setInterval(() => { if (isAdminAuthenticated && !document.hidden) pollBaileysStatus(); }, 3000);
  }

  async function pollBaileysStatus() {
    try {
      const res = await fetch('/api/whatsapp/status');
      if (res.ok) {
        const data = await res.json();
        isWpConnected = data.status === 'CONNECTED';
        isBotPausedState = data.paused;
        activeConnectedPhone = data.connectedPhone || 'Sin número vinculado';
        if (wpQrImg) wpQrImg.hidden = !data.qrDataUrl || isWpConnected;

        if (data.qrDataUrl && wpQrImg && !isWpConnected) {
          wpQrImg.src = data.qrDataUrl;
        }

        updateWpStatusUI();
        if (!isWpConnected && !data.qrDataUrl && qrStatusLabel) qrStatusLabel.textContent = data.status === 'RELINK_REQUIRED' ? 'La sesión venció. Usá Generar nuevo QR para vincular nuevamente.' : data.status === 'DISCONNECTED' ? 'Desconectado. Usá Generar nuevo QR para conectar.' : 'Conectando con WhatsApp...';
      }
    } catch (err) {
      console.warn('Error conectando con wp-server backend:', err.message);
    }
  }

  function updateWpStatusUI() {
    if (togglePauseBotBtn) {
      togglePauseBotBtn.textContent = isBotPausedState ? '▶️ Reanudar Respuestas del Bot' : '⏸️ Pausar Respuestas del Bot';
      togglePauseBotBtn.className = isBotPausedState ? 'btn-admin-success' : 'btn-admin-warning';
    }

    if (isBotPausedState) {
      if (qrStatusLabel) qrStatusLabel.textContent = `ESTADO: BOT WHATSAPP PAUSADO`;
      if (wpQrStatusPill) wpQrStatusPill.className = 'status-badge-pill inactive';
      if (wpQrStatusText) wpQrStatusText.textContent = `Bot WP: Pausado`;
      if (simWpNumberTag) simWpNumberTag.textContent = `${activeConnectedPhone} // PAUSADO`;
      return;
    }

    if (isWpConnected) {
      if (qrOverlayStatus) qrOverlayStatus.style.display = 'flex';
      if (connectedPhoneDisplay) connectedPhoneDisplay.textContent = activeConnectedPhone;
      if (qrStatusLabel) qrStatusLabel.textContent = `ESTADO: CONECTADO (${activeConnectedPhone})`;
      if (wpQrStatusPill) wpQrStatusPill.className = 'status-badge-pill active';
      if (wpQrStatusText) wpQrStatusText.textContent = `Bot WP: Online`;
      if (simWpNumberTag) simWpNumberTag.textContent = `${activeConnectedPhone} // ONLINE`;
    } else {
      if (qrOverlayStatus) qrOverlayStatus.style.display = 'none';
      if (qrStatusLabel) qrStatusLabel.textContent = 'ESTADO: CÓDIGO QR GENERADO. ESCANEA CON TU WHATSAPP.';
      if (wpQrStatusPill) wpQrStatusPill.className = 'status-badge-pill inactive';
      if (wpQrStatusText) wpQrStatusText.textContent = 'Bot WP: Esperando QR';
      if (simWpNumberTag) simWpNumberTag.textContent = 'DESCONECTADO // ESPERANDO QR';
    }
  }

  if (togglePauseBotBtn) {
    togglePauseBotBtn.addEventListener('click', async () => {
      try {
        const res = await fetch('/api/whatsapp/pause', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paused: !isBotPausedState })
        });
        if (res.ok) {
          const data = await res.json();
          isBotPausedState = data.paused;
          updateWpStatusUI();
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (disconnectWpBtn) {
    disconnectWpBtn.addEventListener('click', async () => {
      if (!confirm('¿Desvincular la cuenta celular de WhatsApp?')) return;
      try {
        const res = await fetch('/api/whatsapp/logout', { method: 'POST' });
        if (res.ok) {
          isWpConnected = false;
          pollBaileysStatus();
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  if (regenerateQrBtn) {
    regenerateQrBtn.addEventListener('click', async () => {
      if (isWpConnected && !confirm('Generar un nuevo QR desvincula la sesión actual. ¿Continuar?')) return;
      regenerateQrBtn.disabled = true;
      try {
        const res = await fetch('/api/whatsapp/clear-session', { method: 'POST' });
        if (!res.ok) throw new Error('No se pudo generar el QR.');
        pollBaileysStatus();
      } catch (e) { alert(e.message); }
      finally { regenerateQrBtn.disabled = false; }
    });
  }

  // ----------------------------------------------------
  // 11. EQUIPO & OPERADORES AUTORIZADOS
  // ----------------------------------------------------
  async function loadOperators() {
    try {
      const res = await fetch('/api/operators');
      if (res.ok) {
        operatorsList = await res.json();
        renderOperatorsTable();
      }
    } catch (e) {
      console.error(e);
    }
  }

  function renderOperatorsTable() {
    if (!usersTableBody) return;
    usersTableBody.innerHTML = '';

    if (operatorsList.length === 0) {
      usersTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:2rem;">No hay operadores de atención registrados.</td></tr>';
      return;
    }

    operatorsList.forEach(op => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="font-weight:700; color:#ffffff;">${escapeHtml(op.name)}</td>
        <td style="font-family:'Share Tech Mono', monospace; font-size:0.85rem; color:#00f5d4;">${escapeHtml(op.phone)}</td>
        <td><span class="thread-channel-tag whatsapp">${escapeHtml(op.area)}</span></td>
        <td>
          <button class="btn-admin-ghost delete-op-btn" data-phone="${escapeHtml(op.phone)}" style="padding:2px 8px; font-size:0.7rem; color:#ff4d6d; border-color:rgba(255,77,109,0.3);">
            Revocar
          </button>
        </td>
      `;

      tr.querySelector('.delete-op-btn').addEventListener('click', async () => {
        if (!confirm(`¿Eliminar autorización para el operador ${escapeHtml(op.name)}?`)) return;
        try {
          const res = await fetch(`/api/operators/${op.phone.replace('+', '')}`, { method: 'DELETE' });
          if (res.ok) {
            loadOperators();
          }
        } catch (e) {
          console.error(e);
        }
      });

      usersTableBody.appendChild(tr);
    });
  }

  if (addUserForm) {
    addUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = usrName.value.trim();
      const phone = usrPhone.value.trim();
      const area = usrArea.value;

      if (!name || !phone) return;

      try {
        const res = await fetch('/api/operators', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, phone, area })
        });
        if (res.ok) {
          usrName.value = '';
          usrPhone.value = '';
          loadOperators();
        }
      } catch (err) {
        console.error(err);
      }
    });
  }

  // Operator manual availability switch
  async function loadOperatorAvailability() {
    try {
      const res = await fetch('/api/operators/availability');
      if (res.ok) {
        const data = await res.json();
        updateOperatorAvailabilityUI(data.available);
      }
    } catch (e) {}
  }

  function updateOperatorAvailabilityUI(available) {
    if (!headerOperatorToggleBtn) return;
    if (available) {
      headerOperatorToggleBtn.textContent = '🟢 DISPONIBLES (Auto-Handoff)';
      headerOperatorToggleBtn.style.background = 'rgba(0,245,212,0.15)';
      headerOperatorToggleBtn.style.color = '#00f5d4';
    } else {
      headerOperatorToggleBtn.textContent = '🔴 AUSENTES (Solo Citas)';
      headerOperatorToggleBtn.style.background = 'rgba(255,77,109,0.15)';
      headerOperatorToggleBtn.style.color = '#ff4d6d';
    }
  }

  if (headerOperatorToggleBtn) {
    headerOperatorToggleBtn.addEventListener('click', async () => {
      const isAvailable = headerOperatorToggleBtn.textContent.includes('DISPONIBLES');
      try {
        const res = await fetch('/api/operators/availability', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ available: !isAvailable })
        });
        if (res.ok) {
          const data = await res.json();
          updateOperatorAvailabilityUI(data.available);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }

  // ----------------------------------------------------
  // 12. CYBERPUNK METRICS & LOGS
  // ----------------------------------------------------
  async function loadCyberpunkMetrics() {
    try {
      const resCust = await fetch('/api/customers');
      const resChats = await fetch('/api/live-chats');
      
      if (resCust.ok && resChats.ok) {
        const customers = await resCust.json();
        const chats = await resChats.json();

        // Calculate counts
        const totalConversations = chats.length;
        const totalCustomers = customers.length;
        const potentialLeads = customers.filter(c => c.tag === '🟡 Potencial cliente').length;
        
        const manualTakeoverChats = chats.filter(c => c.botPaused).length;
        const closedChats = customers.filter(c => c.status === 'Cerrado').length;
        const totalResolved = totalConversations || 1;

        const resolvedByIAPct = 0;
        const resolvedByHumanPct = Math.round((manualTakeoverChats / totalResolved) * 100);
        const pendingPct = totalConversations ? Math.max(0, 100 - resolvedByHumanPct) : 0;

        // Render counts
        if (mockConversationsCount) mockConversationsCount.textContent = totalConversations;
        if (mockCustomersCount) mockCustomersCount.textContent = totalCustomers;
        if (mockLeadsCount) mockLeadsCount.textContent = potentialLeads;

        if (mockIaResolvedPct) mockIaResolvedPct.textContent = 'Sin datos';
        if (mockHumanResolvedPct) mockHumanResolvedPct.textContent = `${resolvedByHumanPct}%`;
        if (mockPendingResolvedPct) mockPendingResolvedPct.textContent = `${pendingPct}%`;

        // Render category case counts
        if (statsSalesCount) statsSalesCount.textContent = `${potentialLeads} prospectos`;
        const techCases = customers.filter(c => c.tag === '🟣 Soporte técnico').length;
        if (statsTechCount) statsTechCount.textContent = `${techCases} casos`;
      }
    } catch (e) {
      console.warn('Error updating metrics:', e.message);
    }
  }

  async function renderLogs() {
    if (!logsTableBody) return;
    try {
      const res = await fetch('/api/whatsapp/logs');
      if (res.ok) {
        const logs = await res.json();
        
        if (metricTotalChats) metricTotalChats.textContent = logs.length;

        if (logs.length === 0) {
          logsTableBody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:#64748b; padding:2rem;">No hay registros de consultas en esta sesión.</td></tr>';
          return;
        }

        logsTableBody.innerHTML = '';
        logs.forEach(l => {
          const tr = document.createElement('tr');
          const time = new Date(l.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const originBadge = l.source === 'whatsapp_bot'
            ? `<span style="color:#00f5d4; font-family:'Share Tech Mono', monospace; font-size:0.75rem;">💬 WhatsApp (${escapeHtml(l.userPhone)})</span>`
            : `<span style="color:#59A8FF; font-family:'Share Tech Mono', monospace; font-size:0.75rem;">🤖 Web Assistant</span>`;

          tr.innerHTML = `
            <td style="font-family:'Share Tech Mono', monospace; font-size:0.75rem; color:#94a3b8;">${time}</td>
            <td>${originBadge}</td>
            <td style="font-weight:600; color:#ffffff; max-width:240px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(l.userMsg)}</td>
            <td style="color:#cbd5e1; max-width:320px; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(l.botReply)}</td>
          `;
          logsTableBody.appendChild(tr);
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', async () => {
      try {
        await fetch('/api/whatsapp/logs', { method: 'DELETE' });
        renderLogs();
      } catch (e) {}
    });
  }

  // ----------------------------------------------------
  // INITIALIZE SESSION & BOOTSTRAP
  // ----------------------------------------------------
  checkSession();

});
