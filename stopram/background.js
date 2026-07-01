const DEFAULT_SETTINGS = {
  ramLimit: 300 * 1024 * 1024, // 300 MB in bytes
  action: 'discard',
  interval: 10, // seconds
  simulationForce: false,
  notificationsEnabled: true
};

let monitoringIntervalId = null;

// Initialize settings on installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['settings', 'history'], (result) => {
    const updates = {};
    if (!result.settings) {
      updates.settings = DEFAULT_SETTINGS;
    }
    if (!result.history) {
      updates.history = [];
    }
    if (Object.keys(updates).length > 0) {
      chrome.storage.local.set(updates, () => {
        setupAlarmAndInterval();
      });
    } else {
      setupAlarmAndInterval();
    }
  });
});

// Setup alarm and monitoring loop
function setupAlarmAndInterval() {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || DEFAULT_SETTINGS;
    
    // Clear existing intervals and alarms
    if (monitoringIntervalId) {
      clearInterval(monitoringIntervalId);
      monitoringIntervalId = null;
    }
    chrome.alarms.clearAll();

    // Set alarm for 1 minute (keeps worker alive and wakes it up)
    chrome.alarms.create('check-memory-alarm', { periodInMinutes: 1 });

    // Start active interval
    startMonitoringLoop(settings.interval);
  });
}

function startMonitoringLoop(seconds) {
  if (monitoringIntervalId) {
    clearInterval(monitoringIntervalId);
  }
  
  // Run check immediately
  runMemoryCheck();
  
  // Run on interval
  monitoringIntervalId = setInterval(() => {
    runMemoryCheck();
  }, seconds * 1000);
}

// Watch for alarms (wakes up the worker)
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'check-memory-alarm') {
    runMemoryCheck();
    // Restart interval loop if it was cleared when service worker slept
    chrome.storage.local.get(['settings'], (result) => {
      const settings = result.settings || DEFAULT_SETTINGS;
      if (!monitoringIntervalId) {
        startMonitoringLoop(settings.interval);
      }
    });
  }
});

// Watch for changes in settings
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.settings) {
    setupAlarmAndInterval();
  }
});

// Keepalive when dashboard connects (port connection)
chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "stopram-keepalive") {
    port.onDisconnect.addListener(() => {
      // Port disconnected
    });
  }
});

// Main memory checking routine
function runMemoryCheck() {
  chrome.storage.local.get(['settings', 'history', 'simulatedMemory'], (data) => {
    const settings = data.settings || DEFAULT_SETTINGS;
    const history = data.history || [];
    let simulatedMemory = data.simulatedMemory || {};
    
    const isProcessesAvailable = typeof chrome.processes !== 'undefined';
    const useSimulation = !isProcessesAvailable || settings.simulationForce;

    // Get all open tabs
    chrome.tabs.query({}, (tabs) => {
      if (chrome.runtime.lastError) {
        console.error("Error querying tabs:", chrome.runtime.lastError);
        return;
      }

      if (useSimulation) {
        handleSimulationMode(tabs, settings, history, simulatedMemory);
      } else {
        handleRealMode(tabs, settings, history);
      }
    });
  });
}

