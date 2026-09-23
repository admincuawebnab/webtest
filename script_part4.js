// ---- Theo dõi thời điểm đăng nhập thành công để chạy các bước sau đó ----
const _manHinhChinhEl = document.getElementById("man-hinh-chinh");
let _daXuLySauDangNhap = false;

const _observerDangNhap = new MutationObserver(() => {
  if (_manHinhChinhEl.style.display === "block" && !_daXuLySauDangNhap) {
    _daXuLySauDangNhap = true;
    xuLySauKhiDangNhap();
  }
  if (_manHinhChinhEl.style.display === "none") {
    _daXuLySauDangNhap = false;
  }
});
_observerDangNhap.observe(_manHinhChinhEl, { attributes: true, attributeFilter: ["style"] });

async function xuLySauKhiDangNhap() {
  const daCoTenWeb = await kiemTraTenWeb();
  if (daCoTenWeb) {
    await kiemTraThongBao();
  }
  // Nếu chưa có tên web, popup đặt tên sẽ tự gọi kiemTraThongBao() sau khi lưu xong
}

// ---- Kiểm tra / hiển thị popup đặt tên hiển thị ----
async function kiemTraTenWeb() {
  try {
    const data = await goiApi("/api/tenweb");
    if (!data.ten_web) {
      document.getElementById("modal-datten").style.display = "flex";
      return false;
    }
    apDungTenHienThi(data.ten_web);
    return true;
  } catch (err) {
    console.error(err);
    return true;
  }
}

function apDungTenHienThi(ten) {
  document.getElementById("ten-user").textContent = ten;
  document.getElementById("avatar-chu-cai").textContent = ten[0].toUpperCase();
}

const nutLuuTenWeb = document.getElementById("nut-luu-ten-web");
const inputTenWeb = document.getElementById("input-ten-web");
const loiTenWeb = document.getElementById("loi-ten-web");

nutLuuTenWeb.addEventListener("click", async () => {
  const ten = inputTenWeb.value.trim();
  if (!ten) {
    loiTenWeb.textContent = "Nhập tên trước đã.";
    loiTenWeb.style.color = "#ff6b6b";
    return;
  }

  try {
    const data = await goiApi("/api/tenweb", { method: "POST", body: { ten } });
    apDungTenHienThi(data.ten_web);
    document.getElementById("modal-datten").style.display = "none";
    await kiemTraThongBao();
  } catch (err) {
    loiTenWeb.textContent = err.message;
    loiTenWeb.style.color = "#ff6b6b";
  }
});

inputTenWeb.addEventListener("keydown", (e) => {
  if (e.key === "Enter") nutLuuTenWeb.click();
});

// ---- Kiểm tra / hiển thị popup thông báo admin ----
async function kiemTraThongBao() {
  try {
    const data = await goiApi("/api/thongbao");
    if (data.noi_dung && data.noi_dung.trim()) {
      document.getElementById("noi-dung-thongbao").textContent = data.noi_dung;
      document.getElementById("modal-thongbao").style.display = "flex";
    }
  } catch (err) {
    console.error(err);
  }
}

document.getElementById("nut-dong-thongbao").addEventListener("click", () => {
  document.getElementById("modal-thongbao").style.display = "none";
});


// ============================================================
// MINI GAME MEMORY - BẢN TEST
// Backend là nơi quyết định bàn chơi, nước đi và phần thưởng.
// Không nhận reward/xu từ client.
// ============================================================

const _mgState = {
  gameId: null,
  mode: null,
  size: 0,
  pairCount: 0,
  matched: new Set(),
  symbols: {},
  busy: false,
  active: false
};

const _mgBoard = document.getElementById("minigame-board");
const _mgGame = document.getElementById("minigame-game");
const _mgMessage = document.getElementById("minigame-thong-bao");
const _mgCooldown = document.getElementById("minigame-cooldown");
const _mgModes = document.getElementById("minigame-chon-do-kho");
const _mgTenDo = document.getElementById("minigame-ten-do");
const _mgTienDo = document.getElementById("minigame-tien-do");
const _mgDung = document.getElementById("minigame-dung");

