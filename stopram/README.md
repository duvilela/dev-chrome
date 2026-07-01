# StopRAM - Limitador de Memória de Abas 🚀

**StopRAM** é uma extensão premium desenvolvida para o Google Chrome (Manifest V3) que monitora o uso de memória RAM de cada aba e executa ações de otimização automáticas (como suspensão, recarregamento ou fechamento) sempre que os limites de RAM definidos pelo usuário forem ultrapassados.

A extensão conta com um **Modo de Simulação Inteligente**, permitindo testar e demonstrar toda a sua lógica de otimização em versões estáveis do Chrome sem a necessidade da API restrita `chrome.processes`.

---

## 💎 Principais Funcionalidades

- **Monitoramento Dinâmico**: Visualização em tempo real das abas abertas, seus respectivos Process IDs (PID), uso de CPU e consumo de memória RAM.
- **Exceções e Proteção (Abas Especiais)**:
  - **Permissões (Whitelist)**: Uma seção dedicada para adicionar domínios (ex: `youtube.com`). Abas destes sites são protegidas de suspensão automática ou manual, aparecendo com o estado "Especial" (azul).
  - **Abas Fixadas (Pinned)**: Qualquer aba fixada nativamente no Chrome é automaticamente protegida contra suspensão e identificada como "Especial", sem necessidade de regras adicionais.
- **Ações Automáticas Personalizáveis**:
  - **Suspender Aba (Descarte)**: Libera 100% da memória RAM da aba inativa, mantendo-a aberta no navegador para recarga automática ao ser clicada. (Bloqueado para abas "Especiais").
  - **Recarregar Aba**: Força a recarga para limpar vazamentos de memória (funciona para abas normais e especiais).
  - **Fechar Aba**: Remove a aba para economizar recursos críticos (funciona para abas normais e especiais).
  - **Apenas Notificar**: Exibe um alerta nativo na área de trabalho.
- **Painel de Controle SaaS (Full Dashboard)**:
  - Lista de abas interativa com busca instantânea e ordenação (por RAM, CPU ou título).
  - Gerenciador de exceções (Permissões) para cadastrar e remover domínios protegidos.
  - Gráficos visuais de consumo com cores de alerta (verde, amarelo, vermelho pulsante) e status especial (azul).
  - Formulário completo para definir limites de RAM (100 MB a 2 GB) e frequências de varredura (5s a 60s).
  - Histórico detalhado de ações aplicadas pela extensão.
- **Popup Compacto (Toolbar)**:
  - Exibição instantânea das 4 abas que mais consomem recursos, com identificação de abas "Especiais".
  - Atalhos rápidos para suspender ou recarregar abas individualmente (botão de suspensão desabilitado para abas protegidas).
  - Indicador do uso de RAM total somado de todas as abas.
  - Acesso direto ao painel completo.

---

## 🛠️ Como Instalar (Modo Desenvolvedor)

1. Faça o download da pasta do projeto ou extraia o arquivo `stopram.zip`.
2. Abra o Google Chrome e navegue até `chrome://extensions/`.
3. Ative a chave **"Modo do desenvolvedor"** no canto superior direito.
4. Clique em **"Carregar sem compactação"** no canto superior esquerdo.
5. Selecione a pasta contendo a extensão (pasta `stopram`).
6. Fixe o ícone do **StopRAM** na barra de ferramentas do Chrome para acesso rápido.

---

## 🧪 Como Testar o Limitador (Modo Simulação)

Por questões de segurança, os navegadores Chrome em canal Estável não disponibilizam a API `chrome.processes` para extensões normais. O **StopRAM** resolve isso ativando automaticamente o **Modo Simulação** no Chrome Estável. 

Para testar o funcionamento:
1. Abra o **Painel Completo** da extensão.
2. Acesse a aba **Configurações** e defina o **"Limite de Memória por Aba"** para um valor baixo (ex: `150 MB`).
3. Defina a ação para **"Suspender Aba"** ou **"Recarregar Aba"** e o intervalo de verificação para **5 segundos**.
4. Volte para a aba **Monitor de Abas** e observe os consumos flutuando.
5. Assim que uma das abas ultrapassar o limite de `150 MB`, ela será suspensa/recarregada no navegador e você receberá uma notificação do sistema!
6. Veja o log do evento registrado na aba **Histórico**.

---

## 💻 Tecnologias Utilizadas

- **Core**: HTML5, Vanilla JavaScript (Manifest V3 Service Workers).
- **Estilização**: Vanilla CSS com variáveis HSL, layout flexbox/grid e efeitos de vidro (glassmorphism).
- **APIs do Chrome**: `chrome.processes` (monitoramento real), `chrome.tabs` (descarte/recarga/fechamento), `chrome.storage` (persistência de dados), `chrome.alarms` (keepalive do worker) e `chrome.notifications` (alertas de sistema).