// SIMULATION ENGINE
function handleSimulationMode(tabs, settings, history, simulatedMemory) {
  const newSimulatedMemory = {};
  const tabMemoryData = [];
  const now = Date.now();
  let updatedHistory = [...history];
  let historyChanged = false;

  tabs.forEach((tab) => {
    const tabId = tab.id;
    if (!tabId) return;

    // If tab is discarded, memory is 0
    if (tab.discarded) {
      newSimulatedMemory[tabId] = 0;
      tabMemoryData.push({
        tabId: tabId,
        title: tab.title || 'Aba Suspensa',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl || '',
        memory: 0,
        cpu: 0,
        pid: -1,
        active: tab.active,
        discarded: true,
        isSimulated: true
      });
      return;
    }

    // Get previous value or initialize
    let prevMem = simulatedMemory[tabId];
    let currentMem;
    let cpu;

    if (prevMem === undefined || prevMem === 0) {
      // Initialize with base memory
      // Active tabs start higher
      currentMem = tab.active 
        ? Math.floor(120 * 1024 * 1024 + Math.random() * 150 * 1024 * 1024) // 120MB - 270MB
        : Math.floor(40 * 1024 * 1024 + Math.random() * 100 * 1024 * 1024);  // 40MB - 140MB
    } else {
      // Drift memory: active tabs drift up faster, background tabs fluctuate
      // Some tabs might behave worse and leak memory
      const leakFactor = (tabId % 7 === 0) ? 1.5 : 1.0; // every 7th tab has a "memory leak"
      const driftDirection = tab.active ? (Math.random() > 0.35 ? 1 : -1) : (Math.random() > 0.5 ? 1 : -1);
      const driftAmount = Math.floor(Math.random() * 15 * 1024 * 1024 * leakFactor); // up to 15-22MB
      
      currentMem = prevMem + (driftDirection * driftAmount);

      // Keep within bounds: min 25MB
      if (currentMem < 25 * 1024 * 1024) {
        currentMem = Math.floor(25 * 1024 * 1024 + Math.random() * 5 * 1024 * 1024);
      }
    }

    // Determine CPU based on activity
    if (tab.active) {
      cpu = Math.round((4 + Math.random() * 14) * 10) / 10; // 4% - 18%
    } else {
      cpu = Math.round((0.1 + Math.random() * 1.4) * 10) / 10; // 0.1% - 1.5%
    }

    newSimulatedMemory[tabId] = currentMem;

    tabMemoryData.push({
      tabId: tabId,
      title: tab.title || 'Aba Sem Título',
      url: tab.url || '',
      favIconUrl: tab.favIconUrl || '',
      memory: currentMem,
      cpu: cpu,
      pid: 20000 + tabId, // Mock PID
      active: tab.active,
      discarded: false,
      isSimulated: true
    });

    // Check limit
    if (currentMem >= settings.ramLimit) {
      const result = executeTabAction(tab, currentMem, settings, updatedHistory);
      if (result.triggered) {
        updatedHistory = result.history;
        historyChanged = true;
        // Reset simulated memory of this tab to 0 since action was taken
        newSimulatedMemory[tabId] = 0;
      }
    }
  });

  // Save state
  const updates = {
    tabMemoryData: tabMemoryData,
    simulatedMemory: newSimulatedMemory,
    lastChecked: now,
    mode: 'simulation'
  };

  if (historyChanged) {
    updates.history = updatedHistory;
  }

  chrome.storage.local.set(updates, () => {
    notifyUIUpdated();
  });
}

// REAL MONITORING ENGINE (chrome.processes)
function handleRealMode(tabs, settings, history) {
  chrome.processes.getProcessInfo([], true, (processes) => {
    if (chrome.runtime.lastError) {
      console.warn("Processes API error, falling back to Simulation Mode:", chrome.runtime.lastError.message);
      // Fallback
      handleSimulationMode(tabs, settings, history, {});
      return;
    }

    const tabMemoryData = [];
    const now = Date.now();
    let updatedHistory = [...history];
    let historyChanged = false;

    // Create process map: pid -> { memory, cpu, tasks }
    const pidMap = {};
    for (let pidStr in processes) {
      const pid = parseInt(pidStr, 10);
      const proc = processes[pidStr];
      pidMap[pid] = {
        memory: proc.privateMemory || 0,
        cpu: proc.cpu || 0,
        tasks: proc.tasks || []
      };
    }

    // Map tabId -> pid details
    const tabToProcessMap = {};
    for (let pid in pidMap) {
      const proc = pidMap[pid];
      proc.tasks.forEach((task) => {
        if (task.tabId) {
          tabToProcessMap[task.tabId] = {
            pid: parseInt(pid, 10),
            memory: proc.memory,
            cpu: proc.cpu
          };
        }
      });
    }

    tabs.forEach((tab) => {
      const tabId = tab.id;
      if (!tabId) return;

      if (tab.discarded) {
        tabMemoryData.push({
          tabId: tabId,
          title: tab.title || 'Aba Suspensa',
          url: tab.url || '',
          favIconUrl: tab.favIconUrl || '',
          memory: 0,
          cpu: 0,
          pid: -1,
          active: tab.active,
          discarded: true,
          isSimulated: false
        });
        return;
      }

      const procInfo = tabToProcessMap[tabId];
      const memory = procInfo ? procInfo.memory : 0;
      const cpu = procInfo ? procInfo.cpu : 0;
      const pid = procInfo ? procInfo.pid : 0;

      tabMemoryData.push({
        tabId: tabId,
        title: tab.title || 'Aba Sem Título',
        url: tab.url || '',
        favIconUrl: tab.favIconUrl || '',
        memory: memory,
        cpu: Math.round(cpu * 10) / 10,
        pid: pid,
        active: tab.active,
        discarded: false,
        isSimulated: false
      });

      // Check limit (only if memory is valid)
      if (memory > 0 && memory >= settings.ramLimit) {
        const result = executeTabAction(tab, memory, settings, updatedHistory);
        if (result.triggered) {
          updatedHistory = result.history;
          historyChanged = true;
        }
      }
    });

    const updates = {
      tabMemoryData: tabMemoryData,
      lastChecked: now,
      mode: 'real'
    };

    if (historyChanged) {
      updates.history = updatedHistory;
    }

    chrome.storage.local.set(updates, () => {
      notifyUIUpdated();
    });
  });
}

