// ⚠️ SỬA DÒNG NÀY: điền URL Repl của bạn
const API_BASE = "https://271f6cac-2250-4223-959c-da49b06c7d99-00-1wcyf92p2kj2w.pike.replit.dev";

const manHinhLogin = document.getElementById("man-hinh-login");
const manHinhChinh = document.getElementById("man-hinh-chinh");
const inputToken = document.getElementById("input-token");
const nutDangNhap = document.getElementById("nut-dang-nhap");
const loiLogin = document.getElementById("loi-login");
const nutDangXuat = document.getElementById("nut-dang-xuat");
const tenUserEl = document.getElementById("ten-user");
const soXuEl = document.getElementById("so-xu");
const streakEl = document.getElementById("streak-hien-tai");
const danhSachShopEl = document.getElementById("danh-sach-shop");

function luuToken(token) { localStorage.setItem("nabstore_token", token); }
function layTokenDaLuu() { return localStorage.getItem("nabstore_token"); }
function xoaToken() { localStorage.removeItem("nabstore_token"); }

function goiApi(duongDan, tuyChon = {}) {
  const token = layTokenDaLuu();
  const options = {
    method: tuyChon.method || "GET",
    headers: { "Content-Type": "application/json" },
  };
  if (token) options.headers.Authorization = `Bearer ${token}`;
  if (tuyChon.body) options.body = JSON.stringify(tuyChon.body);
  return fetch(`${API_BASE}${duongDan}`, options).then(async (res) => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Có lỗi xảy ra");
    return data;
  });
}

async function dangNhap(token) {
  loiLogin.textContent = "";
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await res.json();
    if (!res.ok) {
      loiLogin.textContent = data.error || "Đăng nhập thất bại.";
      return;
    }
    luuToken(token);
    hienThiManHinhChinh(data);
    taiDanhSachShop();
  } catch (err) {
    loiLogin.textContent = "Không kết nối được tới server. Kiểm tra API_BASE trong script_part1.js.";
  }
}

function hienThiManHinhChinh(data) {
  manHinhLogin.style.display = "none";
  manHinhChinh.style.display = "block";
  tenUserEl.textContent = data.username || data.user_id;
  soXuEl.textContent = (data.xu ?? 0).toLocaleString();
  streakEl.textContent = data.streak ?? 0;
}

nutDangNhap.addEventListener("click", () => {
  const token = inputToken.value.trim();
  if (!token) { loiLogin.textContent = "Vui lòng nhập token."; return; }
  dangNhap(token);
});

inputToken.addEventListener("keydown", (e) => { if (e.key === "Enter") nutDangNhap.click(); });

nutDangXuat.addEventListener("click", () => {
  xoaToken();
  manHinhChinh.style.display = "none";
  manHinhLogin.style.display = "flex";
  inputToken.value = "";
});

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add("active");

    // Tự tải dữ liệu khi mở tab (các hàm này định nghĩa ở script_part2.js)
    if (btn.dataset.tab === "lsmua" && typeof taiLichSuMua === "function") taiLichSuMua();
    if (btn.dataset.tab === "bxh" && typeof taiBangXepHang === "function") taiBangXepHang();
  });
});

async function taiDanhSachShop() {
  try {
    const data = await goiApi("/api/shop");
    danhSachShopEl.innerHTML = "";
    (data.products || []).forEach((sp) => {
      const the = document.createElement("div");
      the.className = "the-san-pham";
      let tonKhoHtml = "";
      if (sp.ton_kho !== null && sp.ton_kho !== undefined) {
        tonKhoHtml = `<div class="ton-kho">📦 Còn ${sp.ton_kho}</div>`;
      }
      the.innerHTML = `
        <h3>${sp.ten}</h3>
        <div class="gia">💰 ${Number(sp.gia).toLocaleString()} Bxu</div>
        ${sp.mo_ta ? `<div class="mo-ta">${sp.mo_ta}</div>` : ""}
        ${tonKhoHtml}
        <input type="number" min="1" value="1" class="input-soluong-mua" data-id="${sp.id}" />
        <button class="nut-mua-ngay" data-id="${sp.id}">Mua Ngay</button>
      `;
      danhSachShopEl.appendChild(the);
    });

    document.querySelectorAll(".nut-mua-ngay").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        const inputSl = document.querySelector(`.input-soluong-mua[data-id="${id}"]`);
        const soluong = parseInt(inputSl.value, 10) || 1;
        btn.disabled = true;
        btn.textContent = "Đang xử lý...";
        try {
          const ketQua = await goiApi("/api/muasp", { method: "POST", body: { san_pham_id: id, soluong } });
          alert(`✅ Mua thành công! Mã đơn: ${ketQua.ma_don}. Admin sẽ xử lý sớm.`);
          if (ketQua.xu_con_lai !== null) soXuEl.textContent = ketQua.xu_con_lai.toLocaleString();
        } catch (err) {
          alert(`❌ ${err.message}`);
        }
        btn.disabled = false;
        btn.textContent = "Mua Ngay";
      });
    });
  } catch (err) {
    danhSachShopEl.innerHTML = "<p>Không tải được danh sách sản phẩm.</p>";
  }
}

const nutDiemDanh = document.getElementById("nut-diem-danh");
const ketQuaDnhn = document.getElementById("ket-qua-dnhn");

nutDiemDanh.addEventListener("click", async () => {
  ketQuaDnhn.textContent = "Đang xử lý...";
  ketQuaDnhn.style.color = "#ccc";
  try {
    const data = await goiApi("/api/dnhn", { method: "POST" });
    ketQuaDnhn.textContent = `🎉 Nhận được ${data.xu_nhan_duoc} Bxu! Tổng: ${data.tong_xu.toLocaleString()} Bxu`;
    ketQuaDnhn.style.color = "#7fd97f";
    streakEl.textContent = data.streak;
    soXuEl.textContent = data.tong_xu.toLocaleString();
  } catch (err) {
    ketQuaDnhn.textContent = err.message;
    ketQuaDnhn.style.color = "#ff5c5c";
  }
});

window.addEventListener("DOMContentLoaded", () => {
  const tokenDaLuu = layTokenDaLuu();
  if (tokenDaLuu) dangNhap(tokenDaLuu);
});
