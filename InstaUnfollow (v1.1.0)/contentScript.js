(function () {
    if (document.getElementById("nao-seguidores-dashboard")) {
        return;
    }

    // ---------------------------------------------------------------------
    // Configuração
    // ---------------------------------------------------------------------
    const IG_ORIGIN = "https://www.instagram.com";
    const DEFAULT_APP_ID = "936619743392459";
    const PAGE_SIZE = 100;
    const PAGE_DELAY_MIN = 900;
    const PAGE_DELAY_MAX = 1800;
    const MAX_UNFOLLOW_PER_MINUTE = 5;
    const MAX_UNFOLLOW_PER_HOUR = 60;

    // Endpoints GraphQL legados (plano B caso a API REST seja bloqueada)
    const GQL_HASHES = {
        following: [
            "3dec7e2c57367ef3da3d987d89f9dbc8",
            "d04edd2229b57d9a3754f00d82f6f342"
        ],
        followers: [
            "5aefa9893005572d237da5068082d8d5",
            "37479f2b8209594dde7facb0d904896a"
        ]
    };

    const AVATAR_FALLBACK = "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
        '<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">' +
        '<rect width="96" height="96" rx="48" fill="#33333b"/>' +
        '<circle cx="48" cy="37" r="16" fill="#7a7a86"/>' +
        '<path d="M18 86c5-17 15-26 30-26s25 9 30 26" fill="#7a7a86"/></svg>'
    );

    // ---------------------------------------------------------------------
    // Estado
    // ---------------------------------------------------------------------
    let isScanning = false;
    let stopScanningRequested = false;
    let followingList = [];
    let nonFollowers = [];
    let unfollowHistory = {};
    const unfollowTimestamps = [];
    let scanState = null;
    let lastScanInfo = "Nenhum escaneamento realizado nesta sessão.";

    // Dados de sessão do Instagram
    let viewerId = null;
    let csrfToken = null;
    let igAppId = DEFAULT_APP_ID;
    let wwwClaim = "0";
    let rolloutHash = "";

    class ApiError extends Error {
        constructor(type, message) {
            super(message);
            this.name = "ApiError";
            this.type = type;
        }
    }

    function pausedError() {
        const error = new Error("Escaneamento pausado pelo usuário.");
        error.paused = true;
        return error;
    }

    // ---------------------------------------------------------------------
    // Helpers básicos
    // ---------------------------------------------------------------------
    function delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    function getRandomDelay(min = PAGE_DELAY_MIN, max = PAGE_DELAY_MAX) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function getCookie(name) {
        const match = document.cookie.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]*)"));
        return match ? match[1] : null;
    }

    function safeSessionGet(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    function safeSessionSet(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch (e) {
            // ignorado
        }
    }

    // ---------------------------------------------------------------------
    // Extração dos dados da sessão (cookies + HTML da página)
    // ---------------------------------------------------------------------
    function extractInstagramData() {
        viewerId = getCookie("ds_user_id");
        csrfToken = getCookie("csrftoken");

        const html = document.body ? document.body.innerHTML : "";

        if (!viewerId) {
            const match = html.match(/\\?"viewerId\\?"\s*:\s*\\?"(\w+)\\?"/i) ||
                html.match(/\\?"appScopedIdentity\\?"\s*:\s*\\?"(\w+)\\?"/i);
            if (match) viewerId = match[1];
        }

        if (!csrfToken) {
            const match = html.match(/\\?"csrf_token\\?"\s*:\s*\\?"([^"\\]+)\\?"/i);
            if (match) csrfToken = match[1];
        }

        const appIdMatch = html.match(/\\?"X-IG-App-ID\\?"\s*:\s*\\?"(\d+)\\?"/i) ||
            html.match(/X-IG-App-ID["\s:]+(\d{10,})/i);
        if (appIdMatch) {
            igAppId = appIdMatch[1];
        }

        const rolloutMatch = html.match(/\\?"rollout_hash\\?"\s*:\s*\\?"([^"\\]+)\\?"/i);
        if (rolloutMatch) {
            rolloutHash = rolloutMatch[1];
        }

        wwwClaim = safeSessionGet("www-claim-v2") || "0";
    }

    function buildHeaders(mutating) {
        const headers = {
            "X-CSRFToken": csrfToken || "",
            "X-IG-App-ID": igAppId || DEFAULT_APP_ID,
            "X-IG-WWW-Claim": wwwClaim || "0",
            "X-Requested-With": "XMLHttpRequest",
            "X-ASBD-ID": "129477"
        };
        if (rolloutHash) {
            headers["X-Instagram-AJAX"] = rolloutHash;
        }
        if (mutating) {
            headers["Content-Type"] = "application/x-www-form-urlencoded";
        }
        return headers;
    }

    // ---------------------------------------------------------------------
    // Camada de requisições (com retry de claim 401 e erros traduzidos)
    // ---------------------------------------------------------------------
    async function apiFetch(url, options = {}) {
        let response = await fetch(url, Object.assign({ credentials: "include", mode: "cors" }, options));

        if (response.status === 401) {
            const claim = response.headers.get("x-ig-set-x-www-claim");
            if (claim && claim !== wwwClaim) {
                wwwClaim = claim;
                safeSessionSet("www-claim-v2", claim);
                response = await fetch(url, Object.assign({
                    credentials: "include",
                    mode: "cors"
                }, options, {
                    headers: Object.assign({}, options.headers || {}, { "X-IG-WWW-Claim": claim })
                }));
            }
        }

        if (response.status === 429) {
            throw new ApiError("rate_limit", "O Instagram limitou as requisições (429). Aguarde alguns minutos e tente novamente.");
        }
        if (response.status === 401) {
            throw new ApiError("session", "Sessão expirada ou inválida (401). Faça login novamente no Instagram e recarregue a página.");
        }
        if (response.status === 403) {
            throw new ApiError("blocked", "Acesso negado pelo Instagram (403). Atualize a página e tente novamente em instantes.");
        }

        const raw = await response.text();
        let json = null;
        try {
            json = JSON.parse(raw);
        } catch (e) {
            json = null;
        }

        const apiMessage = json && (json.message || json.error_type);

        if (apiMessage === "challenge_required" || apiMessage === "checkpoint_required") {
            throw new ApiError("challenge", "O Instagram pediu uma verificação de segurança. Complete o desafio no site e tente novamente.");
        }

        if (!response.ok || !json) {
            if (!json) {
                throw new ApiError("invalid", "Resposta inválida do Instagram (HTTP " + response.status + "). Atualize a página e tente novamente.");
            }
            throw new ApiError("http", "Erro do Instagram (HTTP " + response.status + "): " + (apiMessage || "desconhecido"));
        }

        return json;
    }

    async function withRetry(task) {
        let lastError = null;
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                return await task();
            } catch (error) {
                lastError = error;
                const fatal = error instanceof ApiError &&
                    ["session", "challenge", "rate_limit", "blocked"].indexOf(error.type) !== -1;
                if (fatal || attempt === 1) throw error;
                await delay(3000);
            }
        }
        throw lastError;
    }

    // ---------------------------------------------------------------------
    // Normalização de usuários
    // ---------------------------------------------------------------------
    function normalizeUser(source) {
        const id = source.pk != null ? source.pk : (source.id != null ? source.id : null);
        let followsBack = null;
        if (typeof source.follows_viewer === "boolean") {
            followsBack = source.follows_viewer;
        } else if (source.friendship_status && typeof source.friendship_status.followed_by === "boolean") {
            followsBack = source.friendship_status.followed_by;
        }

        return {
            id: id != null ? String(id) : "",
            username: source.username || "",
            full_name: source.full_name || "",
            profile_pic_url: source.profile_pic_url || "",
            followsBack: followsBack
        };
    }

    // ---------------------------------------------------------------------
    // Páginas: API REST (plano A) e GraphQL legado (plano B)
    // ---------------------------------------------------------------------
    async function fetchRestPage(kind, cursor) {
        const params = new URLSearchParams({
            count: String(PAGE_SIZE),
            search_surface: "follow_list_page"
        });
        if (cursor) {
            params.set("max_id", cursor);
        }

        const url = IG_ORIGIN + "/api/v1/friendships/" + viewerId + "/" + kind + "/?" + params.toString();
        const json = await apiFetch(url, { headers: buildHeaders(false) });

        if (!json.users) {
            throw new ApiError("invalid", "A API do Instagram não retornou a lista de " + (kind === "following" ? "seguindo" : "seguidores") + ".");
        }

        return {
            users: json.users.map(normalizeUser),
            next: json.next_max_id ? String(json.next_max_id) : null
        };
    }

    async function fetchGqlPage(kind, cursor) {
        const edgeName = kind === "following" ? "edge_follow" : "edge_followed_by";
        const hashes = GQL_HASHES[kind];
        let lastError = null;

        for (let i = 0; i < hashes.length; i++) {
            const variables = {
                id: viewerId,
                include_reel: false,
                fetch_mutual: false,
                first: 50
            };
            if (cursor) {
                variables.after = cursor;
            }

            const url = IG_ORIGIN + "/graphql/query/?query_hash=" + hashes[i] +
                "&variables=" + encodeURIComponent(JSON.stringify(variables));

            try {
                const json = await apiFetch(url, { headers: buildHeaders(false) });
                const edge = json && json.data && json.data.user && json.data.user[edgeName];

                if (!edge || !Array.isArray(edge.edges)) {
                    const detail = json && json.message ? " (" + json.message + ")" : "";
                    lastError = new ApiError("invalid", "A API legada do Instagram não retornou dados válidos" + detail + ".");
                    continue;
                }

                return {
                    users: edge.edges.map((edgeItem) => normalizeUser(edgeItem.node || {})),
                    next: edge.page_info && edge.page_info.has_next_page ? edge.page_info.end_cursor : null
                };
            } catch (error) {
                lastError = error;
                if (error instanceof ApiError &&
                    ["session", "challenge", "rate_limit", "blocked"].indexOf(error.type) !== -1) {
                    throw error;
                }
            }
        }

        throw lastError || new ApiError("invalid", "Não foi possível consultar a API do Instagram.");
    }

    async function fetchPage(kind, state) {
        if (state.transport === "gql") {
            return await fetchGqlPage(kind, state.cursor);
        }

        try {
            const page = await fetchRestPage(kind, state.cursor);
            state.transport = "rest";
            return page;
        } catch (error) {
            const fatal = error instanceof ApiError &&
                ["session", "challenge", "rate_limit", "blocked"].indexOf(error.type) !== -1;
            if (fatal || state.pages > 0) {
                throw error;
            }
            state.transport = "gql";
            return await fetchGqlPage(kind, state.cursor);
        }
    }

    // ---------------------------------------------------------------------
    // Histórico local (chrome.storage)
    // ---------------------------------------------------------------------
    async function loadHistory() {
        if (!viewerId) return;
        const key = "unfollowers_history_" + viewerId;
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                unfollowHistory = (result && result[key]) || {};
                resolve(unfollowHistory);
            });
        });
    }

    async function saveHistory() {
        if (!viewerId) return;
        const key = "unfollowers_history_" + viewerId;
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: unfollowHistory }, () => resolve());
        });
    }

    // ---------------------------------------------------------------------
    // Notificações (Toast)
    // ---------------------------------------------------------------------
    function showToast(message, type = "info") {
        const container = document.getElementById("ns-toast-container");
        if (!container) return;

        const toast = document.createElement("div");
        toast.className = "ns-toast ns-toast-" + type;

        let icon = "ℹ️";
        if (type === "success") icon = "✅";
        if (type === "warning") icon = "⚠️";
        if (type === "danger") icon = "🛑";

        const iconSpan = document.createElement("span");
        iconSpan.className = "ns-toast-icon";
        iconSpan.textContent = icon;

        const messageSpan = document.createElement("span");
        messageSpan.className = "ns-toast-message";
        messageSpan.textContent = message;

        toast.appendChild(iconSpan);
        toast.appendChild(messageSpan);
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = "slideOutRight 0.3s forwards";
            setTimeout(() => toast.remove(), 300);
        }, 5000);
    }

    function setStatus(text) {
        lastScanInfo = text;
        const el = document.getElementById("ns-status-line");
        if (el) el.textContent = text;
    }

    // ---------------------------------------------------------------------
    // Limites de segurança de unfollow
    // ---------------------------------------------------------------------
    function checkUnfollowLimits() {
        const now = Date.now();
        const oneMinuteAgo = now - 60 * 1000;
        const oneHourAgo = now - 60 * 60 * 1000;

        while (unfollowTimestamps.length > 0 && unfollowTimestamps[0] < oneHourAgo) {
            unfollowTimestamps.shift();
        }

        const lastMinuteCount = unfollowTimestamps.filter((t) => t > oneMinuteAgo).length;
        const lastHourCount = unfollowTimestamps.length;

        if (lastMinuteCount >= MAX_UNFOLLOW_PER_MINUTE) {
            showToast("Limite de segurança atingido: máximo de " + MAX_UNFOLLOW_PER_MINUTE + " unfollows por minuto!", "warning");
            return false;
        }

        if (lastHourCount >= MAX_UNFOLLOW_PER_HOUR) {
            showToast("Limite de segurança atingido: máximo de " + MAX_UNFOLLOW_PER_HOUR + " unfollows por hora!", "danger");
            return false;
        }

        return true;
    }

    // ---------------------------------------------------------------------
    // Unfollow (com endpoint de contingência)
    // ---------------------------------------------------------------------
    async function performUnfollow(button, userId, username) {
        if (!checkUnfollowLimits()) return;

        button.disabled = true;
        button.innerHTML = '<span class="ns-spinner-sm"></span>';

        const endpoints = [
            IG_ORIGIN + "/api/v1/friendships/destroy/" + userId + "/",
            IG_ORIGIN + "/api/v1/web/friendships/" + userId + "/unfollow/",
            "https://i.instagram.com/api/v1/friendships/destroy/" + userId + "/"
        ];

        let lastError = null;

        for (let i = 0; i < endpoints.length; i++) {
            try {
                const json = await apiFetch(endpoints[i], {
                    method: "POST",
                    headers: buildHeaders(true),
                    body: "user_id=" + encodeURIComponent(userId) + "&container_module=profile"
                });

                const success = json.status === "ok" ||
                    (json.friendship_status && json.friendship_status.following === false);

                if (success) {
                    button.className = "ns-btn-unfollowed";
                    button.innerText = "Removido";
                    unfollowTimestamps.push(Date.now());
                    showToast("Você deixou de seguir @" + username, "success");

                    if (unfollowHistory[username]) {
                        delete unfollowHistory[username];
                        saveHistory();
                    }

                    followingList = followingList.filter((u) => u.id !== String(userId));
                    nonFollowers = nonFollowers.filter((u) => u.id !== String(userId));
                    updateStats();
                    return;
                }

                lastError = new ApiError("fail", json.message || "O Instagram recusou a ação.");
                if (json.message === "feedback_required" || json.message === "feedback_send_failed") {
                    lastError = new ApiError("blocked", "O Instagram bloqueou ações nesta conta por um tempo. Aguarde algumas horas e tente novamente.");
                    break;
                }
            } catch (error) {
                lastError = error;
                if (error instanceof ApiError &&
                    ["session", "challenge", "blocked", "rate_limit"].indexOf(error.type) !== -1) {
                    break;
                }
            }

            if (i < endpoints.length - 1) {
                await delay(700);
            }
        }

        button.disabled = false;
        button.innerText = "Deixar de seguir";
        showToast(lastError ? lastError.message : "Não foi possível concluir o unfollow.", "danger");
    }

    // ---------------------------------------------------------------------
    // Escaneamento
    // ---------------------------------------------------------------------
    function newScanState() {
        return {
            following: { users: [], cursor: null, transport: null, pages: 0, done: false },
            followers: { users: [], cursor: null, transport: null, pages: 0, done: false },
            method: null
        };
    }

    function setProgress(percent, text, indeterminate) {
        const bar = document.getElementById("ns-progress-bar");
        const label = document.getElementById("ns-progress-percent");
        if (bar) {
            if (indeterminate) {
                bar.classList.add("ns-indeterminate");
            } else {
                bar.classList.remove("ns-indeterminate");
                bar.style.width = Math.max(0, Math.min(100, percent)) + "%";
            }
        }
        if (label && text) label.textContent = text;
    }

    async function runPhase(kind) {
        const state = scanState[kind];
        const label = kind === "following" ? "Seguindo" : "Seguidores";

        while (!state.done) {
            if (stopScanningRequested) throw pausedError();

            const page = await withRetry(() => fetchPage(kind, state));

            state.users.push(...page.users);
            state.pages++;
            state.cursor = page.next;

            setProgress(0, label + ": " + state.users.length + " carregados (página " + state.pages + ")...", true);
            updateStats();

            if (!state.cursor) {
                state.done = true;
                break;
            }

            await delay(getRandomDelay());
        }

        return state.users;
    }

    async function scanInstagram() {
        if (isScanning) return;
        isScanning = true;
        stopScanningRequested = false;

        if (!scanState) {
            scanState = newScanState();
        }
        followingList = scanState.following.users;

        const scanBtn = document.getElementById("ns-scan-btn");
        const progressContainer = document.getElementById("ns-progress-container");

        scanBtn.innerText = "Pausar Escaneamento";
        scanBtn.classList.remove("ns-btn-primary");
        scanBtn.classList.add("ns-btn-danger");
        progressContainer.style.display = "block";

        try {
            await loadHistory();

            // Fase 1: lista de contas que você segue
            if (!scanState.following.done) {
                setProgress(0, "Carregando a lista de contas que você segue...", true);
                await runPhase("following");
            }
            followingList = scanState.following.users;

            if (stopScanningRequested) throw pausedError();

            if (followingList.length === 0) {
                throw new ApiError("empty", "Nenhuma conta encontrada na lista de seguindo. Verifique se você está logado.");
            }

            // Decide o método de comparação
            const allUsersHaveInfo = followingList.length > 0 &&
                followingList.every((u) => typeof u.followsBack === "boolean");

            if (!scanState.method) {
                // Só confia na verificação direta quando os dados vêm do GraphQL
                // (campo follows_viewer), que é o comportamento histórico da extensão.
                scanState.method = (scanState.following.transport === "gql" && allUsersHaveInfo)
                    ? "direct"
                    : "diff";
            }

            if (scanState.method === "direct") {
                setProgress(0, "Analisando quem não te segue de volta...", true);
                nonFollowers = followingList.filter((u) => u.followsBack !== true);
            } else {
                if (!scanState.followers.done) {
                    try {
                        setProgress(0, "Carregando sua lista de seguidores...", true);
                        await runPhase("followers");
                    } catch (phaseError) {
                        if (phaseError && phaseError.paused) throw phaseError;
                        if (!allUsersHaveInfo) throw phaseError;
                        // A API de seguidores falhou, mas temos a reciprocidade direta
                        scanState.method = "direct";
                        showToast("Não foi possível baixar sua lista de seguidores; usando a verificação direta de reciprocidade.", "warning");
                    }
                }

                if (scanState.method !== "direct") {
                    const followerIds = new Set(scanState.followers.users.map((u) => u.id));
                    nonFollowers = followingList.filter((u) => !followerIds.has(u.id));
                }
            }

            if (stopScanningRequested) throw pausedError();

            // Concluído
            setProgress(100, "Concluído!", false);
            showToast("Escaneamento finalizado: " + nonFollowers.length + " não seguem você de volta.", "success");

            const methodLabel = scanState.method === "direct"
                ? "verificação direta de reciprocidade"
                : "comparação entre listas";

            setStatus("Concluído às " + new Date().toLocaleTimeString("pt-BR") +
                " · " + followingList.length + " seguindo · " +
                nonFollowers.length + " não seguem de volta · método: " + methodLabel);

            // Atualiza o histórico local de datas
            const tempHistory = {};
            const nowStr = new Date().toISOString();

            nonFollowers.forEach((user) => {
                tempHistory[user.username] = unfollowHistory[user.username] || nowStr;
            });

            unfollowHistory = tempHistory;
            await saveHistory();

            renderUserList();
            scanState = null;
        } catch (error) {
            if (error && error.paused) {
                showToast("Escaneamento pausado. Clique em \"Continuar\" para retomar.", "warning");
                setStatus("Escaneamento pausado em " +
                    (scanState.following.done
                        ? (scanState.followers.done ? "lista completa" : "lista de seguidores")
                        : "lista de seguindo") +
                    ". Clique em Continuar para retomar.");
                const scanBtn2 = document.getElementById("ns-scan-btn");
                if (scanBtn2) scanBtn2.innerText = "Continuar Escaneamento";
            } else {
                console.error("[InstaUnfollow] Erro no escaneamento:", error);
                const message = (error && error.message) ? error.message : "Erro desconhecido no escaneamento.";
                showToast(message, "danger");
                setStatus("Falha: " + message);
                setProgress(0, "Falha no carregamento.", false);
                const bar = document.getElementById("ns-progress-bar");
                if (bar) bar.style.backgroundColor = "var(--ns-danger)";

                if (error instanceof ApiError && (error.type === "session" || error.type === "challenge")) {
                    scanState = null;
                }
            }
        } finally {
            isScanning = false;
            const btn = document.getElementById("ns-scan-btn");
            if (btn) {
                const paused = !!(scanState && (scanState.following.done || scanState.following.users.length > 0));
                btn.classList.remove("ns-btn-danger");
                btn.classList.add("ns-btn-primary");
                btn.innerText = paused ? "Continuar Escaneamento" : "Iniciar Escaneamento";
            }
            updateStats();
        }
    }

    // ---------------------------------------------------------------------
    // Estatísticas e formatação
    // ---------------------------------------------------------------------
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

        const recentCount = Object.keys(unfollowHistory).length;

        if (totalFollowingEl) totalFollowingEl.innerText = totalFollowing;
        if (totalNonFollowersEl) totalNonFollowersEl.innerText = totalNonFollowers;
        if (friendshipRateEl) friendshipRateEl.innerText = rate + "%";
        if (recentUnfollowsEl) recentUnfollowsEl.innerText = recentCount;
    }

    function formatDate(isoString) {
        if (!isoString) return "Sem histórico";
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "Recente";

        const d = String(date.getDate()).padStart(2, "0");
        const m = String(date.getMonth() + 1).padStart(2, "0");
        const y = date.getFullYear();
        const h = String(date.getHours()).padStart(2, "0");
        const min = String(date.getMinutes()).padStart(2, "0");
        return d + "/" + m + "/" + y + " às " + h + ":" + min;
    }

    // ---------------------------------------------------------------------
    // Lista (busca, ordenação e renderização)
    // ---------------------------------------------------------------------
    function getProcessedUserList() {
        const searchInput = document.getElementById("ns-search-input");
        const sortSelect = document.getElementById("ns-sort-select");

        const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : "";
        const sortBy = sortSelect ? sortSelect.value : "recent";

        let filtered = nonFollowers.filter((user) => {
            const uname = (user.username || "").toLowerCase();
            const fname = (user.full_name || "").toLowerCase();
            return uname.includes(searchTerm) || fname.includes(searchTerm);
        });

        filtered.sort((a, b) => {
            const dateA = unfollowHistory[a.username] || "";
            const dateB = unfollowHistory[b.username] || "";

            if (sortBy === "recent") {
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateB) - new Date(dateA);
            }
            if (sortBy === "oldest") {
                if (!dateA && !dateB) return 0;
                if (!dateA) return 1;
                if (!dateB) return -1;
                return new Date(dateA) - new Date(dateB);
            }
            if (sortBy === "az") {
                return a.username.localeCompare(b.username);
            }
            if (sortBy === "za") {
                return b.username.localeCompare(a.username);
            }
            return 0;
        });

        return filtered;
    }

    function renderUserList() {
        const container = document.getElementById("ns-list-rows");
        if (!container) return;

        const processedList = getProcessedUserList();
        container.innerHTML = "";

        if (processedList.length === 0) {
            const empty = document.createElement("div");
            empty.className = "ns-empty-state";
            empty.innerHTML =
                '<span class="ns-empty-icon">🔍</span>' +
                '<p class="ns-empty-text">Nenhum não-seguidor encontrado com os critérios de filtro.</p>';
            container.appendChild(empty);
            return;
        }

        processedList.forEach((user) => {
            const hasDate = unfollowHistory[user.username];
            const dateStr = hasDate ? formatDate(hasDate) : "Detectado no primeiro scan";

            const row = document.createElement("div");
            row.className = "ns-user-row";
            row.innerHTML =
                '<div class="ns-user-info">' +
                    '<img class="ns-avatar" alt="@' + user.username + '" loading="lazy">' +
                    '<div class="ns-user-details">' +
                        '<a class="ns-username" href="https://www.instagram.com/' + user.username + '/" target="_blank" rel="noopener">@' + user.username + '</a>' +
                        '<span class="ns-fullname"></span>' +
                        '<span class="ns-unfollow-date' + (hasDate ? " ns-has-date" : "") + '">📅 ' + dateStr + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="ns-user-actions">' +
                    '<button class="ns-btn-unfollow-action">Deixar de seguir</button>' +
                '</div>';

            const avatar = row.querySelector(".ns-avatar");
            avatar.src = user.profile_pic_url || AVATAR_FALLBACK;
            avatar.dataset.fb = user.profile_pic_url ? "" : "1";
            avatar.addEventListener("error", function () {
                if (avatar.dataset.fb === "1") return;
                avatar.dataset.fb = "1";
                avatar.src = AVATAR_FALLBACK;
            });

            row.querySelector(".ns-fullname").textContent = user.full_name || "";

            const unfollowBtn = row.querySelector(".ns-btn-unfollow-action");
            unfollowBtn.addEventListener("click", function () {
                performUnfollow(unfollowBtn, user.id, user.username);
            });

            container.appendChild(row);
        });
    }

    // ---------------------------------------------------------------------
    // Dashboard
    // ---------------------------------------------------------------------
    function createDashboardHTML() {
        extractInstagramData();

        const root = document.createElement("div");
        root.id = "nao-seguidores-dashboard";
        root.className = "ns-dashboard-overlay";

        let bodyHTML = "";

        if (!viewerId || !csrfToken) {
            bodyHTML =
                '<div class="ns-dialog ns-dialog-small">' +
                    '<div class="ns-dialog-header">' +
                        '<h2 class="ns-title-gradient">Não Seguidores - InstaUnfollow</h2>' +
                        '<button id="ns-close-btn" class="ns-close-btn">&times;</button>' +
                    '</div>' +
                    '<div class="ns-dialog-body ns-center-text">' +
                        '<div class="ns-error-icon">🔒</div>' +
                        '<h3>Login no Instagram Não Detectado</h3>' +
                        '<p>Para utilizar a extensão, você precisa estar conectado à sua conta do Instagram na aba atual.</p>' +
                        '<a href="https://www.instagram.com" class="ns-btn ns-btn-primary" style="display:inline-block; margin-top:16px; text-decoration:none;">Ir para o Login</a>' +
                    '</div>' +
                '</div>';
        } else {
            bodyHTML =
                '<div class="ns-dialog">' +
                    '<div class="ns-dialog-header">' +
                        '<div class="ns-header-title-block">' +
                            '<h2 class="ns-title-gradient">Não Seguidores - InstaUnfollow</h2>' +
                            '<span class="ns-author-badge">por @duhvilela</span>' +
                        '</div>' +
                        '<button id="ns-close-btn" class="ns-close-btn">&times;</button>' +
                    '</div>' +
                    '<div class="ns-dialog-body">' +
                        '<div class="ns-control-panel">' +
                            '<button id="ns-scan-btn" class="ns-btn ns-btn-primary">Iniciar Escaneamento</button>' +
                            '<div id="ns-progress-container" class="ns-progress-container" style="display:none;">' +
                                '<div class="ns-progress-track">' +
                                    '<div id="ns-progress-bar" class="ns-progress-bar" style="width:0%;"></div>' +
                                '</div>' +
                                '<div id="ns-progress-percent" class="ns-progress-percent">Iniciando...</div>' +
                            '</div>' +
                            '<div id="ns-status-line" class="ns-status-line"></div>' +
                        '</div>' +
                        '<div class="ns-stats-grid">' +
                            '<div class="ns-stat-card">' +
                                '<span class="ns-stat-label">Seguindo</span>' +
                                '<span id="ns-stat-following" class="ns-stat-value">0</span>' +
                            '</div>' +
                            '<div class="ns-stat-card">' +
                                '<span class="ns-stat-label">Não seguem de volta</span>' +
                                '<span id="ns-stat-nonfollowers" class="ns-stat-value">0</span>' +
                            '</div>' +
                            '<div class="ns-stat-card">' +
                                '<span class="ns-stat-label">Taxa de Retorno</span>' +
                                '<span id="ns-stat-rate" class="ns-stat-value">100%</span>' +
                            '</div>' +
                            '<div class="ns-stat-card">' +
                                '<span class="ns-stat-label">Rastreados no Histórico</span>' +
                                '<span id="ns-stat-recent" class="ns-stat-value">0</span>' +
                            '</div>' +
                        '</div>' +
                        '<div class="ns-filter-row">' +
                            '<input type="text" id="ns-search-input" class="ns-input-search" placeholder="🔍 Buscar usuário por username ou nome...">' +
                            '<select id="ns-sort-select" class="ns-select-sort">' +
                                '<option value="recent">Mais Recentes primeiro</option>' +
                                '<option value="oldest">Mais Antigos primeiro</option>' +
                                '<option value="az">Nome (A-Z)</option>' +
                                '<option value="za">Nome (Z-A)</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="ns-list-container">' +
                            '<div id="ns-list-rows" class="ns-list-rows">' +
                                '<div class="ns-empty-state">' +
                                    '<span class="ns-empty-icon">📊</span>' +
                                    '<p class="ns-empty-text">Clique em "Iniciar Escaneamento" para obter a lista atualizada de quem não te segue de volta.</p>' +
                                '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>';
        }

        root.innerHTML = bodyHTML;
        document.body.appendChild(root);

        const toastContainer = document.createElement("div");
        toastContainer.id = "ns-toast-container";
        toastContainer.className = "ns-toast-container";
        document.body.appendChild(toastContainer);

        const closeHandler = () => {
            stopScanningRequested = true;
            root.remove();
            toastContainer.remove();
            document.body.style.overflowY = "visible";
            document.removeEventListener("keydown", escHandler);
        };

        document.getElementById("ns-close-btn").addEventListener("click", closeHandler);

        if (viewerId && csrfToken) {
            setStatus(lastScanInfo);

            const scanBtn = document.getElementById("ns-scan-btn");
            scanBtn.addEventListener("click", () => {
                if (isScanning) {
                    stopScanningRequested = true;
                } else {
                    const bar = document.getElementById("ns-progress-bar");
                    if (bar) bar.style.backgroundColor = "";
                    scanInstagram();
                }
            });

            document.getElementById("ns-search-input").addEventListener("input", renderUserList);
            document.getElementById("ns-sort-select").addEventListener("change", renderUserList);

            loadHistory().then(() => updateStats());
        }

        document.body.style.overflowY = "hidden";
    }

    const escHandler = function (event) {
        if (event.key !== "Escape") return;
        const closeBtn = document.getElementById("ns-close-btn");
        if (closeBtn) closeBtn.click();
    };
    document.addEventListener("keydown", escHandler);

    createDashboardHTML();
})();
