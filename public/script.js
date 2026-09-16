const API_URL = "http://localhost:3000";

Chart.defaults.font.family = "Vazirmatn";
Chart.defaults.font.size = 13;

let transactionPage = 1;
let transactionTotalPages = 1;

let dailyPage = 1;
let dailyTotalPages = 1;

const TRANSACTIONS_PER_PAGE = 5;
const DAILY_PER_PAGE = 5;

let authToken = localStorage.getItem("authToken");
let lastPrice = null;

const priceHistory = [];
const MAX_PRICE_POINTS = 100;

const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");

let priceChart = null;
let dailyChart = null;

async function apiRequest(path, method = "GET", body = null) {
  const headers = { "Content-Type": "application/json" };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "خطای ناشناخته");
  return data;
}

function formatNumber(value) {
  return Number(value).toLocaleString("fa-IR");
}

async function withButtonLock(button, action) {
  button.disabled = true;
  try {
    await action();
  } finally {
    button.disabled = false;
  }
}

// --- Switch between register/login inside the single auth box ---

let currentAuthMode = "register";

document.getElementById("switch-link-btn").addEventListener("click", (e) => {
  e.preventDefault();

  const registerForm = document.getElementById("register-form");
  const loginForm = document.getElementById("login-form");
  const title = document.getElementById("auth-title");
  const switchText = document.getElementById("switch-text");
  const switchBtn = document.getElementById("switch-link-btn");

  if (currentAuthMode === "register") {
    currentAuthMode = "login";
    registerForm.classList.add("hidden");
    loginForm.classList.remove("hidden");
    title.textContent = "ورود";
    switchText.textContent = "حساب کاربری ندارید؟";
    switchBtn.textContent = "ثبت‌نام";
  } else {
    currentAuthMode = "register";
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    title.textContent = "ثبت‌نام";
    switchText.textContent = "قبلاً ثبت‌نام کرده‌اید؟";
    switchBtn.textContent = "ورود";
  }

  document.getElementById("auth-message").textContent = "";
});

// --- Auth ---

async function showDashboard() {
  authSection.classList.add("hidden");
  dashboardSection.classList.remove("hidden");

  initCharts();

  await loadPriceHistory();
  await refreshPrice();

  refreshWallet();
  refreshDailySummary();
  refreshTransactionList();
}

function showAuth() {
  authToken = null;
  localStorage.removeItem("authToken");
  dashboardSection.classList.add("hidden");
  authSection.classList.remove("hidden");
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const submitBtn = e.target.querySelector("button");
  const email = document.getElementById("login-email").value;
  const password = document.getElementById("login-password").value;

  await withButtonLock(submitBtn, async () => {
    try {
      const data = await apiRequest("/auth/login", "POST", { email, password });
      authToken = data.token;
      localStorage.setItem("authToken", authToken);
      showDashboard();
    } catch (error) {
      document.getElementById("auth-message").textContent = error.message;
    }
  });
});

document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector("button");
    const name = document.getElementById("register-name").value;
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;

    await withButtonLock(submitBtn, async () => {
      try {
        const data = await apiRequest("/auth/register", "POST", {
          name,
          email,
          password,
        });
        authToken = data.token;
        localStorage.setItem("authToken", authToken);
        showDashboard();
      } catch (error) {
        document.getElementById("auth-message").textContent = error.message;
      }
    });
  });

document.getElementById("logout-btn").addEventListener("click", showAuth);

if (authToken) showDashboard();

// --- Charts setup ---

function initCharts() {
  if (priceChart) {
    priceChart.destroy();
  }
  if (dailyChart) {
    dailyChart.destroy();
  }

  const priceCtx = document.getElementById("price-chart");
  priceChart = new Chart(priceCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          stepped: true,
          borderColor: "#22c55e",
          backgroundColor: "rgba(34,197,94,0.1)",
          fill: true,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { ticks: { color: "#94a3b8" } },
      },
    },
  });

  const dailyCtx = document.getElementById("daily-chart");
  dailyChart = new Chart(dailyCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "خرید",
          data: [],
          backgroundColor: "#22c55e",
          stack: "trades",
        },
        {
          label: "فروش",
          data: [],
          backgroundColor: "#ef4444",
          stack: "trades",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: true, labels: { color: "#94a3b8" } },
      },
      scales: {
        x: { stacked: true, ticks: { color: "#94a3b8" } },
        y: { stacked: true, ticks: { color: "#94a3b8" } },
      },
    },
  });
}

// --- Price (line chart) ---

async function refreshPrice() {
  const data = await apiRequest("/price");
  const priceEl = document.getElementById("price-value");

  priceEl.textContent = `${formatNumber(data.price)} تومان`;
  priceEl.classList.remove("price-up", "price-down");

  if (lastPrice !== null) {
    priceEl.classList.add(data.price > lastPrice ? "price-up" : "price-down");
  }

  lastPrice = data.price;

  const now = new Date().toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  priceHistory.push({ time: now, price: data.price });
  if (priceHistory.length > MAX_PRICE_POINTS) priceHistory.shift();

  priceChart.data.labels = priceHistory.map((p) => p.time);
  priceChart.data.datasets[0].data = priceHistory.map((p) => p.price);
  priceChart.update();
}

setInterval(refreshPrice, 5000);

