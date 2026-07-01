// Connect to background script to keep it alive while dashboard is open
const keepAlivePort = chrome.runtime.connect({ name: "stopram-keepalive" });

// Local State
let currentTabId = 'monitor';
let searchQuery = '';
let currentSort = 'memory-desc';
let lastTabMemoryData = [];
let localSettings = null;

// DOM Elements
const navItems = document.querySelectorAll('.nav-item');
const tabPanes = document.querySelectorAll('.tab-pane');
const pageTitle = document.getElementById('page-title');
const pageSubtitle = document.getElementById('page-subtitle');
const modeBadge = document.getElementById('mode-badge');
const globalStatusText = document.getElementById('global-status-text');
const pulseDot = document.querySelector('.pulse-dot');

// Stats Elements
const statTotalTabs = document.getElementById('stat-total-tabs');
const statTotalRam = document.getElementById('stat-total-ram');
const statSuspendedTabs = document.getElementById('stat-suspended-tabs');
const statTotalSaves = document.getElementById('stat-total-saves');

// Controls
const searchTabsInput = document.getElementById('search-tabs');
const sortTabsSelect = document.getElementById('sort-tabs');
const tabsListBody = document.getElementById('tabs-list-body');
const btnForceCheck = document.getElementById('btn-force-check');

// Settings Elements
const settingsLimit = document.getElementById('settings-limit');
const settingsLimitVal = document.getElementById('settings-limit-val');
const settingsAction = document.getElementById('settings-action');
const settingsInterval = document.getElementById('settings-interval');
const settingsNotify = document.getElementById('settings-notify');
const settingsApiStatus = document.getElementById('settings-api-status');
const settingsOperationalMode = document.getElementById('settings-operational-mode');
const settingsForceSim = document.getElementById('settings-force-sim');

// History Elements
const historyItemsContainer = document.getElementById('history-items-container');
const btnClearHistory = document.getElementById('btn-clear-history');

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  loadSettingsAndData();
  setupEventListeners();

  // Poll memory usage faster while UI is open to give a real-time reactive feel
  setInterval(() => {
    chrome.runtime.sendMessage({ action: 'triggerCheck' });
  }, 2000);
});

// NAVIGATION
function setupNavigation() {
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetTab = item.getAttribute('data-tab');
      
      // Update sidebar nav UI
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Show target tab pane
      tabPanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `tab-${targetTab}`) {
          pane.classList.add('active');
        }
      });

      currentTabId = targetTab;
      updateHeaderMetadata();
      
      // Reload on change to history tab
      if (targetTab === 'history') {
        loadSettingsAndData();
      }
    });
  });
}

function updateHeaderMetadata() {
  if (currentTabId === 'monitor') {
    pageTitle.textContent = "Monitor de Abas";
    pageSubtitle.textContent = "Veja e gerencie o consumo de recursos das abas abertas.";
  } else if (currentTabId === 'settings') {
    pageTitle.textContent = "Configurações";
    pageSubtitle.textContent = "Defina regras automáticas de gerenciamento de RAM e comportamento.";
  } else if (currentTabId === 'permissions') {
    pageTitle.textContent = "Permissões";
    pageSubtitle.textContent = "Gerencie domínios protegidos que nunca serão suspensos.";
  } else if (currentTabId === 'history') {
    pageTitle.textContent = "Histórico de Ações";
    pageSubtitle.textContent = "Registro das otimizações executadas pelo StopRAM.";
  }
}