// ACTION DISPATCHER
function executeTabAction(tab, memory, settings, history) {
  const tabId = tab.id;
  const tabTitle = tab.title || 'Aba Sem Título';
  const limitMB = Math.round(settings.ramLimit / (1024 * 1024));
  const currentMB = Math.round(memory / (1024 * 1024));

  let finalAction = settings.action;
  let actionLoggedText = '';
  let skipAction = false;

  // Active tab safety check
  if (tab.active && finalAction === 'discard') {
    skipAction = true;
    
    // Check if we already logged a skip recently to avoid spam
    const lastActiveLog = history.find(h => h.tabId === tabId && h.action === 'skip_active');
    const oneMinuteAgo = Date.now() - 60 * 1000;
    
    if (lastActiveLog && lastActiveLog.timestamp > oneMinuteAgo) {
      return { triggered: false };
    }
  }

  if (skipAction) {
    const historyItem = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      tabId: tabId,
      tabTitle: tabTitle,
      url: tab.url || '',
      action: 'skip_active',
      memoryUsed: memory,
      description: `Aba consumindo ${currentMB} MB (limite: ${limitMB} MB). Suspensão ignorada por ser a aba ativa.`
    };
    
    const newHistory = [historyItem, ...history].slice(0, 50);
    
    if (settings.notificationsEnabled) {
      chrome.notifications.create(`skip-${tabId}-${Date.now()}`, {
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Aviso de Memória: Aba Ativa',
        message: `A aba "${tabTitle}" está usando ${currentMB} MB, mas não foi suspensa por ser a aba ativa.`,
        priority: 1
      });
    }

    return { triggered: true, history: newHistory };
  }

  // Execute action
  if (finalAction === 'discard') {
    chrome.tabs.discard(tabId, () => {
      if (chrome.runtime.lastError) {
        console.error("Error discarding tab:", chrome.runtime.lastError.message);
      }
    });
    actionLoggedText = `Suspensa`;
  } else if (finalAction === 'reload') {
    chrome.tabs.reload(tabId);
    actionLoggedText = `Recarregada`;
  } else if (finalAction === 'close') {
    chrome.tabs.remove(tabId);
    actionLoggedText = `Fechada`;
  } else if (finalAction === 'notify') {
    // Check if we notified about this tab in the last 2 minutes
    const lastNotifyLog = history.find(h => h.tabId === tabId && h.action === 'notify' && h.timestamp > (Date.now() - 120 * 1000));
    if (lastNotifyLog) {
      return { triggered: false };
    }
    actionLoggedText = `Notificado`;
  }

  // Add history log
  const historyItem = {
    id: Math.random().toString(36).substring(2, 9),
    timestamp: Date.now(),
    tabId: tabId,
    tabTitle: tabTitle,
    url: tab.url || '',
    action: finalAction,
    memoryUsed: memory,
    description: `Aba usando ${currentMB} MB superou o limite de ${limitMB} MB. Ação executada: ${actionLoggedText}.`
  };

  const newHistory = [historyItem, ...history].slice(0, 50);

  // Show desktop notification
  if (settings.notificationsEnabled) {
    let titleStr = 'StopRAM: Limite Excedido';
    let msgStr = `A aba "${tabTitle}" excedeu o limite de ${limitMB} MB (${currentMB} MB) e foi ${actionLoggedText.toLowerCase()}.`;
    
    if (finalAction === 'notify') {
      titleStr = 'Alerta de Alto Uso de RAM';
      msgStr = `A aba "${tabTitle}" está usando ${currentMB} MB. Considere gerenciá-la.`;
    }

    chrome.notifications.create(`action-${tabId}-${Date.now()}`, {
      type: 'basic',
      iconUrl: 'icon128.png',
      title: titleStr,
      message: msgStr,
      priority: 2
    });
  }

  return { triggered: true, history: newHistory };
}

