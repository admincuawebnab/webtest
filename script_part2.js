// ---- Lịch sử mua hàng ----
async function taiLichSuMua() {
  const el = document.getElementById("danh-sach-lsmua");
  el.innerHTML = "Đang tải...";
  try {
    const data = await goiApi("/api/lsmua");
    const orders = data.orders || [];
    if (orders.length === 0) {
      el.innerHTML = "<p>Bạn chưa có đơn hàng nào.</p>";
      return;
    }
    const nhanTrangThai = { cho_xu_ly: "⏳ Chờ xử lý", hoan_thanh: "✅ Hoàn thành", tu_choi: "❌ Đã từ chối" };
    el.innerHTML = orders.map((don) => `
      <div class="dong-list">
        <div class="trai">
          <b>#${don.id} — ${don.ten_san_pham}</b><br/>
          <span style="color:#a0a0a0; font-size:12px;">SL: ${don.so_luong} · ${nhanTrangThai[don.trang_thai] || "?"}</span>
        </div>
        <div class="phai">${Number(don.tong_tien).toLocaleString()} Bxu</div>
      </div>
    `).join("");
  } catch (err) {
    el.innerHTML = `<p>${err.message}</p>`;
  }
}

// ---- Chuyển Bxu ----
const inputNguoinhanId = document.getElementById("input-nguoinhan-id");
const inputSoluongChuyen = document.getElementById("input-soluong-chuyen");
const nutChuyenBxu = document.getElementById("nut-chuyen-bxu");
const ketQuaChuyenbxu = document.getElementById("ket-qua-chuyenbxu");

nutChuyenBxu.addEventListener("click", async () => {
  const nguoinhan_id = inputNguoinhanId.value.trim();
  const soluong = parseInt(inputSoluongChuyen.value, 10);

  if (!nguoinhan_id || !soluong || soluong <= 0) {
    ketQuaChuyenbxu.textContent = "Nhập đầy đủ Discord ID và số lượng hợp lệ.";
    ketQuaChuyenbxu.style.color = "#ff5c5c";
    return;
  }

  ketQuaChuyenbxu.textContent = "Đang xử lý...";
  ketQuaChuyenbxu.style.color = "#ccc";
  try {
    const data = await goiApi("/api/chuyenbxu", { method: "POST", body: { nguoi_nhan_id: nguoinhan_id, soluong } });
    ketQuaChuyenbxu.textContent = `✅ Đã chuyển thành công! Mã GD: ${data.ma_gd}`;
    ketQuaChuyenbxu.style.color = "#7fd97f";
    document.getElementById("so-xu").textContent = data.xu_con_lai.toLocaleString();
    inputNguoinhanId.value = "";
    inputSoluongChuyen.value = "";
  } catch (err) {
    ketQuaChuyenbxu.textContent = err.message;
    ketQuaChuyenbxu.style.color = "#ff5c5c";
  }
});

// ---- Nhập code ----
const inputMaCode = document.getElementById("input-ma-code");
const nutNhapCode = document.getElementById("nut-nhap-code");
const ketQuaNhapcode = document.getElementById("ket-qua-nhapcode");

nutNhapCode.addEventListener("click", async () => {
  const ma = inputMaCode.value.trim();
  if (!ma) {
    ketQuaNhapcode.textContent = "Nhập mã code trước đã.";
    ketQuaNhapcode.style.color = "#ff5c5c";
    return;
  }

  ketQuaNhapcode.textContent = "Đang xử lý...";
  ketQuaNhapcode.style.color = "#ccc";
  try {
    const data = await goiApi("/api/nhapcode", { method: "POST", body: { ma } });
    ketQuaNhapcode.textContent = `🎉 Nhận được ${data.xu_nhan_duoc} Bxu! Tổng: ${data.tong_xu.toLocaleString()} Bxu`;
    ketQuaNhapcode.style.color = "#7fd97f";
    document.getElementById("so-xu").textContent = data.tong_xu.toLocaleString();
    inputMaCode.value = "";
  } catch (err) {
    ketQuaNhapcode.textContent = err.message;
    ketQuaNhapcode.style.color = "#ff5c5c";
  }
});

// ---- Bảng xếp hạng (tự phát sáng dòng của mình) ----
async function taiBangXepHang() {
  const el = document.getElementById("danh-sach-bxh");
  el.innerHTML = "Đang tải...";
  try {
    const [data, thongTinToi] = await Promise.all([
      goiApi("/api/bxh"),
      goiApi("/api/me").catch(() => null),
    ]);
    const top = data.top || [];
    const idCuaToi = thongTinToi ? String(thongTinToi.user_id) : null;

    if (top.length === 0) {
      el.innerHTML = "<p>Chưa có ai có Bxu để xếp hạng.</p>";
      return;
    }
    const huyChuong = ["🥇", "🥈", "🥉"];
    el.innerHTML = top.map((muc, i) => {
      const laCuaToi = idCuaToi && String(muc.user_id) === idCuaToi;
      return `
        <div class="dong-list ${laCuaToi ? "dong-cua-toi" : ""}">
          <div class="trai"><span class="hang">${huyChuong[i] || `#${i + 1}`}</span>${muc.username}${laCuaToi ? " <span class=\"nhan-ban\">(bạn)</span>" : ""}</div>
          <div class="phai">${Number(muc.xu).toLocaleString()} Bxu</div>
        </div>
      `;
    }).join("");
  } catch (err) {
    el.innerHTML = `<p>${err.message}</p>`;
  }
}
