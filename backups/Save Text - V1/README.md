# SaveText 📝

**SaveText** é uma extensão para Google Chrome (e outros navegadores baseados em Chromium) desenvolvida sob o **Manifest V3**. Ela foi projetada para simplificar a captura de trechos de texto de páginas da web, permitindo salvá-los instantaneamente no histórico local ou exportá-los como arquivos `.txt`.

---

## 🚀 Funcionalidades Premium

1. **Captura Rápida no Clique Direito:**
   - Selecione qualquer trecho de texto em uma página, clique com o botão direito e escolha **"Salvar no SaveText"**.

2. **Dashboard de Controle no Popup:**
   - Uma interface moderna e elegante com efeito *glassmorphism* em tema escuro.
   - Lista cronológica de todos os recortes de texto.

3. **Metadados de Origem:**
   - Cada nota armazena a data/hora e o link (URL) da página web de onde foi copiada, facilitando a consulta futura do contexto original.

4. **Pesquisa Dinâmica:**
   - Filtre suas notas instantaneamente por conteúdo, título da página ou link usando a barra de busca no topo do popup.

5. **Edição In-line e Notas Manuais:**
   - Edite o texto de qualquer nota diretamente na lista com um clique.
   - Digite e adicione notas manuais diretamente através do painel.

6. **Exportação Flexível:**
   - Copie notas de volta para a área de transferência com feedback visual de sucesso.
   - Faça download de notas individuais como arquivos `.txt` ou consolide todo o seu histórico em um único arquivo de texto estruturado.

7. **Configurações Personalizadas:**
   - Ative/desative o download automático de arquivos `.txt` ao salvar pelo menu de contexto.
   - Defina um prefixo padrão personalizado para os nomes dos arquivos baixados.

---

## 📂 Estrutura de Arquivos da Extensão

- `manifest.json`: Manifesto de configuração da extensão (permissões, ícones, popup e script de background).
- `background.js`: Script de serviço em segundo plano (cria o menu de contexto, captura os dados da aba e gerencia os downloads automáticos).
- `popup.html`: Interface visual do painel/dashboard.
- `popup.css`: Folha de estilo em tema escuro (Deep Slate) com fontes personalizadas e micro-animações.
- `popup.js`: Lógica de gerenciamento das notas (carregamento do storage, busca, edição, exclusão e exportações).
- `icons/`: Pasta com os ícones oficiais nos tamanhos de 16px, 32px, 48px e 128px.

---

## 🛠️ Como Instalar Localmente no Navegador

1. Faça o download e extraia o arquivo zipado da extensão (ou use esta pasta diretamente).
2. Abra o seu navegador Chrome e acesse `chrome://extensions/`.
3. No canto superior direito, ative a chave **"Modo do desenvolvedor"**.
4. No canto superior esquerdo, clique no botão **"Carregar sem compactação"**.
5. Selecione a pasta raiz da extensão (que contém este arquivo `README.md` e o `manifest.json`).
6. Fixe o ícone do **SaveText** na barra de ferramentas para acesso rápido.

---

## 🛡️ Notas de Privacidade e Segurança

- **100% Local:** Todo o histórico de notas e configurações é armazenado exclusivamente no banco de dados local do seu próprio navegador (`chrome.storage.local`). Nenhum dado de navegação ou conteúdo de texto é transmitido para servidores externos.
- **Sem Rastreamento:** A extensão não contém scripts de telemetria, cookies analíticos ou anúncios.