function mgDatThongBao(text, type = "") {
  _mgMessage.textContent = text || "";
  _mgMessage.className = "minigame-message" + (type ? " " + type : "");
}

function mgFormatTime(seconds) {
  seconds = Math.max(0, Math.ceil(Number(seconds) || 0));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h} giờ ${m} phút`;
  if (m > 0) return `${m} phút ${s} giây`;
  return `${s} giây`;
}

function mgSetCooldown(seconds) {
  if (!seconds || seconds <= 0) {
    _mgCooldown.textContent = "✅ Bạn có thể chơi";
    _mgCooldown.className = "minigame-cooldown ready";
    return;
  }

  _mgCooldown.className = "minigame-cooldown wait";

  const end = Date.now() + Number(seconds) * 1000;

  const update = () => {
    const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
    if (left <= 0) {
      _mgCooldown.textContent = "✅ Hết cooldown, bạn có thể chơi";
      _mgCooldown.className = "minigame-cooldown ready";
      return;
    }
    _mgCooldown.textContent = `⏳ Còn ${mgFormatTime(left)}`;
    setTimeout(update, 1000);
  };

  update();
}

function mgResetLocalState() {
  _mgState.gameId = null;
  _mgState.mode = null;
  _mgState.size = 0;
  _mgState.pairCount = 0;
  _mgState.matched = new Set();
  _mgState.symbols = {};
  _mgState.busy = false;
  _mgState.active = false;
}

function mgUpdateProgress() {
  const matchedPairs = _mgState.matched.size / 2;
  _mgTienDo.textContent = `${matchedPairs} / ${_mgState.pairCount} cặp`;
}

function mgRenderBoard(cardCount) {
  _mgBoard.innerHTML = "";
  _mgBoard.className = "minigame-board " + (_mgState.mode === "hard" ? "minigame-board-hard" : "minigame-board-easy");

  for (let i = 0; i < cardCount; i++) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "minigame-card";
    card.dataset.index = String(i);
    card.textContent = "?";
    card.addEventListener("click", () => mgClickCard(i, card));
    _mgBoard.appendChild(card);
  }
}

function mgCard(index) {
  return _mgBoard.querySelector(`.minigame-card[data-index="${index}"]`);
}

function mgShowCard(index, symbol, extraClass = "") {
  const card = mgCard(index);
  if (!card) return;
  card.textContent = symbol;
  card.classList.add("open");
  if (extraClass) card.classList.add(extraClass);
}

function mgHideCard(index) {
  const card = mgCard(index);
  if (!card) return;
  if (!_mgState.matched.has(index)) {
    card.textContent = "?";
    card.classList.remove("open", "match", "special");
  }
}

function mgMarkMatched(indices) {
  for (const index of indices) {
    _mgState.matched.add(Number(index));
    const card = mgCard(Number(index));
    if (card) card.classList.add("match");
  }
  mgUpdateProgress();
}

function mgRestoreServerState(data) {
  if (!data || !data.game_id) return;

  _mgState.gameId = data.game_id;
  _mgState.mode = data.mode;
  _mgState.size = data.size;
  _mgState.pairCount = data.pair_count;
  _mgState.active = true;
  _mgState.matched = new Set((data.matched_indices || []).map(Number));

  mgRenderBoard(data.card_count);

  for (const item of (data.matched_cards || [])) {
    _mgState.symbols[item.index] = item.symbol;
    mgShowCard(item.index, item.symbol, "match");
  }

  for (const item of (data.revealed_cards || [])) {
    _mgState.symbols[item.index] = item.symbol;
    mgShowCard(item.index, item.symbol);
  }

  mgUpdateProgress();
  _mgTenDo.textContent = data.mode === "hard" ? "🔴 Khó · 10×10" : "🟢 Dễ · 3×3";
  _mgGame.style.display = "block";
  _mgModes.style.display = "none";
}

async function mgKiemTraTrangThai() {
  try {
    const data = await goiApi("/api/minigame/status");
    mgSetCooldown("");
    mgSetCooldown(data.cooldown_seconds || 0);

    if (data.active_game) {
      mgRestoreServerState(data.active_game);
      mgDatThongBao("Bạn đang có một game chưa hoàn thành. Tiếp tục game cũ.", "info");
    }
  } catch (err) {
    console.error("Mini Game status:", err);
  }
}

async function mgBatDau(mode) {
  if (_mgState.busy) return;
  _mgState.busy = true;
  mgDatThongBao("Đang tạo bàn chơi...", "info");

  try {
    const data = await goiApi("/api/minigame/start", {
      method: "POST",
      body: { mode }
    });

    if (data.cooldown_seconds > 0) {
      mgSetCooldown(data.cooldown_seconds);
      mgDatThongBao(`Bạn vẫn đang cooldown: còn ${mgFormatTime(data.cooldown_seconds)}.`, "error");
      return;
    }

    mgRestoreServerState(data);
    mgDatThongBao(
      mode === "hard"
        ? "🔴 Ghép đủ 50 cặp. Kiên nhẫn, con người đã chọn tự làm việc này."
        : "🟢 Ghép 4 cặp và mở ô ⭐ để hoàn thành.",
      "info"
    );
  } catch (err) {
    mgDatThongBao(err.message || "Không thể bắt đầu game.", "error");
  } finally {
    _mgState.busy = false;
  }
}

async function mgClickCard(index, cardEl) {
  if (!_mgState.active || _mgState.busy) return;
  if (_mgState.matched.has(index)) return;
  if (cardEl.classList.contains("open")) return;

  _mgState.busy = true;

  try {
    const data = await goiApi("/api/minigame/move", {
      method: "POST",
      body: {
        game_id: _mgState.gameId,
        index
      }
    });

    if (data.symbol !== undefined) {
      _mgState.symbols[index] = data.symbol;
      mgShowCard(index, data.symbol, data.special ? "special" : "");
    }

    if (data.first_index !== undefined) {
      const first = Number(data.first_index);
      const second = Number(data.second_index);

      if (data.first_symbol !== undefined) {
        _mgState.symbols[first] = data.first_symbol;
        mgShowCard(first, data.first_symbol);
      }

      if (data.second_symbol !== undefined) {
        _mgState.symbols[second] = data.second_symbol;
        mgShowCard(second, data.second_symbol);
      }

      if (data.matched) {
        mgMarkMatched([first, second]);
      } else {
        await new Promise(resolve => setTimeout(resolve, 650));
        mgHideCard(first);
        mgHideCard(second);
      }
    }

    if (data.special) {
      const card = mgCard(index);
      if (card) card.classList.add("special");
    }

    if (data.completed) {
      _mgState.active = false;
      _mgState.busy = false;
      mgMarkMatched(data.matched_indices || []);

      const reward = Number(data.reward || 0);
      mgSetCooldown(data.cooldown_seconds || 43200);
      mgDatThongBao(`🎉 Hoàn thành! Bạn nhận được ${reward.toLocaleString()} Bxu.`, "success");

      const balance = document.getElementById("so-xu");
      if (balance && data.tong_xu !== undefined) {
        balance.textContent = Number(data.tong_xu).toLocaleString();
      }

      _mgDung.style.display = "none";
      return;
    }

    mgUpdateProgress();
  } catch (err) {
    mgDatThongBao(err.message || "Nước đi không hợp lệ.", "error");
  } finally {
    _mgState.busy = false;
  }
}

_mgModes.querySelectorAll(".minigame-mode-btn").forEach((btn) => {
  btn.addEventListener("click", () => mgBatDau(btn.dataset.mode));
});

_mgDung.addEventListener("click", () => {
  if (_mgState.busy) return;
  mgResetLocalState();
  _mgBoard.innerHTML = "";
  _mgGame.style.display = "none";
  _mgModes.style.display = "grid";
  _mgDung.style.display = "block";
  mgDatThongBao("Đã dừng game. Phiên chưa hoàn thành sẽ tự hết hạn sau một thời gian.", "info");
});

// Vì hệ thống tab cũ đã có sẵn, chỉ cần theo dõi lúc mở Mini Game để lấy trạng thái.
// Không thay đổi logic chuyển tab cũ.
document.querySelectorAll('.tab-btn[data-tab="minigame"]').forEach((btn) => {
  btn.addEventListener("click", () => {
    mgKiemTraTrangThai();
  });
});