// EVENT LISTENERS
function setupEventListeners() {
  // Search
  searchTabsInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTabsTable();
  });

  // Sorting
  sortTabsSelect.addEventListener('change', (e) => {
    currentSort = e.target.value;
    renderTabsTable();
  });

  // Force Memory Check
  btnForceCheck.addEventListener('click', () => {
    btnForceCheck.disabled = true;
    btnForceCheck.innerHTML = `<span class="spinner" style="margin:0; width:14px; height:14px;"></span>`;
    
    chrome.runtime.sendMessage({ action: 'triggerCheck' }, () => {
      setTimeout(() => {
        btnForceCheck.disabled = false;
        btnForceCheck.innerHTML = `
          <svg class="btn-icon" viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
          Checar Agora
        `;
        loadSettingsAndData();
      }, 500);
    });
  });

  // Settings modification
  settingsLimit.addEventListener('input', (e) => {
    settingsLimitVal.textContent = `${e.target.value} MB`;
  });

  settingsLimit.addEventListener('change', saveSettings);
  settingsAction.addEventListener('change', saveSettings);
  settingsInterval.addEventListener('change', saveSettings);
  settingsNotify.addEventListener('change', saveSettings);
  settingsForceSim.addEventListener('change', saveSettings);

  // Permissions form listeners
  const btnAddPermission = document.getElementById('btn-add-permission');
  const inputPermissionUrl = document.getElementById('permission-url');
  if (btnAddPermission && inputPermissionUrl) {
    btnAddPermission.addEventListener('click', addPermissionEntry);
    inputPermissionUrl.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addPermissionEntry();
      }
    });
  }

  // Clear History
  btnClearHistory.addEventListener('click', () => {
    if (confirm("Tem certeza que deseja limpar todo o histórico de ações?")) {
      chrome.storage.local.set({ history: [] }, () => {
        loadSettingsAndData();
      });
    }
  });

  // Listen to background memory updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'tabMemoryUpdated') {
      loadSettingsAndData();
    }
  });
}

// LOAD SETTINGS AND DATA
function loadSettingsAndData() {
  chrome.storage.local.get(['settings', 'tabMemoryData', 'history', 'mode', 'whitelist'], (data) => {
    localSettings = data.settings || {
      ramLimit: 300 * 1024 * 1024,
      action: 'discard',
      interval: 15,
      simulationForce: false,
      notificationsEnabled: true
    };

    lastTabMemoryData = data.tabMemoryData || [];
    const history = data.history || [];
    const mode = data.mode || 'simulation';
    const whitelist = data.whitelist || [];

    // Update Header Badges
    const isProcessesAvailable = typeof chrome.processes !== 'undefined';
    if (isProcessesAvailable) {
      settingsApiStatus.textContent = "Disponível (Chrome Dev)";
      settingsApiStatus.className = "info-value text-green";
    } else {
      settingsApiStatus.textContent = "Indisponível (Chrome Estável)";
      settingsApiStatus.className = "info-value text-red";
    }

    if (mode === 'real') {
      modeBadge.textContent = "Modo Real";
      modeBadge.className = "badge badge-success";
      globalStatusText.textContent = "Monitorando (Real)";
      pulseDot.className = "pulse-dot active";
      settingsOperationalMode.textContent = "Monitoramento Real";
      settingsOperationalMode.className = "info-value text-green";
    } else {
      modeBadge.textContent = "Modo Simulação";
      modeBadge.className = "badge badge-warning";
      globalStatusText.textContent = "Simulando RAM";
      pulseDot.className = "pulse-dot simulated";
      settingsOperationalMode.textContent = isProcessesAvailable ? "Simulação Forçada" : "Simulação Automática";
      settingsOperationalMode.className = "info-value text-amber";
    }

    // Sync settings form elements (only if settings page is loaded/active)
    syncSettingsForm();

    // Stats calculations
    statTotalTabs.textContent = lastTabMemoryData.length;
    
    const totalBytes = lastTabMemoryData.reduce((acc, curr) => acc + curr.memory, 0);
    statTotalRam.textContent = formatBytes(totalBytes);

    const suspendedCount = lastTabMemoryData.filter(t => t.discarded).length;
    statSuspendedTabs.textContent = suspendedCount;
    
    statTotalSaves.textContent = history.filter(h => h.action !== 'skip_active').length;

    // Render components
    renderTabsTable();
    renderHistoryList(history);
    renderPermissionsList(whitelist);
  });
}

