(function () {
    // Evita injetar o script múltiplas vezes
    if (document.getElementById("nao-seguidores-dashboard")) {
        return;
    }

    let isScanning = false;
    let stopScanningRequested = false;
    let followingList = []; // Lista completa de todos os seguindo
    let nonFollowers = [];  // Filtrados: quem não segue de volta
    let unfollowHistory = {}; // Histórico de unfollows { username: timestamp }
    const unfollowTimestamps = []; // Registro de timestamps de cliques de unfollow para limite

    // Variáveis do Instagram extraídas da página
    let viewerId = null;
    let csrfToken = null;
    let igAppId = null;
    let rolloutHash = null;

    // Headers de requisição
    const queryHeaders = {};
    const mutationHeaders = {
        "Content-Type": "application/x-www-form-urlencoded",
        "X-Requested-With": "XMLHttpRequest",
        "X-Asbd-Id": "129477"
    };

    function extractInstagramData() {
        const html = document.body.innerHTML;
        
        // Viewer ID (ID do usuário logado)
        const viewerIdMatch = html.match(/\\?"viewerId\\?":\\?"(\w+)\\?"/i) || html.match(/\\?"appScopedIdentity\\?":\\?"(\w+)\\?"/i);
        viewerId = viewerIdMatch ? viewerIdMatch[1] : null;

        // CSRF Token
        const csrfMatch = html.match(/(?<="csrf_token":").+?(?=")/i);
        if (csrfMatch) {
            csrfToken = csrfMatch[0];
            queryHeaders["X-Csrftoken"] = csrfToken;
            mutationHeaders["X-Csrftoken"] = csrfToken;
        }

        // Instagram App ID
        const appIdMatch = html.match(/(?<="X-IG-App-ID":").+?(?=")/i);
        if (appIdMatch) {
            igAppId = appIdMatch[0];
            queryHeaders["X-Ig-App-Id"] = igAppId;
            mutationHeaders["X-Ig-App-Id"] = igAppId;
        }

        // Rollout Hash
        const rolloutMatch = html.match(/(?<="rollout_hash":").+?(?=")/i);
        if (rolloutMatch) {
            rolloutHash = rolloutMatch[0];
            mutationHeaders["X-Instagram-Ajax"] = rolloutHash;
        }

        // WWW Claim
        const claim = sessionStorage.getItem("www-claim-v2");
        if (claim) {
            mutationHeaders["X-Ig-Www-Claim"] = claim;
        }
    }

    // Delay helper para evitar bloqueio do Instagram
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function getRandomDelay() {
        // Delay aleatório entre 2.5 e 5 segundos
        return Math.floor(Math.random() * 2500) + 2500;
    }

    // Carregar histórico do armazenamento do Chrome
    async function loadHistory() {
        if (!viewerId) return;
        const key = `unfollowers_history_${viewerId}`;
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                unfollowHistory = result[key] || {};
                resolve(unfollowHistory);
            });
        });
    }

    // Salvar histórico no armazenamento do Chrome
    async function saveHistory() {
        if (!viewerId) return;
        const key = `unfollowers_history_${viewerId}`;
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: unfollowHistory }, () => {
                resolve();
            });
        });
    }

    // Exibe notificações bonitas estilo Toast
    function showToast(message, type = "info") {
        const container = document.getElementById("ns-toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = `ns-toast ns-toast-${type}`;
        
        let icon = "ℹ️";
        if (type === "success") icon = "✅";
        if (type === "warning") icon = "⚠️";
        if (type === "danger") icon = "🛑";

        toast.innerHTML = `
            <span class="ns-toast-icon">${icon}</span>
            <span class="ns-toast-message">${message}</span>
        `;

        container.appendChild(toast);
        
        // Remove toast depois de 4 segundos com animação
        setTimeout(() => {
            toast.style.animation = "slideOutRight 0.3s forwards";
            setTimeout(() => {
                toast.remove();
            }, 300);
        }, 4000);
    }

    // Limites de Unfollow
    function checkUnfollowLimits() {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;

        // Limpa registros antigos
        while (unfollowTimestamps.length > 0 && unfollowTimestamps[0] < oneHourAgo) {
            unfollowTimestamps.shift();
        }

        const lastMinuteCount = unfollowTimestamps.filter(t => t > oneMinuteAgo).length;
        const lastHourCount = unfollowTimestamps.length;

        if (lastMinuteCount >= 5) {
            showToast("Limite de segurança atingido: Máximo de 5 unfollows por minuto!", "warning");
            return false;
        }

        if (lastHourCount >= 60) {
            showToast("Limite de segurança atingido: Máximo de 60 unfollows por hora!", "danger");
            return false;
        }

        return true;
    }

    // Função para deixar de seguir um usuário
    async function performUnfollow(button, userId, username) {
        if (!checkUnfollowLimits()) {
            return;
        }

        button.disabled = true;
        button.innerHTML = `<span class="ns-spinner-sm"></span>`;

        try {
            const response = await fetch(`https://i.instagram.com/api/v1/web/friendships/${userId}/unfollow/`, {
                method: "POST",
                headers: mutationHeaders,
                credentials: "include",
                mode: "cors"
            });

            if (!response.ok) {
                throw new Error("Erro na requisição do Instagram.");
            }

            const data = await response.json();

            if (data.status === "ok") {
                button.className = "ns-btn-unfollowed";
                button.innerText = "Removido";
                unfollowTimestamps.push(Date.now());
                showToast(`Você deixou de seguir @${username}`, "success");

                // Remove do histórico local
                if (unfollowHistory[username]) {
                    delete unfollowHistory[username];
                    saveHistory();
                }

                // Atualizar dados na tela
                nonFollowers = nonFollowers.filter(u => u.node.username !== username);
                updateStats();
            } else {
                button.disabled = false;
                button.innerText = "Seguindo";
                showToast("Instagram bloqueou a ação. Tente mais tarde (ERRO-02).", "warning");
            }
        } catch (error) {
            button.disabled = false;
            button.innerText = "Seguindo";
            showToast("Erro de conexão ao tentar deixar de seguir.", "danger");
        }
    }

    // Faz a varredura da API GraphQL do Instagram
    async function scanInstagram() {
        if (isScanning) return;
        isScanning = true;
        stopScanningRequested = false;
        
        const scanBtn = document.getElementById("ns-scan-btn");
        const progressContainer = document.getElementById("ns-progress-container");
        const progressBar = document.getElementById("ns-progress-bar");
        const progressPercent = document.getElementById("ns-progress-percent");
        
        scanBtn.innerText = "Pausar Escaneamento";
        scanBtn.classList.remove("ns-btn-primary");
        scanBtn.classList.add("ns-btn-danger");
        progressContainer.style.display = "block";

        followingList = [];
        let hasNextPage = true;
        let endCursor = "";
        let pageIndex = 1;

        try {
            await loadHistory();

            while (hasNextPage && !stopScanningRequested) {
                // Atualiza barra de progresso aproximada
                let currentProgress = Math.min(95, Math.round((pageIndex / (pageIndex + 2)) * 100));
                progressBar.style.width = `${currentProgress}%`;
                progressPercent.innerText = `Carregando página ${pageIndex}...`;

                if (pageIndex > 1) {
                    await delay(getRandomDelay());
                }

                const url = `https://www.instagram.com/graphql/query/?query_hash=3dec7e2c57367ef3da3d987d89f9dbc8&variables=${encodeURIComponent(JSON.stringify({
                    id: viewerId,
                    include_reel: false,
                    fetch_mutual: false,
                    first: 50,
                    after: endCursor
                }))}`;

                const response = await fetch(url, { headers: queryHeaders });
                if (response.status !== 200) {
                    throw new Error(`Código HTTP ${response.status}`);
                }

                const json = await response.json();
                if (!json.data || !json.data.user || !json.data.user.edge_follow) {
                    throw new Error("Resposta inválida da API do Instagram.");
                }

                const edgeFollow = json.data.user.edge_follow;
                const edges = edgeFollow.edges;
                followingList.push(...edges);

                // Atualiza progresso real se tivermos o total de pessoas
                const totalFollowing = edgeFollow.count;
                const loadedCount = followingList.length;
                const percent = Math.min(100, Math.round((loadedCount / totalFollowing) * 100));
                progressBar.style.width = `${percent}%`;
                progressPercent.innerText = `Processando: ${loadedCount} de ${totalFollowing} (${percent}%)`;

                hasNextPage = edgeFollow.page_info.has_next_page;
                endCursor = edgeFollow.page_info.end_cursor;
                pageIndex++;
            }

            if (!stopScanningRequested) {
                // Escaneamento concluído
                progressBar.style.width = "100%";
                progressPercent.innerText = "Concluído!";
                showToast("Escaneamento de seguidores finalizado com sucesso!", "success");

                // Filtra quem não nos segue de volta
                nonFollowers = followingList.filter(edge => !edge.node.follows_viewer);

                // Processar histórico de datas
                const tempHistory = {};
                const nowStr = new Date().toISOString();

                nonFollowers.forEach(user => {
                    const uname = user.node.username;
                    if (unfollowHistory[uname]) {
                        tempHistory[uname] = unfollowHistory[uname]; // Mantém data antiga
                    } else {
                        tempHistory[uname] = nowStr; // Novo unfollow detectado
                    }
                });

                unfollowHistory = tempHistory;
                await saveHistory();

                // Renderizar a lista de usuários no painel
                renderUserList();
            } else {
                showToast("Escaneamento pausado pelo usuário.", "warning");
            }

        } catch (error) {
            console.error("Erro no escaneamento:", error);
            showToast(`Ocorreu um erro no escaneamento. Instagram pode ter bloqueado temporariamente.`, "danger");
            progressPercent.innerText = "Falha no carregamento.";
            progressBar.style.backgroundColor = "var(--ns-danger)";
        } finally {
            isScanning = false;
            scanBtn.innerText = "Iniciar Escaneamento";
            scanBtn.classList.remove("ns-btn-danger");
            scanBtn.classList.add("ns-btn-primary");
            updateStats();
        }
    }

    // Atualiza os cartões de estatísticas no topo
    function updateStats() {
        const totalFollowingEl = document.getElementById("ns-stat-following");
        const totalNonFollowersEl = document.getElementById("ns-stat-nonfollowers");
        const friendshipRateEl = document.getElementById("ns-stat-rate");
        const recentUnfollowsEl = document.getElementById("ns-stat-recent");

        const totalFollowing = followingList.length || 0;
        const totalNonFollowers = nonFollowers.length || 0;
        
        let rate = 100;
        if (totalFollowing > 0) {
            rate = Math.round(((totalFollowing - totalNonFollowers) / totalFollowing) * 100);
        }

        // Novos unfollows (aqueles detectados na última rodada - que possuem data e cuja data é recente)
        const recentCount = Object.keys(unfollowHistory).length;

        if (totalFollowingEl) totalFollowingEl.innerText = totalFollowing;
        if (totalNonFollowersEl) totalNonFollowersEl.innerText = totalNonFollowers;
        if (friendshipRateEl) friendshipRateEl.innerText = `${rate}%`;
        if (recentUnfollowsEl) recentUnfollowsEl.innerText = recentCount;
    }

    // Formata a data ISO para exibição amigável
    function formatDate(isoString) {
        if (!isoString) return "Sem histórico";
        try {
            const date = new Date(isoString);
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = date.getFullYear();
            const h = String(date.getHours()).padStart(2, '0');
            const min = String(date.getMinutes()).padStart(2, '0');
            return `${d}/${m}/${y} às ${h}:${min}`;
        } catch (e) {
            return "Recente";
        }
    }

    // Filtra e ordena os dados para exibição na lista
    function getProcessedUserList() {
        const searchInput = document.getElementById("ns-search-input");
        const sortSelect = document.getElementById("ns-sort-select");

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const sortBy = sortSelect ? sortSelect.value : "recent";

        // Filtro de Busca
        let filtered = nonFollowers.filter(user => {
            const uname = user.node.username.toLowerCase();
            const fname = (user.node.full_name || "").toLowerCase();
            return uname.includes(searchTerm) || fname.includes(searchTerm);
        });

        // Ordenação
        filtered.sort((a, b) => {
            const dateA = unfollowHistory[a.node.username] || "";
            const dateB = unfollowHistory[b.node.username] || "";

            if (sortBy === "recent") {
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1; // Coloca os sem data por último
                if (!dateB) return -1;
                return new Date(dateB) - new Date(dateA); // Decrescente (mais recentes primeiro)
            } else if (sortBy === "oldest") {
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateA) - new Date(dateB); // Crescente (mais antigos primeiro)
            } else if (sortBy === "az") {
                return a.node.username.localeCompare(b.node.username);
            } else if (sortBy === "za") {
                return b.node.username.localeCompare(a.node.username);
            }
            return 0;
        });

        return filtered;
    }

    // Renderiza a lista de usuários na tabela
    function renderUserList() {
        const container = document.getElementById("ns-list-rows");
        if (!container) return;

        const processedList = getProcessedUserList();
        container.innerHTML = "";

        if (processedList.length === 0) {
            container.innerHTML = `
                <div class="ns-empty-state">
                    <span class="ns-empty-icon">🔍</span>
                    <p class="ns-empty-text">Nenhum não-seguidor encontrado com os critérios de filtro.</p>
                </div>
            `;
            return;
        }

        processedList.forEach(user => {
            const node = user.node;
            const hasDate = unfollowHistory[node.username];
            const dateStr = hasDate ? formatDate(hasDate) : "Detectado no primeiro scan";

            const row = document.createElement("div");
            row.className = "ns-user-row";
            row.innerHTML = `
                <div class="ns-user-info">
                    <img class="ns-avatar" src="${node.profile_pic_url}" alt="${node.username}" loading="lazy" onerror="this.src='https://instagram.fria1-1.fna.fbcdn.net/v/t51.2885-19/44884218_345743122895269_148877717462007808_n.jpg?_nc_ht=instagram.fria1-1.fna.fbcdn.net&_nc_cat=1&_nc_ohc=yA5k0v2F7nQAX9K_b3r&edm=ABfd0MgBAAAA&ccb=7-5&oh=00_AfCjVqLwX2o_W6b4u2XF_T8K0q5a8M3x2Ew-R3x3X3X3X3&oe=65EFB1C0'">
                    <div class="ns-user-details">
                        <a class="ns-username" href="https://www.instagram.com/${node.username}/" target="_blank">@${node.username}</a>
                        <span class="ns-fullname">${node.full_name || ""}</span>
                        <span class="ns-unfollow-date ${hasDate ? 'ns-has-date' : ''}">
                            📅 ${dateStr}
                        </span>
                    </div>
                </div>
                <div class="ns-user-actions">
                    <button class="ns-btn-unfollow-action" data-id="${node.id}" data-username="${node.username}">Deixar de seguir</button>
                </div>
            `;

            // Adiciona evento de clique no botão
            const unfollowBtn = row.querySelector(".ns-btn-unfollow-action");
            unfollowBtn.addEventListener("click", function() {
                performUnfollow(unfollowBtn, node.id, node.username);
            });

            container.appendChild(row);
        });
    }

    // Cria e insere o layout do Dashboard
    function createDashboardHTML() {
        extractInstagramData();

        const root = document.createElement("div");
        root.id = "nao-seguidores-dashboard";
        root.className = "ns-dashboard-overlay";

        let bodyHTML = "";

        if (!viewerId) {
            // Caso não esteja logado
            bodyHTML = `
                <div class="ns-dialog ns-dialog-small">
                    <div class="ns-dialog-header">
                        <h2 class="ns-title-gradient">Não Seguidores - InstaUnfollow</h2>
                        <button id="ns-close-btn" class="ns-close-btn">&times;</button>
                    </div>
                    <div class="ns-dialog-body ns-center-text">
                        <div class="ns-error-icon">🔒</div>
                        <h3>Login no Instagram Não Detectado</h3>
                        <p>Para utilizar a extensão, você precisa estar conectado à sua conta do Instagram na aba atual.</p>
                        <a href="https://www.instagram.com" class="ns-btn ns-btn-primary" style="display:inline-block; margin-top:16px; text-decoration:none;">Ir para o Login</a>
                    </div>
                </div>
            `;
        } else {
            // Dashboard Completo
            bodyHTML = `
                <div class="ns-dialog">
                    <div class="ns-dialog-header">
                        <div class="ns-header-title-block">
                            <h2 class="ns-title-gradient">Não Seguidores - InstaUnfollow</h2>
                            <span class="ns-author-badge">por @duhvilela</span>
                        </div>
                        <button id="ns-close-btn" class="ns-close-btn">&times;</button>
                    </div>
                    
                    <div class="ns-dialog-body">
                        <!-- Painel de Controle e Progresso -->
                        <div class="ns-control-panel">
                            <button id="ns-scan-btn" class="ns-btn ns-btn-primary">Iniciar Escaneamento</button>
                            
                            <div id="ns-progress-container" class="ns-progress-container" style="display:none;">
                                <div class="ns-progress-track">
                                    <div id="ns-progress-bar" class="ns-progress-bar" style="width:0%;"></div>
                                </div>
                                <div id="ns-progress-percent" class="ns-progress-percent">Iniciando...</div>
                            </div>
                        </div>

                        <!-- Grid de Estatísticas -->
                        <div class="ns-stats-grid">
                            <div class="ns-stat-card">
                                <span class="ns-stat-label">Seguindo</span>
                                <span id="ns-stat-following" class="ns-stat-value">0</span>
                            </div>
                            <div class="ns-stat-card">
                                <span class="ns-stat-label">Não seguem de volta</span>
                                <span id="ns-stat-nonfollowers" class="ns-stat-value">0</span>
                            </div>
                            <div class="ns-stat-card">
                                <span class="ns-stat-label">Taxa de Retorno</span>
                                <span id="ns-stat-rate" class="ns-stat-value">100%</span>
                            </div>
                            <div class="ns-stat-card">
                                <span class="ns-stat-label">Rastreados no Histórico</span>
                                <span id="ns-stat-recent" class="ns-stat-value">0</span>
                            </div>
                        </div>

                        <!-- Painel de Filtros -->
                        <div class="ns-filter-row">
                            <input type="text" id="ns-search-input" class="ns-input-search" placeholder="🔍 Buscar usuário por username ou nome...">
                            <select id="ns-sort-select" class="ns-select-sort">
                                <option value="recent">Mais Recentes primeiro</option>
                                <option value="oldest">Mais Antigos primeiro</option>
                                <option value="az">Nome (A-Z)</option>
                                <option value="za">Nome (Z-A)</option>
                            </select>
                        </div>

                        <!-- Lista de Usuários -->
                        <div class="ns-list-container">
                            <div id="ns-list-rows" class="ns-list-rows">
                                <div class="ns-empty-state">
                                    <span class="ns-empty-icon">📊</span>
                                    <p class="ns-empty-text">Clique em "Iniciar Escaneamento" para obter a lista atualizada de quem não te segue de volta.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }

        root.innerHTML = bodyHTML;
        document.body.appendChild(root);

        // Container de Toasts/Notificações
        const toastContainer = document.createElement("div");
        toastContainer.id = "ns-toast-container";
        toastContainer.className = "ns-toast-container";
        document.body.appendChild(toastContainer);

        // Event Listeners
        document.getElementById("ns-close-btn").addEventListener("click", () => {
            stopScanningRequested = true;
            root.remove();
            toastContainer.remove();
            document.body.style.overflowY = "visible";
        });

        if (viewerId) {
            const scanBtn = document.getElementById("ns-scan-btn");
            scanBtn.addEventListener("click", () => {
                if (isScanning) {
                    stopScanningRequested = true;
                } else {
                    scanInstagram();
                }
            });

            // Input de Busca
            document.getElementById("ns-search-input").addEventListener("input", renderUserList);
            // Select de Ordenação
            document.getElementById("ns-sort-select").addEventListener("change", renderUserList);

            // Carrega histórico offline para exibir contador no início
            loadHistory().then(() => {
                updateStats();
            });
        }

        document.body.style.overflowY = "hidden";
    }

    createDashboardHTML();
})();
