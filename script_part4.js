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
