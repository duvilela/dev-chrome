# 📊 Não Seguidores - InstaUnfollow (v1.1.0)

Uma extensão moderna e segura para Google Chrome desenvolvida para analisar e gerenciar quem não te segue de volta no Instagram. Projetada com foco em experiência do usuário (UX), privacidade local e segurança de conta.

Desenhado e desenvolvido por **[@duhvilela](https://github.com/duhvilela)**.

---

## 🆕 Novidades da v1.1.0

A v1.0.0 parou de funcionar porque o Instagram desativou o endpoint GraphQL antigo (`query_hash`) usado para carregar as listas. A v1.1.0 foi reescrita na camada de API:

* **🔁 Novas APIs do Instagram**: o escaneamento agora usa os endpoints oficiais usados pelo próprio site:
  * `GET /api/v1/friendships/{id}/following/` (contas que você segue)
  * `GET /api/v1/friendships/{id}/followers/` (seus seguidores)
* **🧠 Detecção inteligente de reciprocidade**: quando os dados vêm do GraphQL (campo `follows_viewer`), a extensão identifica na hora quem te segue de volta e **não precisa baixar sua lista de seguidores** (escaneamento muito mais rápido). Na API REST ela compara as duas listas (seguindo × seguidores) para garantir corretidão — e, se a lista de seguidores não puder ser baixada, usa a reciprocidade direta como plano B, avisando você.
* **🔄 Plano B automático (GraphQL legado)**: se a API REST for bloqueada, a extensão tenta os endpoints GraphQL antigos com vários `query_hash` conhecidos.
* **🎯 Identificação da sessão via cookies**: `ds_user_id` e `csrftoken` são lidos dos cookies do próprio Instagram (muito mais confiável do que raspar o HTML da página).
* **🆕 Tratamento de `www-claim`**: em caso de HTTP 401, a extensão lê o header `x-ig-set-x-www-claim` e repete a requisição automaticamente.
* **🛑 Unfollow com endpoints de contingência**: tenta, nesta ordem, `friendships/destroy/`, `web/friendships/{id}/unfollow/` e o endpoint do `i.instagram.com`.
* **⚠️ Erros traduzidos**: 401 (sessão expirada), 403, 429 (rate limit) e `challenge_required` agora mostram mensagens claras em português, em vez de falhar silenciosamente.
* **▶️ Escaneamento retomável**: se você pausar o escaneamento, o botão vira **"Continuar Escaneamento"** e a coleta é retomada de onde parou (não recomeça do zero).
* **🔁 Novo comportamento do ícone**: se você já estiver no Instagram, a extensão injeta o painel na aba atual (sem abrir outra aba); se houver uma aba do Instagram já aberta, ela é focada.
* **🖼️ Avatar com fallback local**: a imagem de perfil quebrada agora usa um placeholder embutido (a URL antiga expirava).
* **⌨️ Tecla `Esc`** fecha o painel.

---

## ✨ Recursos Principais

* **🎨 Design Premium Dark**: Interface moderna baseada em *Glassmorphism* (efeito de vidro fosco) e gradientes inspirados na identidade visual do Instagram.
* **📈 Dashboard Completo**: Cartões com estatísticas dinâmicas atualizadas em tempo real:
  * Total de contas que você está seguindo.
  * Contas que não te seguem de volta.
  * Taxa de amizade/reciprocidade (%).
  * Histórico local de novos unfollows rastreados.
* **📅 Rastreamento de Datas (Histórico Local)**: Usando a API `chrome.storage.local`, a extensão registra e exibe a data e hora exatas de quando a pessoa deixou de te seguir (calculada a partir da segunda varredura). O histórico da v1.0.0 é mantido.
* **🔍 Busca & Filtros Rápidos**: Pesquise usuários instantaneamente por @username ou nome completo, e ordene a lista por *Mais Recentes*, *Mais Antigos* ou em *Ordem Alfabética (A-Z / Z-A)*.
* **🛑 Limites de Segurança Integrados**: Para proteger sua conta do Instagram contra suspensões temporárias por automação de cliques, a extensão implementa uma janela deslizante em memória que bloqueia cliques extras e avisa o usuário através de alertas visuais (toasts):
  * Máximo de **5 unfollows por minuto**.
  * Máximo de **60 unfollows por hora**.
* **⏱️ Delays aleatórios** entre as páginas do escaneamento (0,9s – 1,8s) para reduzir o risco de bloqueio.
* **🔒 100% Livre de Anúncios e Bloqueios**: Sem propagandas e sem envio de dados a servidores de terceiros. Todo o histórico de datas é armazenado puramente no seu próprio navegador.

---

## 🛠️ Como Instalar (Modo Desenvolvedor)

Como esta extensão ainda não foi publicada na Chrome Web Store, ela pode ser instalada diretamente através do Modo de Desenvolvedor do Chrome. Siga os passos abaixo:

1. **Baixe os arquivos da extensão**:
   * Faça o download ou clone este repositório para o seu computador.
   * Certifique-se de extrair o arquivo `.zip` (se baixado desse modo) em uma pasta permanente.

2. **Abra a tela de extensões do Chrome**:
   * No seu navegador Google Chrome, digite `chrome://extensions/` na barra de endereços e pressione Enter.
   * Alternativamente, clique no ícone de menu (três pontos) no canto superior direito -> **Mais ferramentas** -> **Extensões**.

3. **Ative o Modo do Desenvolvedor**:
   * No canto superior direito da tela de extensões, ative a chave seletora **Modo do desenvolvedor**.

4. **Carregue a extensão**:
   * Clique no botão **Carregar sem compactação** (ou *Load unpacked*) no canto superior esquerdo.
   * Selecione a pasta `InstaUnfollow (v1.1.0)` (a pasta que contém o arquivo `manifest.json`).
   * Se a v1.0.0 estiver carregada, remova-a primeiro para evitar duplicidade.

5. **Fixe a extensão na barra de ferramentas (Opcional)**:
   * Clique no ícone de quebra-cabeça (Extensões) na barra do Chrome e clique no ícone de alfinete ao lado de **Não Seguidores - InstaUnfollow** para acesso rápido.

---

## 🚀 Como Utilizar

1. Acesse o site do [Instagram](https://www.instagram.com) e certifique-se de que está conectado à sua conta.
2. Clique no ícone da extensão **Não Seguidores - InstaUnfollow** na barra do navegador.
   * Se você já estiver no Instagram, o painel é injetado na própria aba.
   * Caso contrário, uma aba do Instagram é aberta/focada e o painel é injetado quando a página terminar de carregar.
3. Clique em **Iniciar Escaneamento** para buscar a lista de pessoas que você segue.
4. Quando o progresso chegar a 100%, a lista de usuários que não te seguem de volta será renderizada no painel.
5. Use o campo de busca e filtros para ordenar os usuários e clique em **Deixar de seguir** caso deseje remover a conta de seus seguidos de forma segura.

---

## 🛠️ Solução de Problemas

| Sintoma | Causa provável | O que fazer |
| --- | --- | --- |
| "Sessão expirada ou inválida (401)" | Cookies de login vencidos | Recarregue a página e faça login novamente no Instagram |
| "O Instagram pediu uma verificação de segurança" | `challenge_required` | Abra o Instagram normalmente, complete a verificação e aguarde alguns minutos |
| "O Instagram limitou as requisições (429)" | Rate limit | Aguarde de 5 a 15 minutos antes de escanear de novo |
| "Acesso negado pelo Instagram (403)" | Bloqueio temporário de automação | Atualize a página (F5) e tente mais tarde |
| Lista carregada incompleta | Escaneamento pausado/interrompido | Clique em **Continuar Escaneamento** |
| Painel não abre | Extensão desatualizada/recarregada | Vá em `chrome://extensions/` e clique no botão de atualizar (↻) da extensão |

---

## 📝 Notas de Segurança Importantes

* **Autenticação**: A extensão funciona utilizando a sessão ativa do seu navegador. Ela **nunca** pede ou tem acesso à sua senha do Instagram.
* **Escopo de permissões**: a extensão só acessa `*.instagram.com` e usa apenas `scripting` + `storage` locais.
* **Segurança contra Bloqueios**: Instagram monitora ações repetitivas de unfollow. Respeite os limites implementados no botão de ação da extensão e evite deixar de seguir muitas contas seguidamente através de abas diferentes ou celulares enquanto usa a extensão.

---

## ⚖️ Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se livre para usar, modificar e distribuir.
