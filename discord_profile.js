/* NAB STORE - Discord profile link (additive; keeps NAB token login) */
(() => {
  const API_BASE_DISCORD = "https://nab.freesrv.com";
  const WEBTEST_URL = "https://admincuawebnab.github.io/webtest/";
  const getToken = () => localStorage.getItem("nabstore_token");
  const api = async (path, options = {}) => {
    const headers = { "Content-Type": "application/json" };
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${API_BASE_DISCORD}${path}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `API lỗi (${res.status})`);
    return data;
  };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

  function ensureCard() {
    const host = document.getElementById("danh-sach-ttcn");
    if (!host || document.getElementById("nab-discord-card")) return;
    const card = document.createElement("section");
    card.id = "nab-discord-card";
    card.className = "nab-discord-card";
    card.innerHTML = `
      <div class="nab-discord-banner" id="nab-discord-banner"><span>DISCORD PROFILE</span></div>
      <div class="nab-discord-body">
        <div class="nab-discord-avatar" id="nab-discord-avatar">N</div>
        <div class="nab-discord-user"><strong id="nab-discord-name">Chưa liên kết Discord</strong><span id="nab-discord-tag">Liên kết để hiển thị hồ sơ Discord của bạn</span><code id="nab-discord-id" hidden></code></div>
        <button type="button" class="nab-discord-button" id="nab-discord-link">LIÊN KẾT DISCORD ↗</button>
      </div>
      <p class="nab-discord-status" id="nab-discord-status" role="status"></p>`;
    host.prepend(card);
    document.getElementById("nab-discord-link").addEventListener("click", async () => {
      const button = document.getElementById("nab-discord-link");
      const status = document.getElementById("nab-discord-status");
      button.disabled = true;
      status.textContent = "Đang tạo liên kết an toàn...";
      try {
        const result = await api("/api/discord/link/start", { method: "POST", body: "{}" });
        if (!result.url) throw new Error("Backend chưa trả về đường dẫn Discord.");
        window.location.href = result.url;
      } catch (e) {
        status.textContent = e.message;
        button.disabled = false;
      }
    });
    loadProfile();
  }

  async function loadProfile() {
    const status = document.getElementById("nab-discord-status");
    if (!status) return;
    const params = new URLSearchParams(window.location.search);
    const result = params.get("discord_link");
    if (result === "success") status.textContent = "Liên kết Discord thành công. Đang tải hồ sơ...";
    if (result === "error") status.textContent = "Không thể liên kết Discord: " + (params.get("reason") || "thử lại sau");
    if (!getToken()) { status.textContent = "Đăng nhập NAB bằng token trước khi liên kết Discord."; return; }
    try {
      const data = await api("/api/discord/profile");
      if (!data.linked || !data.profile) {
        document.getElementById("nab-discord-name").textContent = "Chưa liên kết Discord";
        document.getElementById("nab-discord-tag").textContent = "Nhấn nút để liên kết tài khoản Discord";
        return;
      }
      const p = data.profile;
      document.getElementById("nab-discord-name").textContent = p.global_name || p.username || "Discord user";
      document.getElementById("nab-discord-tag").textContent = p.username ? `@${p.username}` : "Tài khoản Discord";
      const idEl = document.getElementById("nab-discord-id");
      idEl.hidden = false; idEl.textContent = `ID: ${p.id}`;
      const avatar = document.getElementById("nab-discord-avatar");
      if (p.avatar_url) { avatar.innerHTML = `<img src="${esc(p.avatar_url)}" alt="Discord avatar">`; }
      else avatar.textContent = (p.global_name || p.username || "D").slice(0, 1).toUpperCase();
      const banner = document.getElementById("nab-discord-banner");
      if (p.banner_url) { banner.style.backgroundImage = `linear-gradient(0deg,rgba(0,0,0,.18),rgba(0,0,0,.05)),url("${p.banner_url}")`; banner.classList.add("has-banner"); }
      document.getElementById("nab-discord-link").textContent = "ĐÃ LIÊN KẾT ✓";
      document.getElementById("nab-discord-link").disabled = true;
      status.textContent = "Hồ sơ Discord đã được liên kết với tài khoản NAB này.";
      if (result) { history.replaceState({}, document.title, window.location.pathname); }
    } catch (e) { status.textContent = `Chưa tải được hồ sơ Discord: ${e.message}`; }
  }

  function boot() {
    const host = document.getElementById("danh-sach-ttcn");
    if (!host) return;
    const observer = new MutationObserver(() => {
      if (!document.getElementById("nab-discord-card")) ensureCard();
      else loadProfile();
    });
    observer.observe(host, { childList: true });
    ensureCard();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
  window.addEventListener("focus", loadProfile);
})();
