// State
let localSettings = null;

// DOM Elements
const statTabs = document.getElementById('stat-tabs');
const statRam = document.getElementById('stat-ram');
const consumersList = document.getElementById('consumers-list');
const popupModeText = document.getElementById('popup-mode-text');
const btnOpenSettings = document.getElementById('btn-open-settings');
const btnDashboard = document.getElementById('btn-dashboard');

// INITIALIZE
document.addEventListener('DOMContentLoaded', () => {
  loadPopupData();
  setupEventListeners();

  // Poll for instant responsiveness
  setInterval(() => {
    chrome.runtime.sendMessage({ action: 'triggerCheck' });
  }, 2000);
});

// EVENT LISTENERS
function setupEventListeners() {
  btnOpenSettings.addEventListener('click', openDashboard);
  btnDashboard.addEventListener('click', openDashboard);

  // Listen to background memory updates
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === 'tabMemoryUpdated') {
      loadPopupData();
    }
  });
}

function openDashboard() {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  }
}

// LOAD DATA
function loadPopupData() {
  chrome.storage.local.get(['settings', 'tabMemoryData', 'mode'], (data) => {
    localSettings = data.settings || {
      ramLimit: 300 * 1024 * 1024,
      action: 'discard',
      interval: 15,
      simulationForce: false,
      notificationsEnabled: true
    };

    const tabMemoryData = data.tabMemoryData || [];
    const mode = data.mode || 'simulation';

    // Update Mode Text
    if (mode === 'real') {
      popupModeText.textContent = "Monitorando RAM";
      popupModeText.style.color = "var(--color-green)";
    } else {
      popupModeText.textContent = "Simulando RAM";
      popupModeText.style.color = "var(--color-amber)";
    }

    // Totals
    statTabs.textContent = tabMemoryData.length;
    
    const totalBytes = tabMemoryData.reduce((acc, curr) => acc + curr.memory, 0);
    statRam.textContent = formatBytes(totalBytes);

    // Filter and Sort Top 4 Consumers
    // Filter out already suspended tabs if possible, or include them as 0 memory?
    // Let's sort all tabs by memory descending, and get the top 4
    const sortedTabs = [...tabMemoryData]
      .sort((a, b) => b.memory - a.memory)
      .slice(0, 4);

    renderConsumers(sortedTabs);
  });
}

// RENDER TOP LIST
function renderConsumers(tabs) {
  if (!consumersList) return;

  if (tabs.length === 0) {
    consumersList.innerHTML = `
      <div class="empty-state">
        Nenhuma aba aberta detectada.
      </div>
    `;
    return;
  }

  const limitBytes = localSettings ? localSettings.ramLimit : 300 * 1024 * 1024;
  let listHTML = '';

  tabs.forEach(tab => {
    const percent = Math.min(Math.round((tab.memory / limitBytes) * 100), 100);
    
    const isSuspended = tab.discarded;
    const isActive = tab.active;
    const isSpecial = tab.isSpecial;
    const specialClass = isSpecial ? 'special-row' : '';

    let barColorClass = 'fill-green';
    if (isSpecial) {
      barColorClass = 'fill-special';
    } else if (percent >= 85) {
      barColorClass = 'fill-rose';
    } else if (percent >= 50) {
      barColorClass = 'fill-amber';
    }

    const firstChar = tab.title ? tab.title.charAt(0).toUpperCase() : '?';
    const faviconHTML = tab.favIconUrl && tab.favIconUrl.startsWith('http')
      ? `<img class="tab-icon" src="${tab.favIconUrl}">`
      : '';
    const fallbackIconHTML = `<div class="tab-icon-fallback" style="${tab.favIconUrl && tab.favIconUrl.startsWith('http') ? 'display:none;' : ''}">${firstChar}</div>`;

    listHTML += `
      <div class="tab-row ${specialClass}">
        <div class="row-top">
          ${faviconHTML}
          ${fallbackIconHTML}
          <span class="tab-title-text" title="${escapeHtml(tab.title)}">${escapeHtml(tab.title)}</span>
          <div class="tab-actions">
            <button class="mini-btn btn-reload" data-id="${tab.tabId}" title="Recarregar" ${isSuspended ? 'disabled' : ''}>
              <svg class="mini-btn-icon" viewBox="0 0 24 24"><path d="M17.65 6.35A7.958 7.958 0 0 0 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08A5.99 5.99 0 0 1 12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
            </button>
            <button class="mini-btn btn-discard" data-id="${tab.tabId}" title="${isSpecial ? 'Abas especiais não podem ser suspensas' : (isActive ? 'Abas ativas não podem ser suspensas' : 'Suspender')}" ${isSuspended || isActive || isSpecial ? 'disabled' : ''}>
              <svg class="mini-btn-icon" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></svg>
            </button>
          </div>
        </div>
        <div class="row-bottom">
          <div class="progress-bar-bg">
            <div class="progress-bar-fill ${barColorClass}" style="width: ${percent}%;"></div>
          </div>
          <span class="memory-value" style="${isSpecial ? 'color: #3b82f6;' : ''}">${formatBytes(tab.memory)}</span>
        </div>
      </div>
    `;
  });

  consumersList.innerHTML = listHTML;

  // Handle broken favicons dynamically (inline onerror is blocked by CSP in MV3 Extensions)
  document.querySelectorAll('.tab-icon').forEach(img => {
    img.addEventListener('error', (e) => {
      e.target.style.display = 'none';
      const fallback = e.target.nextElementSibling;
      if (fallback) {
        fallback.style.display = 'flex';
      }
    });
  });
 
  // Reload Event
  document.querySelectorAll('.btn-reload').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.currentTarget;
      const tabId = parseInt(btnEl.getAttribute('data-id'), 10);
      btnEl.disabled = true;
      chrome.runtime.sendMessage({ action: 'forceReload', tabId }, () => {
        setTimeout(loadPopupData, 500);
      });
    });
  });

  // Discard Event
  document.querySelectorAll('.btn-discard').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const btnEl = e.currentTarget;
      const tabId = parseInt(btnEl.getAttribute('data-id'), 10);
      btnEl.disabled = true;
      chrome.runtime.sendMessage({ action: 'forceDiscard', tabId }, (res) => {
        if (res && !res.success) {
          alert("Não foi possível suspender a aba ativa.");
          btnEl.disabled = false;
        } else {
          setTimeout(loadPopupData, 500);
        }
      });
    });
  });
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

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
