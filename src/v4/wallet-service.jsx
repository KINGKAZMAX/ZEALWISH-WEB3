// ZEALWISH v4 wallet service.
// Browser-only OKX/EIP-1193 adapter for wallet-owned character passport UX.

(function initZealwishWallet() {
  if (window.ZEALWISH_WALLET?.connect && window.ZEALWISH_API?.chat) return;
  const STORAGE_KEY = "zealwish.wallet.publicState";

  const ZEALWISH_DEFAULT_LOCAL_API_BASE = "http://127.0.0.1:7291/api";

  function trimTrailingSlash(value) {
    return String(value || "").replace(/\/+$/, "");
  }

  function resolveApiBase() {
    const explicit = window.ZEALWISH_API_BASE || localStorage.getItem("zealwish.apiBase");
    if (explicit) return trimTrailingSlash(explicit);

    const host = window.location?.hostname || "";
    const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";
    // Local dev keeps the standalone API server; any deployed origin calls its
    // own serverless functions at same-origin /api.
    if (isLocalhost) return ZEALWISH_DEFAULT_LOCAL_API_BASE;

    return "/api";
  }

  function withLeadingSlash(path) {
    return String(path || "").startsWith("/") ? path : `/${path}`;
  }

  async function fetchHttpApi(path, options = {}, timeoutMs = 30000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(`${resolveApiBase()}${withLeadingSlash(path)}`, {
        ...options,
        signal: controller.signal,
      });
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(text || `HTTP ${response.status}`);
      }
      return response.json();
    } finally {
      clearTimeout(timer);
    }
  }

  function getHttpApi(path, timeoutMs = 10000) {
    return fetchHttpApi(path, {}, timeoutMs);
  }

  function postHttpApi(path, body, timeoutMs = 60000) {
    return fetchHttpApi(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    }, timeoutMs);
  }
  const listeners = new Set();
  const announcedProviders = [];

  let selectedProvider = null;
  let state = {
    status: "idle",
    providerName: "OKX Wallet",
    address: "",
    chainId: "",
    error: "",
  };

  function isOkxInfo(info = {}) {
    const name = String(info.name || "").toLowerCase();
    const rdns = String(info.rdns || "").toLowerCase();
    return name.includes("okx") || name.includes("okex") || rdns.includes("okx") || rdns.includes("okex");
  }

  function isOkxProvider(provider) {
    return Boolean(provider?.isOkxWallet || provider?.isOKExWallet || provider?.isOKXWallet);
  }

  function emit() {
    const snapshot = getState();
    listeners.forEach((listener) => {
      try { listener(snapshot); } catch (error) { console.warn("[ZEALWISH_WALLET] listener failed", error); }
    });
  }

  function savePublicState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        providerName: state.providerName,
        address: state.address,
        chainId: state.chainId,
      }));
    } catch {}
  }

  function loadPublicState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
      if (saved?.address) {
        state = {
          ...state,
          status: "idle",
          providerName: saved.providerName || "OKX Wallet",
          address: saved.address || "",
          chainId: saved.chainId || "",
        };
      }
    } catch {}
  }

  function update(next) {
    state = { ...state, ...next };
    savePublicState();
    emit();
  }

  function formatAddress(address = state.address) {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  function providerLabel(provider, info) {
    if (info?.name) return info.name;
    if (provider === window.okxwallet || isOkxProvider(provider)) return "OKX Wallet";
    return "Injected Wallet";
  }

  function rememberAnnouncedProvider(event) {
    const detail = event?.detail;
    if (!detail?.provider) return;
    const exists = announcedProviders.some((item) => item.provider === detail.provider);
    if (!exists) announcedProviders.push(detail);
  }

  function requestEip6963Providers() {
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  function findProvider() {
    if (window.okxwallet?.request) {
      return { provider: window.okxwallet, info: { name: "OKX Wallet", rdns: "com.okx.wallet" } };
    }

    const okxAnnounced = announcedProviders.find((item) => isOkxInfo(item.info));
    if (okxAnnounced?.provider?.request) return okxAnnounced;

    const injectedProviders = window.ethereum?.providers || [];
    const okxInjected = injectedProviders.find((provider) => isOkxProvider(provider));
    if (okxInjected?.request) {
      return { provider: okxInjected, info: { name: "OKX Wallet", rdns: "com.okx.wallet" } };
    }

    if (window.ethereum?.request) {
      return { provider: window.ethereum, info: { name: "Injected Wallet" } };
    }

    return null;
  }

  function bindProviderEvents(provider) {
    if (!provider || provider.__zealwishWalletBound) return;
    provider.__zealwishWalletBound = true;

    provider.on?.("accountsChanged", (accounts = []) => {
      const address = Array.isArray(accounts) ? accounts[0] : "";
      update({
        status: address ? "connected" : "idle",
        address: address || "",
        error: "",
      });
    });

    provider.on?.("chainChanged", (chainId) => {
      update({ chainId: chainId || "", error: "" });
    });

    provider.on?.("disconnect", () => {
      disconnect();
    });
  }

  async function connect() {
    update({ status: "connecting", error: "" });
    requestEip6963Providers();

    const match = findProvider();
    if (!match?.provider?.request) {
      update({
        status: "error",
        error: "OKX Wallet was not detected. Install or unlock OKX Wallet, then try again.",
      });
      return getState();
    }

    selectedProvider = match.provider;
    bindProviderEvents(selectedProvider);

    try {
      const accounts = await selectedProvider.request({ method: "eth_requestAccounts" });
      const address = Array.isArray(accounts) ? accounts[0] : "";
      const chainId = await selectedProvider.request({ method: "eth_chainId" }).catch(() => "");

      update({
        status: address ? "connected" : "idle",
        providerName: providerLabel(selectedProvider, match.info),
        address: address || "",
        chainId: chainId || "",
        error: address ? "" : "No wallet account was returned.",
      });
      return getState();
    } catch (error) {
      update({
        status: "error",
        providerName: providerLabel(selectedProvider, match.info),
        error: error?.message || "Wallet connection was rejected.",
      });
      return getState();
    }
  }

  async function signMessage(message) {
    const clean = String(message || "");
    if (!clean) throw new Error("Nothing to sign.");
    let provider = selectedProvider;
    if (!provider?.request) {
      requestEip6963Providers();
      provider = findProvider()?.provider || null;
    }
    if (!provider?.request) throw new Error("Connect a wallet before signing.");
    let address = state.address;
    if (!address) {
      const accounts = await provider.request({ method: "eth_requestAccounts" });
      address = Array.isArray(accounts) ? accounts[0] : "";
    }
    if (!address) throw new Error("Connect a wallet before signing.");
    const hexMessage = `0x${Array.from(new TextEncoder().encode(clean))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("")}`;
    return provider.request({ method: "personal_sign", params: [hexMessage, address] });
  }

  function disconnect() {
    selectedProvider = null;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    state = {
      status: "idle",
      providerName: "OKX Wallet",
      address: "",
      chainId: "",
      error: "",
    };
    emit();
    return getState();
  }

  function getState() {
    return { ...state, shortAddress: formatAddress(state.address) };
  }

  function onChange(callback) {
    if (typeof callback !== "function") return () => {};
    listeners.add(callback);
    callback(getState());
    return () => listeners.delete(callback);
  }

  window.addEventListener("eip6963:announceProvider", rememberAnnouncedProvider);
  loadPublicState();
  requestEip6963Providers();


  window.ZEALWISH_API = {
    resolveApiBase,
    getHttpApi,
    postHttpApi,
    health: () => getHttpApi("/health", 4000),
    runtimeStatus: () => getHttpApi("/runtime-status", 4000),
    chat: (payload) => postHttpApi("/chat", payload, 45000),
    generateImage: (payload) => postHttpApi("/generate-image", payload, 120000),
    speak: (payload) => postHttpApi("/speak", payload, 45000),
  };

  window.ZEALWISH_WALLET = {
    getState,
    connect,
    disconnect,
    onChange,
    formatAddress,
    signMessage,
    requestEip6963Providers,
  };
})();
