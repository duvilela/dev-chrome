// Inicializa o menu de contexto ao instalar a extensão
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "saveTextNote",
    title: "Salvar no SaveText",
    contexts: ["selection"]
  });

  // Inicializa configurações padrão se não existirem
  chrome.storage.local.get(["settings"], (result) => {
    if (!result.settings) {
      chrome.storage.local.set({
        settings: {
          autoDownload: true,
          filePrefix: "savetext_"
        }
      });
    }
  });
});

// Escuta cliques no menu de contexto
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "saveTextNote" && info.selectionText) {
    const selectedText = info.selectionText;
    const pageUrl = tab ? tab.url : "";
    const pageTitle = tab ? tab.title : "";
    const timestamp = new Date().toISOString();

    const newNote = {
      id: "note_" + Date.now() + "_" + Math.random().toString(36).substring(2, 11),
      text: selectedText,
      url: pageUrl,
      title: pageTitle || "Página Web",
      date: timestamp
    };

    // Recupera as notas existentes e as configurações
    chrome.storage.local.get(["notes", "settings"], (result) => {
      const notes = result.notes || [];
      const settings = result.settings || {
        autoDownload: true,
        filePrefix: "savetext_"
      };

      // Adiciona a nova nota no topo do histórico
      notes.unshift(newNote);

      chrome.storage.local.set({ notes: notes }, () => {
        // Se o download automático estiver ativado, dispara o download
        if (settings.autoDownload) {
          triggerDownload(newNote, settings.filePrefix);
        }
      });
    });
  }
});

// Função auxiliar para baixar uma nota individual como arquivo .txt
function triggerDownload(note, prefix) {
  const date = new Date(note.date);
  const dateStr = date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, '0') + "-" +
    String(date.getDate()).padStart(2, '0') + "_" +
    String(date.getHours()).padStart(2, '0') + "-" +
    String(date.getMinutes()).padStart(2, '0') + "-" +
    String(date.getSeconds()).padStart(2, '0');

  // Limpa caracteres especiais do título do arquivo
  let cleanTitle = note.title
    ? note.title.replace(/[^a-z0-9\-_]/gi, '_').substring(0, 20)
    : "nota";
  cleanTitle = cleanTitle.replace(/__+/g, '_').replace(/^_+|_+$/g, '');

  const filename = `${prefix}${dateStr}_${cleanTitle}.txt`;
  const dataUrl = "data:text/plain;charset=utf-8," + encodeURIComponent(note.text);

  chrome.downloads.download({
    url: dataUrl,
    filename: filename,
    saveAs: false
  });
}
