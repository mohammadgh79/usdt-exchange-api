const API_URL = "http://localhost:3000";

Chart.defaults.font.family = "Vazirmatn";
Chart.defaults.font.size = 13;
let authToken = localStorage.getItem("authToken");
let lastPrice = null;
let currentPage = 1;
let totalPages = 1;

const priceHistory = [];
const MAX_PRICE_POINTS = 100;

const authSection = document.getElementById("auth-section");
const dashboardSection = document.getElementById("dashboard-section");

let priceChart = null;
let historyChart = null;


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

// --- Tabs ---

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
  refreshTransactions();
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
  // Destroy any existing chart instances before creating new ones,
  // to avoid the "Canvas is already in use" error on repeated logins.
  if (priceChart) {
    priceChart.destroy();
  }
  if (historyChart) {
    historyChart.destroy();
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

  const historyCtx = document.getElementById("history-chart");
  historyChart = new Chart(historyCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: [],
        },
      ],
    },
    options: {
      responsive: true,
      
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#94a3b8" } },
        y: { ticks: { color: "#94a3b8" } },
      },
    },
  });
}

// --- Price ---

async function refreshPrice() {
  const data = await apiRequest("/price");
  const priceEl = document.getElementById("price-value");

  priceEl.textContent = `${formatNumber(data.price)} تومان`;

  priceEl.classList.remove("price-up", "price-down");

  if (lastPrice !== null) {
    priceEl.classList.add(
      data.price > lastPrice ? "price-up" : "price-down"
    );
  }

  lastPrice = data.price;

  const now = new Date().toLocaleTimeString("fa-IR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  priceHistory.push({
    time: now,
    price: data.price,
  });

  if (priceHistory.length > MAX_PRICE_POINTS) {
    priceHistory.shift();
  }

  priceChart.data.labels = priceHistory.map(
    (p) => p.time
  );

  priceChart.data.datasets[0].data = priceHistory.map(
    (p) => p.price
  );

  priceChart.update();
}
setInterval(refreshPrice, 5000);

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

// --- Transaction history (chart + pagination) ---

async function refreshTransactions() {
  const data = await apiRequest(`/transactions?page=${currentPage}&limit=20`);
  totalPages = data.totalPages || 1;

  const labels = data.transactions.map((tx) => {
    const label = tx.type === "buy" ? "خرید" : "فروش";
    return `${label} ${formatNumber(tx.amount)}`;
  });

  const values = data.transactions.map((tx) => tx.totalToman);
  const colors = data.transactions.map((tx) =>
    tx.type === "buy" ? "#22c55e" : "#ef4444",
  );

  historyChart.data.labels = labels;
  historyChart.data.datasets[0].data = values;
  historyChart.data.datasets[0].backgroundColor = colors;
  historyChart.update();

  document.getElementById("page-indicator").textContent =
    `صفحه ${currentPage} از ${totalPages}`;
  document.getElementById("prev-page-btn").disabled = currentPage <= 1;
  document.getElementById("next-page-btn").disabled = currentPage >= totalPages;
}

document.getElementById("prev-page-btn").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage -= 1;
    refreshTransactions();
  }
});

document.getElementById("next-page-btn").addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage += 1;
    refreshTransactions();
  }
});

// --- Buy / Sell ---

function setTradeMessage(text, isError) {
  const el = document.getElementById("trade-message");
  el.textContent = text;
  el.classList.remove("message-success", "message-error");
  el.classList.add(isError ? "message-error" : "message-success");
}

document.getElementById("buy-btn").addEventListener("click", async (e) => {
  const amount = Number(document.getElementById("trade-amount").value);
  await withButtonLock(e.target, async () => {
    try {
      await apiRequest("/buy", "POST", { amount });
      setTradeMessage("خرید موفق بود", false);
      refreshWallet();
      currentPage = 1;
      refreshTransactions();
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
      refreshWallet();
      currentPage = 1;
      refreshTransactions();
    } catch (error) {
      setTradeMessage(error.message, true);
    }
  });
});
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

  priceChart.data.labels = priceHistory.map(
    (p) => p.time
  );

  priceChart.data.datasets[0].data = priceHistory.map(
    (p) => p.price
  );

  priceChart.update();
}