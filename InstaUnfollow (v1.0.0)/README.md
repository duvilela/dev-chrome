# 📊 Não Seguidores - InstaUnfollow (v1.0.0)

Uma extensão moderna e segura para Google Chrome desenvolvida para analisar e gerenciar quem não te segue de volta no Instagram. Projetada com foco em experiência do usuário (UX), privacidade local e segurança de conta.

Desenhado e desenvolvido por **[@duhvilela](https://github.com/duhvilela)**.

---

## ✨ Recursos Principais

* **🎨 Design Premium Dark**: Interface moderna baseada em *Glassmorphism* (efeito de vidro fosco) e gradientes inspirados na identidade visual do Instagram.
* **📈 Dashboard Completo**: Cartões com estatísticas dinâmicas atualizadas em tempo real:
  * Total de contas que você está seguindo.
  * Contas que não te seguem de volta.
  * Taxa de amizade/reciprocidade (%).
  * Histórico local de novos unfollows rastreados.
* **📅 Rastreamento de Datas (Histórico Local)**: Usando a API `chrome.storage.local`, a extensão registra e exibe a data e hora exatas de quando a pessoa deixou de te seguir (calculada a partir da segunda varredura).
* **🔍 Busca & Filtros Rápidos**: Pesquise usuários instantaneamente por @username ou nome completo, e ordene a lista por *Mais Recentes*, *Mais Antigos* ou em *Ordem Alfabética (A-Z / Z-A)*.
* **🛑 Limites de Segurança Integrados**: Para proteger sua conta do Instagram contra suspensões temporárias por automação de cliques, a extensão implementa uma janela deslizante em memória que bloqueia cliques extras e avisa o usuário através de alertas visuais (toasts) caso atinja limites críticos:
  * Máximo de **5 unfollows por minuto**.
  * Máximo de **60 unfollows por hora**.
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
   * Selecione a pasta onde estão os arquivos extraídos (a pasta que contém o arquivo `manifest.json`).

5. **Fixe a extensão na barra de ferramentas (Opcional)**:
   * Clique no ícone de quebra-cabeça (Extensões) na barra do Chrome e clique no ícone de alfinete ao lado de **Não Seguidores - InstaUnfollow** para acesso rápido.

---

## 🚀 Como Utilizar

1. Acesse o site do [Instagram](https://www.instagram.com) e certifique-se de que está conectado à sua conta.
2. Clique no ícone da extensão **Não Seguidores - InstaUnfollow** na barra do navegador.
3. O painel da extensão será injetado e aberto sobreposto à página do Instagram.
4. Clique em **Iniciar Escaneamento** para buscar a lista de pessoas que você segue.
5. Quando o progresso chegar a 100%, a lista de usuários que não te seguem de volta será renderizada no painel.
6. Use o campo de busca e filtros para ordenar os usuários e clique em **Deixar de seguir** caso deseje remover a conta de seus seguidos de forma segura.

---

## 📝 Notas de Segurança Importantes

* **Autenticação**: A extensão funciona utilizando a sessão ativa do seu navegador. Ela **nunca** pede ou tem acesso à sua senha do Instagram.
* **Segurança contra Bloqueios**: Instagram monitora ações repetitivas de unfollow. Respeite os limites implementados no botão de ação da extensão e evite deixar de seguir muitas contas seguidamente através de abas diferentes ou celulares enquanto usa a extensão.

---

## ⚖️ Licença

Este projeto está sob a licença [MIT](LICENSE). Sinta-se livre para usar, modificar e distribuir.
