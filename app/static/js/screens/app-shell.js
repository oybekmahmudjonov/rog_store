export function renderAppShell() {
  return `
    <div id="intro">
      <div class="ib"></div>
      <video id="introVideo" autoplay playsinline preload="auto"></video>
      <div class="scan"></div>
      <div class="icorner"><span></span><span></span><span></span><span></span></div>
      <button class="iskip" id="skipIntroBtn">SKIP</button>
    </div>

    <div id="app">
      <nav>
        <div class="nbrand">
          <svg width="20" height="20" viewBox="0 0 40 40"><polygon points="20,2 38,12 38,28 20,38 2,28 2,12" fill="none" stroke="#ff0020" stroke-width="2"/><ellipse cx="20" cy="20" rx="7" ry="4.5" fill="#ff0020"/><circle cx="20" cy="20" r="3" fill="#000"/><circle cx="20" cy="20" r="1.5" fill="#ff0020"/></svg>
          ROG STORE <div class="dot"></div>
        </div>
        <button class="nbtn red" id="openAdminBtn">ADMIN</button>
      </nav>

      <section class="hero">
        <div class="htag">Premium Gaming Laptops</div>
        <h1>GAMING<br>POWERHOUSE</h1>
        <p>O\'zbekistan eng yaxshi gaming noutbuk do'koni. 1 yil kafolat va rasmiy narxlar.</p>
        <div class="hstats">
          <div class="hstat"><div class="hnum" id="statCount">0</div><div class="hlbl">Laptops</div></div>
          <div class="hstat"><div class="hnum">1YIL</div><div class="hlbl">Kafolat</div></div>
          <div class="hstat"><div class="hnum">24/7</div><div class="hlbl">Support</div></div>
        </div>
      </section>

      <div class="fbar" id="filterBar">
        <button class="chip on" data-filter="all">Barchasi</button>
        <button class="chip" data-filter="rtx">RTX GPU</button>
        <button class="chip" data-filter="i7">Core i7+</button>
        <button class="chip" data-filter="oled">OLED</button>
        <button class="chip" data-filter="budget">&lt; $800</button>
      </div>

      <div class="shead">Mahsulotlar</div>
      <section class="catalog" id="catalog"></section>
      <div id="emptyState" class="empty" hidden>
        <div class="ei">Laptop</div>
        <p>Hozircha mahsulot yo'q.<br>Admin paneldan qo'shing.</p>
      </div>

      <footer>
        <div class="flinks">
          <a href="https://t.me/noutbuk_kompyuter" target="_blank" class="flink">Telegram</a>
          <a href="https://t.me/noteboks_uz" target="_blank" class="flink">Guruh</a>
          <a href="https://www.instagram.com/noutbuk_kompyuter" target="_blank" class="flink">Instagram</a>
          <a href="tel:+998979660595" class="flink">+998 97 966 0595</a>
        </div>
        <div class="fcopy">© 2026 ROG STORE - NOUTBUK & KOMPYUTER</div>
      </footer>
    </div>

    <div class="moverlay" id="detailModal">
      <div class="modal">
        <div class="mhdr">
          <div class="mhdr-title" id="mTitle">-</div>
          <button class="mclose" id="closeDetailBtn">X</button>
        </div>
        <div class="mimg-row" id="mImgs"></div>
        <div class="mbody" id="mBody"></div>
      </div>
    </div>

    <div class="aoverlay" id="adminOverlay">
      <div class="apanel">
        <div id="adminLogin">
          <div class="lbox">
            <div class="licon">Admin</div>
            <div class="ltitle">Admin Panel</div>
            <div class="lsub">Kirish uchun parolni kiriting</div>
            <div class="fg"><input class="fi" type="password" id="adminPass" placeholder="********"></div>
            <button class="btn-sub" id="loginBtn">KIRISH</button>
            <button class="btn-ghost" id="cancelAdminBtn">Bekor qilish</button>
          </div>
        </div>

        <div id="adminDash" hidden>
          <div class="ahdr">
            <div class="atitle">ADMIN <span>PANEL</span></div>
            <button class="btn-ghost slim-btn" id="closeAdminBtn">X CHIQISH</button>
          </div>

          <div class="fbstatus ok" id="backendStatus">
            <span>●</span> Supabase backend tayyor - Database + Storage orqali ishlaydi
          </div>
          <div class="dashboard-grid">
            <div class="dashboard-col">
              <div class="wbox">
                <div class="wtitle"><span class="wdot"></span> Telegram Bot Sozlamalari</div>
                <div class="fg">
                  <label class="fl">Bot Token</label>
                  <input class="fi" type="text" id="botToken" placeholder="1234567890:AAF...">
                </div>
                <div class="fg">
                  <label class="fl">Kanal / Guruh ID</label>
                  <input class="fi" type="text" id="channelId" placeholder="@noutbuk_kompyuter yoki -1001234567890">
                </div>
                <div class="fg">
                  <label class="fl">Webhook URL</label>
                  <div class="wurl" id="wurl">https://your-server.com/webhook</div>
                </div>
                <button class="btn-sub mini-btn" id="webhookBtn">WEBHOOK ULASH</button>
              </div>

              <div class="slbl">Mavjud mahsulotlar</div>
              <div id="manageList"></div>
            </div>

            <div class="dashboard-col">
              <div class="slbl">Yangi mahsulot</div>
              <form id="productForm">
                <div class="fg"><label class="fl">Mahsulot ID #</label><input class="fi" type="text" name="productId" placeholder="1238"></div>
                <div class="fg"><label class="fl">Nomi *</label><input class="fi" type="text" name="name" placeholder="Gigabyte Aero 16" required></div>
                <div class="frow">
                  <div class="fg"><label class="fl">Narx ($) *</label><input class="fi" type="number" name="price" placeholder="899" required></div>
                  <div class="fg">
                    <label class="fl">Kafolat</label>
                    <select class="fsel" name="warranty">
                      <option>1 Yil</option>
                      <option>6 Oy</option>
                      <option>2 Yil</option>
                      <option>Kafolatsiz</option>
                    </select>
                  </div>
                </div>
                <div class="frow">
                  <div class="fg"><label class="fl">CPU</label><input class="fi" type="text" name="cpu" placeholder="Core i7-12700H"></div>
                  <div class="fg"><label class="fl">RAM</label><input class="fi" type="text" name="ram" placeholder="24GB DDR5"></div>
                </div>
                <div class="frow">
                  <div class="fg"><label class="fl">GPU</label><input class="fi" type="text" name="gpu" placeholder="RTX 3070Ti 8GB"></div>
                  <div class="fg"><label class="fl">SSD</label><input class="fi" type="text" name="ssd" placeholder="1TB M.2 NVMe"></div>
                </div>
                <div class="frow">
                  <div class="fg"><label class="fl">Ekran</label><input class="fi" type="text" name="screen" placeholder='16.0" 4K OLED'></div>
                  <div class="fg"><label class="fl">OS</label><input class="fi" type="text" name="os" placeholder="Windows 11 Pro"></div>
                </div>
                <div class="fg"><label class="fl">Xususiyatlar (vergul bilan)</label><input class="fi" type="text" name="features" placeholder="RGB Klaviatura, Metal Korpus, Face ID"></div>
                <div class="fg"><label class="fl">Eslatma havolasi</label><input class="fi" type="text" name="note" placeholder="https://t.me/..."></div>
                <div class="fg"><label class="fl">Tavsif</label><textarea class="fta" name="desc" placeholder="Qo'shimcha ma'lumot..."></textarea></div>
                <div class="fg">
                  <label class="fl">Dashboard</label>
                  <label class="favorite-field">
                    <input type="checkbox" name="isFavorite">
                    <span>Tanlangan mahsulot sifatida tepada ko'rsatish</span>
                  </label>
                </div>

                <div class="fg">
                  <label class="fl">Rasmlar</label>
                  <div class="existing-images" id="existingImages"></div>
                  <div class="uarea">
                    <input type="file" id="fImgs" name="images" multiple accept="image/*">
                    <div class="uicon">Upload</div>
                    <div class="utxt"><strong>Rasmlarni tanlang</strong><br>Backend upload qiladi · JPG, PNG, WEBP</div>
                  </div>
                  <div class="pgrid" id="previewGrid"></div>
                </div>

                <button class="btn-sub" id="submitBtn" type="submit">✅ MAHSULOTNI QO'SHISH</button>
                <button class="btn-ghost" id="resetBtn" type="button">Tozalash</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  `;
}
