document.addEventListener("DOMContentLoaded", () => {
  // ELEMENTOS DO DOM
  const mainView = document.getElementById("main-view");
  const settingsView = document.getElementById("settings-view");
  
  const toggleSettingsBtn = document.getElementById("toggle-settings-btn");
  const advancedModeBtn = document.getElementById("advanced-mode-btn");
  const backBtn = document.getElementById("back-btn");

  // CONFIGURAÇÃO DO MODO ABA (AVANÇADO)
  if (document.documentElement.classList.contains("mode-tab")) {
    if (advancedModeBtn) advancedModeBtn.style.display = "none";
  } else {
    if (advancedModeBtn) {
      advancedModeBtn.addEventListener("click", () => {
        chrome.tabs.create({ url: chrome.runtime.getURL("popup.html?mode=tab") });
      });
    }
  }
  const addNoteBtn = document.getElementById("add-note-btn");
  const downloadAllBtn = document.getElementById("download-all-btn");
  const clearAllBtn = document.getElementById("clear-all-btn");
  const clearSearchBtn = document.getElementById("clear-search-btn");
  
  const noteInput = document.getElementById("note-input");
  const searchInput = document.getElementById("search-input");
  const autoDownloadToggle = document.getElementById("auto-download-toggle");
  const prefixInput = document.getElementById("prefix-input");
  
  const notesContainer = document.getElementById("notes-container");
  const notesCounter = document.getElementById("notes-counter");
  const emptyState = document.getElementById("empty-state");

  // ESTADO DA APLICAÇÃO
  let notes = [];
  let settings = {
    autoDownload: true,
    filePrefix: "savetext_"
  };
  let searchQuery = "";

  // CARREGAR DADOS DO STORAGE
  function loadData() {
    chrome.storage.local.get(["notes", "settings"], (result) => {
      if (result.notes) {
        notes = result.notes;
      }
      if (result.settings) {
        settings = result.settings;
      } else {
        // Inicializa se não existirem
        chrome.storage.local.set({ settings });
      }

      // Atualiza interface com configurações
      autoDownloadToggle.checked = settings.autoDownload;
      prefixInput.value = settings.filePrefix;

      renderNotes();
    });
  }

  // RENDERIZAR NOTAS NA TELA
  function renderNotes() {
    notesContainer.innerHTML = "";
    
    // Filtra notas com base na pesquisa
    const filteredNotes = notes.filter(note => {
      const textMatch = note.text.toLowerCase().includes(searchQuery.toLowerCase());
      const titleMatch = note.title.toLowerCase().includes(searchQuery.toLowerCase());
      const urlMatch = note.url.toLowerCase().includes(searchQuery.toLowerCase());
      return textMatch || titleMatch || urlMatch;
    });

    // Atualiza estatísticas (Modo Avançado/Aba)
    const statsTotalNotes = document.getElementById("stats-total-notes");
    const statsAutoDownloads = document.getElementById("stats-auto-downloads");
    const statsManualNotes = document.getElementById("stats-manual-notes");

    if (statsTotalNotes) statsTotalNotes.textContent = notes.length;
    if (statsAutoDownloads) statsAutoDownloads.textContent = settings.autoDownload ? "Ativo" : "Inativo";
    if (statsManualNotes) {
      const manualCount = notes.filter(n => n.url === "manual" || !n.url).length;
      statsManualNotes.textContent = manualCount;
    }

    // Atualiza contador
    if (notes.length === 0) {
      notesCounter.textContent = "Nenhuma nota salva";
      emptyState.classList.remove("hidden");
      downloadAllBtn.disabled = true;
      clearAllBtn.disabled = true;
    } else {
      emptyState.classList.add("hidden");
      downloadAllBtn.disabled = false;
      clearAllBtn.disabled = false;

      if (searchQuery) {
        notesCounter.textContent = `${filteredNotes.length} de ${notes.length} notas encontradas`;
      } else {
        notesCounter.textContent = `${notes.length} ${notes.length === 1 ? 'nota salva' : 'notas salvas'}`;
      }
    }

    // Renderiza cada nota
    filteredNotes.forEach(note => {
      const card = createNoteCard(note);
      notesContainer.appendChild(card);
    });
  }

  // CRIAR CARD DE NOTA (DOM Element)
  function createNoteCard(note) {
    const card = document.createElement("div");
    
    // Determina cor persistente (estilo Notas Autoadesivas)
    const colors = ["yellow", "blue", "green", "purple", "pink"];
    let hash = 0;
    const noteIdStr = note.id || "";
    for (let i = 0; i < noteIdStr.length; i++) {
      hash = noteIdStr.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colorClass = "note-color-" + colors[Math.abs(hash) % colors.length];
    
    card.className = `note-card ${colorClass}`;
    card.dataset.id = note.id;

    // Formata Data
    const dateFormatted = formatDate(note.date);

    // Domínio da URL
    let domain = "";
    if (note.url && note.url.startsWith("http")) {
      try {
        domain = new URL(note.url).hostname;
      } catch (e) {
        domain = "Link";
      }
    }

    const isManual = note.url === "manual" || !note.url;

    card.innerHTML = `
      <div class="note-header">
        <div class="note-metadata">
          <div class="note-title" title="${escapeHtml(note.title)}">${escapeHtml(note.title)}</div>
          ${!isManual ? `
            <a href="${escapeHtml(note.url)}" target="_blank" class="note-url" title="${escapeHtml(note.url)}">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="note-url-icon"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
              ${escapeHtml(domain)}
            </a>
          ` : `
            <span class="note-url">Nota Manual</span>
          `}
        </div>
        <div class="note-date">${dateFormatted}</div>
      </div>
      <div class="note-body">${escapeHtml(note.text)}</div>
      <div class="note-actions">
        <button class="action-btn btn-edit" title="Editar Nota">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
        </button>
        <button class="action-btn btn-copy" title="Copiar Texto">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
        </button>
        <button class="action-btn btn-download" title="Baixar .txt">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        </button>
        <button class="action-btn btn-delete" title="Excluir Nota">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
      </div>
    `;

    // EVENT LISTENERS DO CARD
    const btnEdit = card.querySelector(".btn-edit");
    const btnCopy = card.querySelector(".btn-copy");
    const btnDownload = card.querySelector(".btn-download");
    const btnDelete = card.querySelector(".btn-delete");
    const noteBody = card.querySelector(".note-body");

    // Copiar Texto
    btnCopy.addEventListener("click", () => {
      navigator.clipboard.writeText(note.text).then(() => {
        btnCopy.classList.add("btn-copy-success");
        const originalHtml = btnCopy.innerHTML;
        // Icone de Checkmark
        btnCopy.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="btn-icon"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
        
        setTimeout(() => {
          btnCopy.classList.remove("btn-copy-success");
          btnCopy.innerHTML = originalHtml;
        }, 1500);
      });
    });

    // Baixar nota individual
    btnDownload.addEventListener("click", () => {
      downloadNoteAsTxt(note);
    });

    // Excluir nota
    btnDelete.addEventListener("click", () => {
      // Pequeno efeito visual de saída
      card.style.transform = "scale(0.95)";
      card.style.opacity = "0";
      card.style.transition = "all 0.2s ease";
      
      setTimeout(() => {
        deleteNote(note.id);
      }, 200);
    });

    // Editar nota
    btnEdit.addEventListener("click", () => {
      enterEditMode(card, note, noteBody);
    });

    return card;
  }

  // ATIVAR MODO DE EDIÇÃO NO CARD
  function enterEditMode(card, note, bodyElement) {
    const originalText = note.text;
    const actionsContainer = card.querySelector(".note-actions");
    
    // Esconde ações normais
    actionsContainer.classList.add("hidden");
    
    // Cria textarea para edição
    const textarea = document.createElement("textarea");
    textarea.className = "edit-textarea";
    textarea.value = originalText;
    
    // Substitui o corpo pelo textarea
    bodyElement.replaceWith(textarea);
    textarea.focus();

    // Cria botões de Salvar e Cancelar
    const editActions = document.createElement("div");
    editActions.className = "edit-actions";
    editActions.innerHTML = `
      <button class="btn-small cancel">Cancelar</button>
      <button class="btn-small save">Salvar</button>
    `;
    card.appendChild(editActions);

    const btnCancel = editActions.querySelector(".cancel");
    const btnSave = editActions.querySelector(".save");

    // Ação Cancelar
    function exitEdit() {
      textarea.replaceWith(bodyElement);
      editActions.remove();
      actionsContainer.classList.remove("hidden");
    }

    btnCancel.addEventListener("click", exitEdit);

    // Ação Salvar
    btnSave.addEventListener("click", () => {
      const newText = textarea.value.trim();
      if (newText && newText !== originalText) {
        updateNoteText(note.id, newText);
      } else {
        exitEdit();
      }
    });
  }

  // ADICIONAR NOTA MANUALMENTE
  function addManualNote() {
    const text = noteInput.value.trim();
    if (!text) return;

    const newNote = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11),
      text: text,
      url: "manual",
      title: "Nota Manual",
      date: new Date().toISOString()
    };

    notes.unshift(newNote);
    
    chrome.storage.local.set({ notes: notes }, () => {
      noteInput.value = "";
      noteInput.style.height = "38px"; // Reseta altura do textarea
      renderNotes();
      
      // Auto-download para nota manual também, se ativado nas configurações
      if (settings.autoDownload) {
        downloadNoteAsTxt(newNote);
      }
    });
  }

  // ATUALIZAR CONTEÚDO DE UMA NOTA
  function updateNoteText(id, newText) {
    notes = notes.map(note => {
      if (note.id === id) {
        return { ...note, text: newText };
      }
      return note;
    });

    chrome.storage.local.set({ notes: notes }, () => {
      renderNotes();
    });
  }

  // EXCLUIR UMA NOTA
  function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    chrome.storage.local.set({ notes: notes }, () => {
      renderNotes();
    });
  }

  // PESQUISA
  searchInput.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    if (searchQuery) {
      clearSearchBtn.classList.remove("hidden");
    } else {
      clearSearchBtn.classList.add("hidden");
    }
    renderNotes();
  });

  clearSearchBtn.addEventListener("click", () => {
    searchInput.value = "";
    searchQuery = "";
    clearSearchBtn.classList.add("hidden");
    renderNotes();
    searchInput.focus();
  });

  // EXPANDIR TEXTAREA DE INSERÇÃO MANUAL CONFORME DIGITA
  noteInput.addEventListener("input", () => {
    noteInput.style.height = "auto";
    noteInput.style.height = (noteInput.scrollHeight) + "px";
  });

  // EVENTOS DE BOTÕES
  addNoteBtn.addEventListener("click", addManualNote);
  
  // Enter envia nota manual se não for Shift+Enter
  noteInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      addManualNote();
    }
  });

  // BAIXAR NOTA INDIVIDUAL
  function downloadNoteAsTxt(note) {
    const date = new Date(note.date);
    const dateStr = date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, '0') + "-" +
      String(date.getDate()).padStart(2, '0') + "_" +
      String(date.getHours()).padStart(2, '0') + "-" +
      String(date.getMinutes()).padStart(2, '0') + "-" +
      String(date.getSeconds()).padStart(2, '0');

    let cleanTitle = note.title
      ? note.title.replace(/[^a-z0-9\-_]/gi, '_').substring(0, 20)
      : "nota";
    cleanTitle = cleanTitle.replace(/__+/g, '_').replace(/^_+|_+$/g, '');

    const filename = `${settings.filePrefix}${dateStr}_${cleanTitle}.txt`;
    const dataUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(note.text);

    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    });
  }

  // BAIXAR TODAS AS NOTAS CONSOLIDADAS
  downloadAllBtn.addEventListener("click", () => {
    if (notes.length === 0) return;

    const dateNow = new Date();
    const dateNowStr = dateNow.toLocaleString('pt-BR');
    
    let content = `==================================================\n`;
    content += `         SAVETEXT - EXPORTAÇÃO COMPLETA           \n`;
    content += `         Exportado em: ${dateNowStr}              \n`;
    content += `         Total de Notas: ${notes.length}          \n`;
    content += `==================================================\n\n`;

    notes.forEach((note, index) => {
      const noteDate = formatDate(note.date);
      content += `[NOTA #${notes.length - index}] ------------------------------------\n`;
      content += `Data: ${noteDate}\n`;
      content += `Título: ${note.title}\n`;
      if (note.url && note.url !== "manual") {
        content += `URL: ${note.url}\n`;
      }
      content += `--------------------------------------------------\n`;
      content += `${note.text}\n\n\n`;
    });

    const dateFileStr = dateNow.getFullYear() + "-" +
      String(dateNow.getMonth() + 1).padStart(2, '0') + "-" +
      String(dateNow.getDate()).padStart(2, '0') + "_" +
      String(dateNow.getHours()).padStart(2, '0') + "-" +
      String(dateNow.getMinutes()).padStart(2, '0');

    const filename = `${settings.filePrefix}todos_textos_${dateFileStr}.txt`;
    const dataUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(content);

    chrome.downloads.download({
      url: dataUrl,
      filename: filename,
      saveAs: false
    });
  });

  // LIMPAR TODAS AS NOTAS
  clearAllBtn.addEventListener("click", () => {
    if (notes.length === 0) return;

    const confirmClear = confirm("Tem certeza de que deseja excluir permanentemente todo o histórico de notas salvas?");
    if (confirmClear) {
      notes = [];
      chrome.storage.local.set({ notes: [] }, () => {
        renderNotes();
      });
    }
  });

  // CONFIGURAÇÕES - ABRE E FECHA
  toggleSettingsBtn.addEventListener("click", () => {
    mainView.classList.add("hidden");
    settingsView.classList.remove("hidden");
    
    // Sincroniza estado da sidebar
    const settingsMenuItem = document.querySelector('.menu-item[data-target="settings-view"]');
    if (settingsMenuItem) {
      document.querySelectorAll(".sidebar .menu-item").forEach(i => i.classList.remove("active"));
      settingsMenuItem.classList.add("active");
    }
  });

  backBtn.addEventListener("click", () => {
    settingsView.classList.add("hidden");
    mainView.classList.remove("hidden");
    
    // Sincroniza estado da sidebar
    const recortesMenuItem = document.querySelector('.menu-item[data-target="main-view"]');
    if (recortesMenuItem) {
      document.querySelectorAll(".sidebar .menu-item").forEach(i => i.classList.remove("active"));
      recortesMenuItem.classList.add("active");
    }
  });

  // NAVEGAÇÃO DA SIDEBAR (MODO ABA/AVANÇADO)
  const menuItems = document.querySelectorAll(".sidebar .menu-item");
  menuItems.forEach(item => {
    item.addEventListener("click", () => {
      menuItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      
      const target = item.getAttribute("data-target");
      document.querySelectorAll(".app-main").forEach(view => {
        view.classList.add("hidden");
      });
      document.getElementById(target).classList.remove("hidden");
    });
  });

  // CONFIGURAÇÕES - SALVA ALTERAÇÕES
  autoDownloadToggle.addEventListener("change", (e) => {
    settings.autoDownload = e.target.checked;
    chrome.storage.local.set({ settings });
    
    // Atualiza estatística no Modo Aba
    const statsAutoDownloads = document.getElementById("stats-auto-downloads");
    if (statsAutoDownloads) statsAutoDownloads.textContent = settings.autoDownload ? "Ativo" : "Inativo";
  });

  prefixInput.addEventListener("input", (e) => {
    settings.filePrefix = e.target.value.replace(/[^a-z0-9\-_]/gi, '_'); // Apenas caracteres válidos para nomes de arquivos
    chrome.storage.local.set({ settings });
  });

  // FUNÇÕES AUXILIARES
  function formatDate(isoString) {
    try {
      const date = new Date(isoString);
      // Retorna formato DD/MM HH:MM
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}/${month} às ${hours}:${minutes}`;
    } catch (e) {
      return "Data indisponível";
    }
  }

  function escapeHtml(text) {
    if (!text) return "";
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  // INICIAR
  loadData();
});
