// ---- Nạp Thẻ ----
const selectLoaiThe = document.getElementById("select-loai-the");
const selectMenhGia = document.getElementById("select-menh-gia");
const inputMaThe = document.getElementById("input-ma-the");
const inputSoSeri = document.getElementById("input-so-seri");
const nutNapThe = document.getElementById("nut-nap-the");
const ketQuaNapthe = document.getElementById("ket-qua-napthe");

nutNapThe.addEventListener("click", async () => {
  const ma_the = inputMaThe.value.trim();
  const so_seri = inputSoSeri.value.trim();

  if (!ma_the || !so_seri) {
    ketQuaNapthe.textContent = "Nhập đầy đủ mã thẻ và số seri.";
    ketQuaNapthe.style.color = "#ff6b6b";
    return;
  }

  ketQuaNapthe.textContent = "Đang gửi yêu cầu...";
  ketQuaNapthe.style.color = "#ccc";
  try {
    const data = await goiApi("/api/napthe", {
      method: "POST",
      body: {
        loai_the: selectLoaiThe.value,
        menh_gia: parseInt(selectMenhGia.value, 10),
        ma_the,
        so_seri,
      },
    });
    ketQuaNapthe.textContent = `✅ Đã gửi yêu cầu! Mã: ${data.ma_yeu_cau}. Admin sẽ kiểm tra sớm.`;
    ketQuaNapthe.style.color = "#7fd97f";
    inputMaThe.value = "";
    inputSoSeri.value = "";
  } catch (err) {
    ketQuaNapthe.textContent = err.message;
    ketQuaNapthe.style.color = "#ff6b6b";
  }
});

// ---- Nạp Bank ----
const inputSoTienBank = document.getElementById("input-so-tien-bank");
const inputGhichuBank = document.getElementById("input-ghichu-bank");
const nutNapBank = document.getElementById("nut-nap-bank");
const ketQuaNapbank = document.getElementById("ket-qua-napbank");

nutNapBank.addEventListener("click", async () => {
  const so_tien = parseInt(inputSoTienBank.value, 10);

  if (!so_tien || so_tien <= 0) {
    ketQuaNapbank.textContent = "Nhập số tiền hợp lệ.";
    ketQuaNapbank.style.color = "#ff6b6b";
    return;
  }

  ketQuaNapbank.textContent = "Đang gửi yêu cầu...";
  ketQuaNapbank.style.color = "#ccc";
  try {
    const data = await goiApi("/api/napbank", {
      method: "POST",
      body: { so_tien, ghi_chu: inputGhichuBank.value.trim() },
    });
    ketQuaNapbank.textContent = `✅ Đã gửi yêu cầu! Mã: ${data.ma_yeu_cau}. Admin sẽ kiểm tra sớm.`;
    ketQuaNapbank.style.color = "#7fd97f";
    inputSoTienBank.value = "";
    inputGhichuBank.value = "";
  } catch (err) {
    ketQuaNapbank.textContent = err.message;
    ketQuaNapbank.style.color = "#ff6b6b";
  }
});

// ---- Thông Tin Cá Nhân ----
async function taiThongTinCaNhan() {
  const el = document.getElementById("danh-sach-ttcn");
  el.innerHTML = "Đang tải...";
  try {
    const data = await goiApi("/api/ttcn");
    el.innerHTML = `
      <div class="dong-list"><div class="trai">💰 Số Bxu</div><div class="phai">${Number(data.xu).toLocaleString()}</div></div>
      <div class="dong-list"><div class="trai">🔥 Streak điểm danh</div><div class="phai">${data.streak} ngày</div></div>
      <div class="dong-list"><div class="trai">🏆 Hạng BXH</div><div class="phai">${data.hang ? "#" + data.hang : "Chưa có hạng"}</div></div>
      <div class="dong-list"><div class="trai">🛍️ Tổng đơn đã mua</div><div class="phai">${data.so_don} đơn</div></div>
    `;
  } catch (err) {
    el.innerHTML = `<p>${err.message}</p>`;
  }
}

document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.tab === "ttcn") taiThongTinCaNhan();
  });
});