async function loadPriceHistory() {
  const data = await apiRequest("/price/history");

  priceHistory.length = 0;

  data.history.forEach((item) => {
    priceHistory.push({
      time: new Date(item.createdAt).toLocaleTimeString("fa-IR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      price: item.price,
    });
  });

  priceChart.data.labels = priceHistory.map((p) => p.time);
  priceChart.data.datasets[0].data = priceHistory.map((p) => p.price);
  priceChart.update();
}

// --- Wallet ---

async function refreshWallet() {
  const wallet = await apiRequest("/wallet");
  document.getElementById("wallet-toman").textContent = formatNumber(
    wallet.tomanBalance,
  );
  document.getElementById("wallet-tether").textContent = formatNumber(
    wallet.tetherBalance,
  );
}

// --- Daily buy/sell stacked chart ---

async function refreshDailySummary() {
  const data = await apiRequest(
    `/transactions/daily-summary?page=${dailyPage}&limit=5`,
  );

  dailyTotalPages = data.totalPages || 1;

  const labels = data.days.map((d) =>
    new Date(d.date).toLocaleDateString("fa-IR", {
      month: "2-digit",
      day: "2-digit",
    }),
  );

  dailyChart.data.labels = labels;
  dailyChart.data.datasets[0].data = data.days.map((d) => d.buy);
  dailyChart.data.datasets[1].data = data.days.map((d) => -d.sell);

  dailyChart.update();
  document.getElementById("daily-page-indicator").textContent =
    `صفحه ${dailyPage} از ${dailyTotalPages}`;

  document.getElementById("daily-prev-btn").disabled = dailyPage <= 1;

  document.getElementById("daily-next-btn").disabled =
    dailyPage >= dailyTotalPages;
}

document.getElementById("daily-prev-btn").addEventListener("click", () => {
  if (dailyPage > 1) {
    dailyPage--;
    refreshDailySummary();
  }
});

document.getElementById("daily-next-btn").addEventListener("click", () => {
  if (dailyPage < dailyTotalPages) {
    dailyPage++;
    refreshDailySummary();
  }
});

// --- Full transaction list (text) ---

async function refreshTransactionList() {
  const data = await apiRequest(
    `/transactions?page=${transactionPage}&limit=5`,
  );
  console.log("TRANSACTION DATA:", data);
  const list = document.getElementById("transaction-list");
  list.innerHTML = "";

  transactionTotalPages = data.totalPages || 1;

  data.transactions.forEach((tx) => {
    const item = document.createElement("li");
    const isBuy = tx.type === "buy";

    const typeLabel = isBuy ? "خرید" : "فروش";
    const typeClass = isBuy ? "tx-buy" : "tx-sell";

    const dateStr = new Date(tx.createdAt).toLocaleDateString("fa-IR");

    const timeStr = new Date(tx.createdAt).toLocaleTimeString("fa-IR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    item.innerHTML = `
      <div class="tx-row-top">
        <span class="${typeClass}">
          ${typeLabel} ${formatNumber(tx.amount)} USDT
        </span>

        <span>
          ${formatNumber(tx.totalToman)} تومان
        </span>
      </div>

      <div class="tx-row-bottom">
        <span>${dateStr} - ${timeStr}</span>

        <span>
          قیمت واحد: ${formatNumber(tx.pricePerUnit)}
        </span>
      </div>
    `;

    list.appendChild(item);
  });

  document.getElementById("transaction-page-indicator").textContent =
    `صفحه ${transactionPage} از ${transactionTotalPages}`;

  document.getElementById("transaction-prev-btn").disabled =
    transactionPage <= 1;

  document.getElementById("transaction-next-btn").disabled =
    transactionPage >= transactionTotalPages;
}

document
  .getElementById("transaction-prev-btn")
  .addEventListener("click", () => {
    if (transactionPage > 1) {
      transactionPage--;
      refreshTransactionList();
    }
  });

document
  .getElementById("transaction-next-btn")
  .addEventListener("click", () => {
    if (transactionPage < transactionTotalPages) {
      transactionPage++;
      refreshTransactionList();
    }
  });

// --- Buy / Sell ---

function setTradeMessage(text, isError) {
  const el = document.getElementById("trade-message");
  el.textContent = text;
  el.classList.remove("message-success", "message-error");
  el.classList.add(isError ? "message-error" : "message-success");
}

async function refreshAllAfterTrade() {
  refreshWallet();
  refreshDailySummary();
  refreshTransactionList();
}

document.getElementById("buy-btn").addEventListener("click", async (e) => {
  const amount = Number(document.getElementById("trade-amount").value);
  await withButtonLock(e.target, async () => {
    try {
      await apiRequest("/buy", "POST", { amount });
      setTradeMessage("خرید موفق بود", false);
      refreshAllAfterTrade();
    } catch (error) {
      setTradeMessage(error.message, true);
    }
  });
});

document.getElementById("sell-btn").addEventListener("click", async (e) => {
  const amount = Number(document.getElementById("trade-amount").value);
  await withButtonLock(e.target, async () => {
    try {
      await apiRequest("/sell", "POST", { amount });
      setTradeMessage("فروش موفق بود", false);
      refreshAllAfterTrade();
    } catch (error) {
      setTradeMessage(error.message, true);
    }
  });
});