function syncSettingsForm() {
  if (!localSettings) return;
  
  const limitMB = Math.round(localSettings.ramLimit / (1024 * 1024));
  settingsLimit.value = limitMB;
  settingsLimitVal.textContent = `${limitMB} MB`;
  
  settingsAction.value = localSettings.action;
  settingsInterval.value = localSettings.interval;
  settingsNotify.checked = localSettings.notificationsEnabled;
  settingsForceSim.checked = localSettings.simulationForce;
}

// SAVE SETTINGS
function saveSettings() {
  const ramLimitBytes = parseInt(settingsLimit.value, 10) * 1024 * 1024;
  const newSettings = {
    ramLimit: ramLimitBytes,
    action: settingsAction.value,
    interval: parseInt(settingsInterval.value, 10),
    notificationsEnabled: settingsNotify.checked,
    simulationForce: settingsForceSim.checked
  };

  chrome.storage.local.set({ settings: newSettings }, () => {
    localSettings = newSettings;
    // Force a check with the new settings
    chrome.runtime.sendMessage({ action: 'triggerCheck' });
  });
}

// RENDER TAB LIST
function renderTabsTable() {
  if (!tabsListBody) return;
  
  // Filter tabs
  let filteredTabs = lastTabMemoryData.filter(tab => {
    const titleMatch = tab.title.toLowerCase().includes(searchQuery);
    const domain = getDomain(tab.url).toLowerCase();
    const domainMatch = domain.includes(searchQuery);
    return titleMatch || domainMatch;
  });

  // Sort tabs
  filteredTabs.sort((a, b) => {
    if (currentSort === 'memory-desc') {
      return b.memory - a.memory;
    } else if (currentSort === 'memory-asc') {
      return a.memory - b.memory;
    } else if (currentSort === 'cpu-desc') {
      return b.cpu - a.cpu;
    } else if (currentSort === 'title') {
      return a.title.localeCompare(b.title);
    }
    return 0;
  });

  if (filteredTabs.length === 0) {
    tabsListBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-state">
          Nenhuma aba encontrada correspondente à pesquisa.
        </td>
      </tr>
    `;
    return;
  }

  const limitBytes = localSettings ? localSettings.ramLimit : 300 * 1024 * 1024;

  let rowsHTML = '';
  filteredTabs.forEach(tab => {
    // Memory progress percent
    const percent = Math.min(Math.round((tab.memory / limitBytes) * 100), 100);
    
    // Choose progress color
    let barColorClass = 'fill-green';
    let rowClass = '';
    if (percent >= 85) {
      barColorClass = 'fill-rose';
      rowClass = 'critical-row';
    } else if (percent >= 50) {
      barColorClass = 'fill-amber';
    }

    // Status Badge HTML
    let statusBadgeHTML = '<span class="badge badge-secondary">Inativa</span>';
    if (tab.discarded) {
      statusBadgeHTML = '<span class="badge badge-secondary">Suspensa</span>';
    } else if (tab.isSpecial) {
      statusBadgeHTML = '<span class="badge badge-special">Especial</span>';
    } else if (tab.active) {
      statusBadgeHTML = '<span class="badge badge-success">Ativa</span>';
    }

    // Favicon HTML
    const domain = getDomain(tab.url);
    const firstChar = tab.title ? tab.title.charAt(0).toUpperCase() : '?';
    const faviconHTML = tab.favIconUrl && tab.favIconUrl.startsWith('http')
      ? `<img class="tab-icon" src="${tab.favIconUrl}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">`
      : '';
    const fallbackIconHTML = `<div class="tab-icon-fallback" style="${tab.favIconUrl && tab.favIconUrl.startsWith('http') ? 'display:none;' : ''}">${firstChar}</div>`;

    // Action button state
    const isSuspended = tab.discarded;
    const isActive = tab.active;
    const isSpecial = tab.isSpecial;

    rowsHTML += `
      <tr class="${rowClass}">
        <td>
          <div class="tab-info-cell">
            ${faviconHTML}
            ${fallbackIconHTML}
            <div class="tab-text">
              <span class="tab-title" title="${escapeHtml(tab.title)}">${escapeHtml(tab.title)}</span>
              <span class="tab-url" title="${escapeHtml(tab.url)}">${escapeHtml(domain || 'Nova Guia')}</span>
            </div>
          </div>
        </td>
        <td class="font-mono text-muted">${tab.pid > 0 ? tab.pid : '-'}</td>
        <td>
          <div class="memory-progress-container">
            <div class="memory-numbers">
              <span class="font-mono font-bold">${formatBytes(tab.memory)}</span>
              <span>${percent}% do limite</span>
            </div>
            <div class="progress-bar-bg">
              <div class="progress-bar-fill ${barColorClass}" style="width: ${percent}%;"></div>
            </div>
          </div>
        </td>
        <td class="font-mono">${isSuspended ? '-' : tab.cpu + '%'}</td>
        <td>${statusBadgeHTML}</td>
        <td>
          <div class="action-buttons">
            <button class="btn-table-action btn-reload-action" data-action="reload" data-id="${tab.tabId}" title="Recarregar aba" ${isSuspended ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
              <svg class="btn-table-action-icon" viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            </button>
            <button class="btn-table-action btn-discard-action" data-action="discard" data-id="${tab.tabId}" title="${isSpecial ? 'Abas especiais não podem ser suspensas' : (isActive ? 'Abas ativas não podem ser suspensas' : 'Suspender aba (liberar RAM)')}" ${isSuspended || isActive || isSpecial ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''}>
              <svg class="btn-table-action-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            </button>
            <button class="btn-table-action btn-close-action" data-action="close" data-id="${tab.tabId}" data-title="${escapeHtml(tab.title)}" data-url="${escapeHtml(tab.url)}" title="Fechar aba">
              <svg class="btn-table-action-icon" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          </div>
        </td>
      </tr>
    `;
  });

  tabsListBody.innerHTML = rowsHTML;

  // Add click events to action buttons
  document.querySelectorAll('.btn-reload-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.currentTarget;
      const tabId = parseInt(btnEl.getAttribute('data-id'), 10);
      btnEl.disabled = true;
      chrome.runtime.sendMessage({ action: 'forceReload', tabId }, (res) => {
        setTimeout(loadSettingsAndData, 500);
      });
    });
  });

  document.querySelectorAll('.btn-discard-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.currentTarget;
      const tabId = parseInt(btnEl.getAttribute('data-id'), 10);
      btnEl.disabled = true;
      chrome.runtime.sendMessage({ action: 'forceDiscard', tabId }, (res) => {
        if (res && !res.success) {
          alert("Não foi possível suspender a aba: " + res.error);
          btnEl.disabled = false;
        } else {
          setTimeout(loadSettingsAndData, 500);
        }
      });
    });
  });

  document.querySelectorAll('.btn-close-action').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.currentTarget;
      const tabId = parseInt(btnEl.getAttribute('data-id'), 10);
      const title = btnEl.getAttribute('data-title');
      const url = btnEl.getAttribute('data-url');
      btnEl.disabled = true;
      chrome.runtime.sendMessage({ action: 'forceClose', tabId, tabTitle: title, tabUrl: url }, () => {
        setTimeout(loadSettingsAndData, 500);
      });
    });
  });
}

// RENDER ACTIONS HISTORY
function renderHistoryList(history) {
  if (!historyItemsContainer) return;

  if (history.length === 0) {
    historyItemsContainer.innerHTML = `
      <div class="empty-state">
        Nenhuma ação foi registrada ainda. O histórico aparecerá assim que as abas excederem os limites definidos.
      </div>
    `;
    return;
  }

  let itemsHTML = '';
  history.forEach(item => {
    let actionBadgeHTML = '';
    
    switch (item.action) {
      case 'discard':
        actionBadgeHTML = '<span class="badge badge-danger">Otimização (RAM)</span>';
        break;
      case 'reload':
        actionBadgeHTML = '<span class="badge badge-warning">Recarregamento</span>';
        break;
      case 'close':
        actionBadgeHTML = '<span class="badge badge-danger">Aba Fechada</span>';
        break;
      case 'notify':
        actionBadgeHTML = '<span class="badge badge-secondary">Notificação</span>';
        break;
      case 'skip_active':
        actionBadgeHTML = '<span class="badge badge-secondary">Ignorado (Ativo)</span>';
        break;
      case 'manual_discard':
        actionBadgeHTML = '<span class="badge badge-success">Suspensão Manual</span>';
        break;
      case 'manual_reload':
        actionBadgeHTML = '<span class="badge badge-success">Recarga Manual</span>';
        break;
      case 'manual_close':
        actionBadgeHTML = '<span class="badge badge-secondary">Fechamento Manual</span>';
        break;
      default:
        actionBadgeHTML = '<span class="badge badge-secondary">Ação</span>';
    }

    const timeStr = new Date(item.timestamp).toLocaleString('pt-BR');
    
    itemsHTML += `
      <div class="history-item">
        <div class="history-header">
          <div class="history-meta">
            ${actionBadgeHTML}
            <span class="history-time">${timeStr}</span>
          </div>
          <span class="font-mono font-bold" style="font-size: 0.8rem; color:var(--text-muted);">
            ID: ${item.id}
          </span>
        </div>
        <span class="history-description">
          <strong>${escapeHtml(item.tabTitle)}</strong>: ${escapeHtml(item.description)}
        </span>
        ${item.url ? `<span class="history-url">${escapeHtml(item.url)}</span>` : ''}
      </div>
    `;
  });

  historyItemsContainer.innerHTML = itemsHTML;
}

// HELPERS
function formatBytes(bytes) {
  if (bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return (mb / 1024).toFixed(1) + ' GB';
  }
  return Math.round(mb) + ' MB';
}

function getDomain(url) {
  if (!url) return '';
  try {
    const parser = new URL(url);
    return parser.hostname;
  } catch (e) {
    return url;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function renderPermissionsList(whitelist) {
  const listContainer = document.getElementById('permissions-list');
  if (!listContainer) return;
  
  if (whitelist.length === 0) {
    listContainer.innerHTML = `<li class="empty-state" style="padding: 10px 0;">Nenhum domínio adicionado ainda.</li>`;
    return;
  }
  
  let html = '';
  whitelist.forEach((item, index) => {
    html += `
      <li style="display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: rgba(255,255,255,0.02); border: 1px solid var(--border); border-radius: 8px;">
        <span style="font-weight: 500; font-size: 0.9rem; font-family: var(--font-sans); color: var(--text-primary);">${escapeHtml(item)}</span>
        <button class="btn-table-action btn-close-action btn-delete-permission" data-index="${index}" title="Remover permissão" style="padding: 4px; background: none; border: none; cursor: pointer; color: var(--text-secondary);">
          <svg class="btn-table-action-icon" viewBox="0 0 24 24" style="width: 14px; height: 14px; fill: currentColor;"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
        </button>
      </li>
    `;
  });
  
  listContainer.innerHTML = html;
  
  // Add delete click events
  document.querySelectorAll('.btn-delete-permission').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
      chrome.storage.local.get(['whitelist'], (res) => {
        const list = res.whitelist || [];
        list.splice(idx, 1);
        chrome.storage.local.set({ whitelist: list }, () => {
          chrome.runtime.sendMessage({ action: 'triggerCheck' });
        });
      });
    });
  });
}

function addPermissionEntry() {
  const input = document.getElementById('permission-url');
  if (!input) return;
  const url = input.value.trim().toLowerCase();
  if (!url) return;
  
  // Simple domain cleaner (remove protocol if user typed it)
  let cleanDomain = url;
  try {
    if (url.includes('://')) {
      cleanDomain = new URL(url).hostname;
    } else if (url.startsWith('www.')) {
      cleanDomain = url.substring(4);
    }
  } catch(e) {
    // fallback
  }
  
  chrome.storage.local.get(['whitelist'], (res) => {
    const list = res.whitelist || [];
    if (!list.includes(cleanDomain)) {
      list.push(cleanDomain);
      chrome.storage.local.set({ whitelist: list }, () => {
        input.value = '';
        chrome.runtime.sendMessage({ action: 'triggerCheck' });
      });
    } else {
      alert("Este domínio já está na lista.");
    }
  });
}