// Broadcast event to active UI pages (popup or dashboard)
function notifyUIUpdated() {
  chrome.runtime.sendMessage({ action: 'tabMemoryUpdated' }).catch(() => {
    // Fail silently when no UI pages are listening
  });
}

// LISTEN FOR MANUAL USER ACTIONS FROM PORT/MESSAGES
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'forceDiscard') {
    chrome.tabs.discard(message.tabId, (discardedTab) => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, error: chrome.runtime.lastError.message });
      } else {
        // Reset simulation memory of this tab
        chrome.storage.local.get(['simulatedMemory', 'history'], (data) => {
          let simulatedMemory = data.simulatedMemory || {};
          simulatedMemory[message.tabId] = 0;
          
          chrome.tabs.get(message.tabId, (tab) => {
            const tabTitle = tab ? tab.title : 'Aba';
            const historyItem = {
              id: Math.random().toString(36).substring(2, 9),
              timestamp: Date.now(),
              tabId: message.tabId,
              tabTitle: tabTitle,
              url: tab ? tab.url : '',
              action: 'manual_discard',
              memoryUsed: 0,
              description: `Aba suspensa manualmente pelo usuário.`
            };
            const newHistory = [historyItem, ...(data.history || [])].slice(0, 50);
            
            chrome.storage.local.set({ simulatedMemory, history: newHistory }, () => {
              runMemoryCheck();
              sendResponse({ success: true });
            });
          });
        });
      }
    });
    return true; // async response
  }
  
  if (message.action === 'forceReload') {
    chrome.tabs.reload(message.tabId, {}, () => {
      chrome.storage.local.get(['simulatedMemory', 'history'], (data) => {
        let simulatedMemory = data.simulatedMemory || {};
        simulatedMemory[message.tabId] = Math.floor(40 * 1024 * 1024 + Math.random() * 40 * 1024 * 1024);
        
        chrome.tabs.get(message.tabId, (tab) => {
          const tabTitle = tab ? tab.title : 'Aba';
          const historyItem = {
            id: Math.random().toString(36).substring(2, 9),
            timestamp: Date.now(),
            tabId: message.tabId,
            tabTitle: tabTitle,
            url: tab ? tab.url : '',
            action: 'manual_reload',
            memoryUsed: 0,
            description: `Aba recarregada manualmente pelo usuário.`
          };
          const newHistory = [historyItem, ...(data.history || [])].slice(0, 50);
          
          chrome.storage.local.set({ simulatedMemory, history: newHistory }, () => {
            runMemoryCheck();
            sendResponse({ success: true });
          });
        });
      });
    });
    return true;
  }
  
  if (message.action === 'forceClose') {
    chrome.tabs.remove(message.tabId, () => {
      chrome.storage.local.get(['simulatedMemory', 'history'], (data) => {
        let simulatedMemory = data.simulatedMemory || {};
        delete simulatedMemory[message.tabId];
        
        const historyItem = {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: Date.now(),
          tabId: message.tabId,
          tabTitle: message.tabTitle || 'Aba',
          url: message.tabUrl || '',
          action: 'manual_close',
          memoryUsed: 0,
          description: `Aba fechada manualmente pelo usuário.`
        };
        const newHistory = [historyItem, ...(data.history || [])].slice(0, 50);
        
        chrome.storage.local.set({ simulatedMemory, history: newHistory }, () => {
          runMemoryCheck();
          sendResponse({ success: true });
        });
      });
    });
    return true;
  }
  
  if (message.action === 'triggerCheck') {
    runMemoryCheck();
    sendResponse({ success: true });
    return false;
  }
});
