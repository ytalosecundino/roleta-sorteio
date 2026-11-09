/**
 * Roleta de Sorteio
 * - Layout 3 colunas: itens | roleta | histórico
 * - Cores personalizáveis por item
 * - Confetes no resultado
 */

(() => {
  const STORAGE_KEY = "roleta-sorteio-v4";

  let items = []; // { label, color }
  let history = [];
  let title = "Sorteio";
  let theme = "dark";
  let bgImage = null;
  let isSpinning = false;
  let currentRotation = 0;
  let pendingTheme = "dark";
  let pendingBgImage = null;
  let spinMode = "geral"; // "geral" | "eliminatorio"
  let historyOrder = "oldest"; // "oldest" | "newest"

  const DEFAULT_COLORS = [
    "#ef4444", "#f97316", "#eab308", "#22c55e",
    "#14b8a6", "#3b82f6", "#8b5cf6", "#ec4899",
    "#f43f5e", "#84cc16", "#06b6d4", "#a855f7",
    "#fb923c", "#4ade80", "#60a5fa", "#e879f9"
  ];

  const canvas = document.getElementById("wheel");
  const ctx = canvas.getContext("2d");
  const spinBtn = document.getElementById("spinBtn");
  const itemsList = document.getElementById("itemsList");
  const addForm = document.getElementById("addForm");
  const itemInput = document.getElementById("itemInput");
  const wheelTitleInput = document.getElementById("wheelTitle");
  const historyList = document.getElementById("historyList");
  const emptyHistory = document.getElementById("emptyHistory");
  const clearItemsBtn = document.getElementById("clearItems");
  const clearHistoryBtn = document.getElementById("clearHistory");
  const toggleHistoryOrderBtn = document.getElementById("toggleHistoryOrder");
  const modeBtns = document.querySelectorAll(".mode-btn");
  const modeHint = document.getElementById("modeHint");
  const settingsBtn = document.getElementById("settingsBtn");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettings = document.getElementById("closeSettings");
  const themeBtns = document.querySelectorAll(".theme-btn");
  const bgImageInput = document.getElementById("bgImageInput");
  const removeBgBtn = document.getElementById("removeBg");
  const defaultBgBtn = document.getElementById("defaultBgBtn");
  const saveSettingsBtn = document.getElementById("saveSettings");
  const bgOverlay = document.getElementById("bgOverlay");
  const bgPreview = document.getElementById("bgPreview");
  const resultOverlay = document.getElementById("resultOverlay");
  const resultText = document.getElementById("resultText");
  const resultLabel = document.getElementById("resultLabel");
  const resultSubtext = document.getElementById("resultSubtext");
  const closeResult = document.getElementById("closeResult");
  const spinBtnLabel = document.getElementById("spinBtnLabel");
  const resultCard = document.querySelector(".result-card");
  let awaitRestart = false;
  let pendingResultQueue = [];
  const confettiCanvas = document.getElementById("confettiCanvas");
  const confettiCtx = confettiCanvas.getContext("2d");

  function nextDefaultColor() {
    return DEFAULT_COLORS[items.length % DEFAULT_COLORS.length];
  }

  function normalizeItems(raw) {
    if (!Array.isArray(raw)) return [];
    return raw.map((it, i) => {
      if (typeof it === "string") {
        return { label: it, color: DEFAULT_COLORS[i % DEFAULT_COLORS.length], eliminated: false };
      }
      return {
        label: String(it.label || ""),
        color: it.color || DEFAULT_COLORS[i % DEFAULT_COLORS.length],
        eliminated: !!it.eliminated
      };
    }).filter((it) => it.label);
  }

  function activeItems() {
    if (spinMode === "eliminatorio") {
      return items.filter((it) => !it.eliminated);
    }
    return items;
  }

  function clearEliminations() {
    items.forEach((it) => { it.eliminated = false; });
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      items = normalizeItems(data.items);
      history = Array.isArray(data.history) ? data.history : [];
      history.sort((a, b) => new Date(a.time) - new Date(b.time));
      title = typeof data.title === "string" ? data.title : "Sorteio";
      theme = ["dark", "light", "glass"].includes(data.theme) ? data.theme : "dark";
      bgImage = data.bgImage || null;
      spinMode = data.spinMode === "eliminatorio" ? "eliminatorio" : "geral";
      historyOrder = data.historyOrder === "newest" ? "newest" : "oldest";
    } catch (e) {
      console.warn("Erro ao carregar estado:", e);
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, history, title, theme, bgImage, spinMode, historyOrder }));
  }

  function applyTheme(t, persist = true) {
    theme = t;
    document.documentElement.setAttribute("data-theme", t);
    themeBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.theme === t));
    if (persist) saveState();
  }

  function applyBackground(dataUrl, persist = true) {
    bgImage = dataUrl;
    if (dataUrl) {
      bgOverlay.style.backgroundImage = `url(${dataUrl})`;
      bgOverlay.classList.add("has-image");
      document.body.classList.add("has-custom-bg");
    } else {
      bgOverlay.style.backgroundImage = "";
      bgOverlay.classList.remove("has-image");
      document.body.classList.remove("has-custom-bg");
    }
    updateBgPreview(dataUrl);
    if (persist) saveState();
  }

  function updateBgPreview(dataUrl) {
    if (!bgPreview) return;
    if (dataUrl) {
      bgPreview.style.backgroundImage = `url(${dataUrl})`;
      bgPreview.classList.add("has-image");
    } else {
      bgPreview.style.backgroundImage = "";
      bgPreview.classList.remove("has-image");
    }
  }

  function previewTheme(t) {
    pendingTheme = t;
    document.documentElement.setAttribute("data-theme", t);
    themeBtns.forEach((btn) => btn.classList.toggle("active", btn.dataset.theme === t));
  }

  function previewBackground(dataUrl) {
    pendingBgImage = dataUrl;
    if (dataUrl) {
      bgOverlay.style.backgroundImage = `url(${dataUrl})`;
      bgOverlay.classList.add("has-image");
      document.body.classList.add("has-custom-bg");
    } else {
      bgOverlay.style.backgroundImage = "";
      bgOverlay.classList.remove("has-image");
      document.body.classList.remove("has-custom-bg");
    }
    updateBgPreview(dataUrl);
  }

  function openSettings() {
    pendingTheme = theme;
    pendingBgImage = bgImage;
    previewTheme(theme);
    updateBgPreview(bgImage);
    settingsModal.classList.remove("hidden");
  }

  function closeSettingsModal() {
    applyTheme(theme, false);
    applyBackground(bgImage, false);
    settingsModal.classList.add("hidden");
  }

  function saveSettings() {
    theme = pendingTheme;
    bgImage = pendingBgImage;
    applyTheme(theme, true);
    applyBackground(bgImage, true);
    saveSettingsBtn.classList.add("saved");
    saveSettingsBtn.textContent = "Salvo!";
    setTimeout(() => {
      saveSettingsBtn.classList.remove("saved");
      saveSettingsBtn.textContent = "Salvar alterações";
      settingsModal.classList.add("hidden");
    }, 700);
  }

  function formatTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit"
    });
  }

  function drawWheel() {
    const size = canvas.width;
    const center = size / 2;
    const radius = center - 6;
    ctx.clearRect(0, 0, size, size);

    const wheelItems = activeItems();

    if (wheelItems.length === 0) {
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fillStyle = "#2a2f40";
      ctx.fill();
      ctx.strokeStyle = "#3f455a";
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = "#9ba3b5";
      ctx.font = "600 18px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (items.length === 0) {
        ctx.fillText("Adicione itens", center, center - 12);
        ctx.font = "400 14px Inter, sans-serif";
        ctx.fillText("para começar", center, center + 14);
      } else {
        ctx.fillText("Sorteio concluído", center, center - 12);
        ctx.font = "400 14px Inter, sans-serif";
        ctx.fillText("Todos eliminados", center, center + 14);
      }
      return;
    }

    // Um único item restante: mostra segmento completo
    const arc = (Math.PI * 2) / wheelItems.length;
    wheelItems.forEach((item, i) => {
      const start = i * arc;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = item.color;
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#fff";
      ctx.font = `600 ${Math.min(16, 280 / wheelItems.length)}px Inter, sans-serif`;
      ctx.shadowColor = "rgba(0,0,0,0.4)";
      ctx.shadowBlur = 3;
      let label = item.label;
      if (label.length > 14) label = label.slice(0, 13) + "…";
      ctx.fillText(label, radius - 18, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(center, center, 48, 0, Math.PI * 2);
    ctx.fillStyle = "#1a1d27";
    ctx.fill();
  }

  function startIdleSpin() {
    if (isSpinning) return;
    canvas.classList.add("idle-spin");
    spinBtn.classList.add("idle");
  }

  function stopIdleSpin() {
    canvas.classList.remove("idle-spin");
    spinBtn.classList.remove("idle");
  }

  function renderItems() {
    itemsList.innerHTML = "";
    if (items.length === 0) {
      const li = document.createElement("li");
      li.className = "empty-msg";
      li.style.padding = "1rem 0";
      li.textContent = "Nenhum item adicionado.";
      itemsList.appendChild(li);
      return;
    }

    items.forEach((item, index) => {
      const li = document.createElement("li");
      li.className = "item-row" + (item.eliminated ? " eliminated" : "");
      li.dataset.index = index;
      const badge = item.eliminated ? '<span class="item-badge-out">fora</span>' : "";
      li.innerHTML = `
        <div class="item-color-wrap" title="Alterar cor">
          <span class="item-color-swatch" style="background:${item.color}"></span>
          <input type="color" class="item-color-input" value="${item.color}" data-action="color" />
        </div>
        <span class="item-label" title="${item.label}">${item.label}</span>
        ${badge}
        <div class="item-actions">
          <button class="btn-icon edit" title="Editar" data-action="edit">✏️</button>
          <button class="btn-icon delete" title="Remover" data-action="delete">🗑️</button>
        </div>
      `;
      itemsList.appendChild(li);
    });
  }

  function getDisplayHistory() {
    // history always stored oldest→newest
    if (historyOrder === "newest") {
      return [...history].reverse();
    }
    return history;
  }

  function renderHistory() {
    historyList.innerHTML = "";
    if (history.length === 0) {
      emptyHistory.classList.remove("hidden");
      return;
    }
    emptyHistory.classList.add("hidden");
    const display = getDisplayHistory();
    display.forEach((entry, i) => {
      // número = ordem cronológica real (1 = primeiro sorteio)
      const realIndex = history.indexOf(entry);
      const li = document.createElement("li");
      li.className = "history-item";
      li.innerHTML = `
        <span class="history-number">#${realIndex + 1}</span>
        <span class="history-label">${entry.label}</span>
        <span class="history-time">${formatTime(entry.time)}</span>
      `;
      historyList.appendChild(li);
    });
    if (toggleHistoryOrderBtn) {
      toggleHistoryOrderBtn.textContent = historyOrder === "oldest" ? "⇅ Recentes" : "⇅ Antigos";
      toggleHistoryOrderBtn.title = historyOrder === "oldest"
        ? "Mostrar mais recentes no topo"
        : "Mostrar mais antigos no topo";
    }
  }

  function updateUI() {
    wheelTitleInput.value = title;
    renderItems();
    renderHistory();
    drawWheel();
    setCenterButtonMode();
  }

  function addItem(label) {
    const trimmed = label.trim();
    if (!trimmed) return;
    if (items.some((it) => it.label === trimmed)) {
      alert("Esse item já existe na lista.");
      return;
    }
    items.push({ label: trimmed, color: nextDefaultColor(), eliminated: false });
    saveState();
    updateUI();
  }

  function removeItem(index) {
    if (index < 0 || index >= items.length) return;
    items.splice(index, 1);
    saveState();
    updateUI();
  }

  function editItem(index, newLabel) {
    const trimmed = newLabel.trim();
    if (!trimmed) return;
    if (items.some((it, i) => i !== index && it.label === trimmed)) {
      alert("Já existe um item com esse nome.");
      return;
    }
    items[index].label = trimmed;
    saveState();
    updateUI();
  }

  function setItemColor(index, color) {
    if (index < 0 || index >= items.length) return;
    items[index].color = color;
    saveState();
    drawWheel();
    const swatch = itemsList.querySelector(`[data-index="${index}"] .item-color-swatch`);
    if (swatch) swatch.style.background = color;
  }

  function startEdit(index, labelEl) {
    const current = items[index].label;
    const input = document.createElement("input");
    input.type = "text";
    input.className = "item-edit-input";
    input.value = current;
    input.maxLength = 40;
    labelEl.replaceWith(input);
    input.focus();
    input.select();
    const finish = () => editItem(index, input.value);
    input.addEventListener("blur", finish);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") { e.preventDefault(); input.blur(); }
      if (e.key === "Escape") updateUI();
    });
  }

  // ---------- Confetti ----------
  let confettiParticles = [];
  let confettiAnimId = null;

  function resizeConfetti() {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  }

  function launchConfetti() {
    resizeConfetti();
    confettiCanvas.classList.add("active");
    confettiParticles = [];
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#fbbf24", "#fff"];
    for (let i = 0; i < 160; i++) {
      confettiParticles.push({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * 80,
        w: 6 + Math.random() * 8,
        h: 4 + Math.random() * 6,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 8,
        vy: 2 + Math.random() * 5,
        rot: Math.random() * 360,
        vr: (Math.random() - 0.5) * 12,
        opacity: 1
      });
    }
    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
    function frame() {
      confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
      let alive = 0;
      confettiParticles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.rot += p.vr;
        p.opacity -= 0.004;
        if (p.opacity <= 0 || p.y > confettiCanvas.height + 20) return;
        alive++;
        confettiCtx.save();
        confettiCtx.translate(p.x, p.y);
        confettiCtx.rotate((p.rot * Math.PI) / 180);
        confettiCtx.globalAlpha = Math.max(0, p.opacity);
        confettiCtx.fillStyle = p.color;
        confettiCtx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        confettiCtx.restore();
      });
      if (alive > 0) {
        confettiAnimId = requestAnimationFrame(frame);
      } else {
        confettiCanvas.classList.remove("active");
        confettiAnimId = null;
      }
    }
    confettiAnimId = requestAnimationFrame(frame);
  }

  function stopConfetti() {
    if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
    confettiAnimId = null;
    confettiCanvas.classList.remove("active");
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  }

  // ---------- Sorteio ----------
  function finishEliminationIfLast() {
    if (spinMode !== "eliminatorio") return null;
    const remaining = activeItems();
    if (remaining.length !== 1) return null;
    const last = remaining[0];
    last.eliminated = true;
    history.push({ label: last.label, time: new Date().toISOString() });
    if (history.length > 50) history.shift();
    return last;
  }

  function isEliminationComplete() {
    return spinMode === "eliminatorio" && items.length > 0 && activeItems().length === 0;
  }

  function setCenterButtonMode() {
    if (isEliminationComplete()) {
      awaitRestart = true;
      spinBtn.disabled = false;
      spinBtn.classList.add("restart-mode");
      spinBtn.classList.add("idle");
      if (spinBtnLabel) spinBtnLabel.textContent = "REINICIAR";
      spinBtn.title = "Reiniciar sorteio eliminatório";
    } else {
      awaitRestart = false;
      spinBtn.classList.remove("restart-mode");
      if (spinBtnLabel) spinBtnLabel.textContent = "GIRAR";
      spinBtn.title = "Girar a roleta";
      const left = activeItems().length;
      spinBtn.disabled = left < 2 || isSpinning;
      if (!isSpinning && left >= 2) startIdleSpin();
      else stopIdleSpin();
    }
  }

  function showResultNotification({ label, title, subtext, completed }) {
    if (resultLabel) resultLabel.textContent = title;
    resultText.textContent = label;
    if (resultSubtext) {
      if (subtext) {
        resultSubtext.textContent = subtext;
        resultSubtext.classList.remove("hidden");
      } else {
        resultSubtext.textContent = "";
        resultSubtext.classList.add("hidden");
      }
    }
    if (resultCard) resultCard.classList.toggle("completed", !!completed);
    resultOverlay.classList.remove("hidden");
    launchConfetti();
  }

  function showNextQueuedResult() {
    if (!pendingResultQueue.length) {
      setCenterButtonMode();
      return;
    }
    const next = pendingResultQueue.shift();
    showResultNotification(next);
  }

  function restartElimination() {
    clearEliminations();
    history = [];
    awaitRestart = false;
    currentRotation = 0;
    canvas.style.transition = "none";
    canvas.style.transform = "rotate(0deg)";
    saveState();
    renderHistory();
    renderItems();
    drawWheel();
    setCenterButtonMode();
  }

  function spin() {
    if (awaitRestart || isEliminationComplete()) {
      restartElimination();
      return;
    }

    const wheelItems = activeItems();
    if (isSpinning || wheelItems.length < 2) return;
    isSpinning = true;
    spinBtn.disabled = true;
    stopIdleSpin();

    canvas.style.animation = "none";
    canvas.style.transition = "none";
    canvas.style.transform = `rotate(${currentRotation}deg)`;
    void canvas.offsetWidth;

    const winnerIndex = Math.floor(Math.random() * wheelItems.length);
    const winner = wheelItems[winnerIndex];

    const arc = 360 / wheelItems.length;
    const segmentCenter = winnerIndex * arc + arc / 2;
    const targetAngle = 360 - segmentCenter - 90;
    const extraSpins = 5 + Math.floor(Math.random() * 3);
    const finalRotation =
      currentRotation +
      extraSpins * 360 +
      ((targetAngle - (currentRotation % 360) + 360) % 360);

    const duration = 4800 + Math.random() * 1200;
    canvas.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.8, 0.2, 1)`;
    canvas.style.transform = `rotate(${finalRotation}deg)`;
    currentRotation = finalRotation;

    setTimeout(() => {
      isSpinning = false;

      history.push({ label: winner.label, time: new Date().toISOString() });
      if (history.length > 50) history.shift();

      if (spinMode === "eliminatorio") {
        const full = items.find((it) => it.label === winner.label && !it.eliminated);
        if (full) full.eliminated = true;
      }

      const autoLast = finishEliminationIfLast();

      saveState();
      renderHistory();
      renderItems();
      drawWheel();
      canvas.style.transition = "none";

      pendingResultQueue = [];

      if (autoLast) {
        // 1) notificação do penúltimo (o que acabou de sair no giro)
        pendingResultQueue.push({
          label: winner.label,
          title: "Sorteado!",
          subtext: "Próximo: último item restante",
          completed: false
        });
        // 2) notificação separada do último + sorteio concluído
        pendingResultQueue.push({
          label: autoLast.label,
          title: "Sorteio concluído!",
          subtext: "Último item do sorteio eliminatório",
          completed: true
        });
        showNextQueuedResult();
      } else {
        showResultNotification({
          label: winner.label,
          title: "Sorteado!",
          subtext: "",
          completed: false
        });
        setCenterButtonMode();
      }
    }, duration + 80);
  }

  function closeResultOverlay() {
    resultOverlay.classList.add("hidden");
    stopConfetti();
    if (resultCard) resultCard.classList.remove("completed");
    if (pendingResultQueue.length) {
      // pequena pausa visual entre notificações
      setTimeout(() => showNextQueuedResult(), 180);
      return;
    }
    setCenterButtonMode();
  }

  // ---------- Eventos ----------
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addItem(itemInput.value);
    itemInput.value = "";
    itemInput.focus();
  });

  itemsList.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const row = btn.closest(".item-row");
    if (!row) return;
    const index = Number(row.dataset.index);
    const action = btn.dataset.action;
    if (action === "delete") removeItem(index);
    else if (action === "edit") {
      const labelEl = row.querySelector(".item-label");
      if (labelEl) startEdit(index, labelEl);
    }
  });

  itemsList.addEventListener("input", (e) => {
    if (e.target.matches(".item-color-input")) {
      const row = e.target.closest(".item-row");
      if (!row) return;
      const index = Number(row.dataset.index);
      setItemColor(index, e.target.value);
    }
  });

  wheelTitleInput.addEventListener("change", () => {
    title = wheelTitleInput.value.trim() || "Sorteio";
    saveState();
  });
  wheelTitleInput.addEventListener("blur", () => {
    title = wheelTitleInput.value.trim() || "Sorteio";
    wheelTitleInput.value = title;
    saveState();
  });

  spinBtn.addEventListener("click", spin);

  clearItemsBtn.addEventListener("click", () => {
    if (items.length === 0) return;
    if (confirm("Remover todos os itens da roleta?")) {
      items = [];
      saveState();
      updateUI();
    }
  });

  const modeConfirmOverlay = document.getElementById("modeConfirmOverlay");
  const modeConfirmText = document.getElementById("modeConfirmText");
  const modeConfirmOk = document.getElementById("modeConfirmOk");
  const modeConfirmCancel = document.getElementById("modeConfirmCancel");
  let pendingModeChange = null;

  function applyModeUI() {
    modeBtns.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === spinMode);
    });
    if (modeHint) {
      modeHint.textContent = spinMode === "eliminatorio"
        ? "Eliminatório: o item sai da roleta (permanece na lista). O último entra sozinho no histórico."
        : "Geral: os itens permanecem na roleta após o sorteio.";
    }
  }

  function commitSpinMode(mode) {
    const next = mode === "eliminatorio" ? "eliminatorio" : "geral";
    if (next === spinMode) return;
    spinMode = next;
    history = [];
    clearEliminations();
    applyModeUI();
    saveState();
    renderHistory();
    renderItems();
    drawWheel();
    updateUI();
  }

  function requestSpinMode(mode) {
    const next = mode === "eliminatorio" ? "eliminatorio" : "geral";
    if (next === spinMode) return;
    if (history.length > 0) {
      pendingModeChange = next;
      if (modeConfirmText) {
        modeConfirmText.textContent =
          "Há itens no histórico de sorteios. Ao mudar o modo, o histórico será apagado para iniciar o novo sorteio.";
      }
      modeConfirmOverlay.classList.remove("hidden");
      return;
    }
    commitSpinMode(next);
  }

  function closeModeConfirm() {
    pendingModeChange = null;
    modeConfirmOverlay.classList.add("hidden");
  }

  modeBtns.forEach((btn) => {
    btn.addEventListener("click", () => requestSpinMode(btn.dataset.mode));
  });

  if (modeConfirmOk) {
    modeConfirmOk.addEventListener("click", () => {
      if (pendingModeChange) commitSpinMode(pendingModeChange);
      closeModeConfirm();
    });
  }
  if (modeConfirmCancel) {
    modeConfirmCancel.addEventListener("click", closeModeConfirm);
  }
  if (modeConfirmOverlay) {
    modeConfirmOverlay.addEventListener("click", (e) => {
      if (e.target === modeConfirmOverlay) closeModeConfirm();
    });
  }

  if (toggleHistoryOrderBtn) {
    toggleHistoryOrderBtn.addEventListener("click", () => {
      historyOrder = historyOrder === "oldest" ? "newest" : "oldest";
      saveState();
      renderHistory();
    });
  }

  clearHistoryBtn.addEventListener("click", () => {
    if (history.length === 0) return;
    if (confirm("Limpar todo o histórico de sorteios?")) {
      history = [];
      saveState();
      renderHistory();
    }
  });

  settingsBtn.addEventListener("click", openSettings);
  closeSettings.addEventListener("click", closeSettingsModal);
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) closeSettingsModal();
  });

  themeBtns.forEach((btn) => {
    btn.addEventListener("click", () => previewTheme(btn.dataset.theme));
  });

  bgImageInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => previewBackground(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = "";
  });

  defaultBgBtn.addEventListener("click", () => previewBackground(null));
  removeBgBtn.addEventListener("click", () => previewBackground(null));
  saveSettingsBtn.addEventListener("click", saveSettings);
  closeResult.addEventListener("click", closeResultOverlay);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (modeConfirmOverlay && !modeConfirmOverlay.classList.contains("hidden")) closeModeConfirm();
      else if (!resultOverlay.classList.contains("hidden")) closeResultOverlay();
      else if (!settingsModal.classList.contains("hidden")) closeSettingsModal();
    }
  });

  function resizeCanvas() {
    const container = canvas.parentElement;
    const size = Math.min(420, container.clientWidth);
    canvas.width = size;
    canvas.height = size;
    drawWheel();
  }

  window.addEventListener("resize", () => {
    resizeCanvas();
    resizeConfetti();
  });

  loadState();
  applyTheme(theme, false);
  applyBackground(bgImage, false);
  applyModeUI();
  resizeCanvas();
  updateUI();

  if (items.length === 0 && history.length === 0) {
    items = [
      { label: "Opção A", color: DEFAULT_COLORS[0], eliminated: false },
      { label: "Opção B", color: DEFAULT_COLORS[1], eliminated: false },
      { label: "Opção C", color: DEFAULT_COLORS[2], eliminated: false },
      { label: "Opção D", color: DEFAULT_COLORS[3], eliminated: false }
    ];
    saveState();
    updateUI();
  }
})();
