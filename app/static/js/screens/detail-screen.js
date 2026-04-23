let modal;
let titleElement;
let imagesElement;
let bodyElement;

function specRow(label, value) {
  if (!value) {
    return "";
  }

  return `
    <div class="spec-row">
      <span class="spec-key">${label}</span>
      <span class="spec-val">${value}</span>
    </div>
  `;
}

function renderSpecs(product) {
  return `
    <section class="detail-section">
      <div class="detail-label">Texnik Ma'lumotlar</div>
      <div class="detail-specs">
        ${specRow("CPU", product.cpu)}
        ${specRow("RAM", product.ram)}
        ${specRow("SSD", product.ssd)}
        ${specRow("GPU", product.gpu)}
        ${specRow("Ekran", product.screen)}
        ${specRow("OS", product.os)}
      </div>
    </section>
  `;
}

function renderFeatures(product) {
  if (!product.features?.length) {
    return "";
  }

  return `
    <section class="detail-section">
      <div class="detail-label">Xususiyatlar</div>
      <div class="ftags">${product.features.map((feature) => `<span class="ftag">${feature}</span>`).join("")}</div>
    </section>
  `;
}

function renderDescription(product) {
  if (!product.desc) {
    return "";
  }

  return `
    <section class="detail-section">
      <div class="detail-label">Holati</div>
      <div class="detail-desc">${product.desc}</div>
    </section>
  `;
}

export function initDetailScreen() {
  modal = document.getElementById("detailModal");
  titleElement = document.getElementById("mTitle");
  imagesElement = document.getElementById("mImgs");
  bodyElement = document.getElementById("mBody");

  document.getElementById("closeDetailBtn").addEventListener("click", closeDetail);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeDetail();
    }
  });
}

export function openDetail(productId, products) {
  const product = products.find((item) => item._docId === productId);
  if (!product) {
    return;
  }

  const buyMessage = `Salom! ${product.name} (#${product.id}) ga qiziqaman. Narx: $${product.price}`;

  titleElement.textContent = product.name;
  imagesElement.innerHTML = product.images?.length
    ? product.images.map((src) => `<img class="mimg" src="${src}" alt="${product.name}">`).join("")
    : `<div class="mph">Laptop</div>`;

  bodyElement.innerHTML = `
    <div class="detail-layout">
      <div class="detail-main">
        <div class="detail-hero">
          <div>
            <div class="detail-kicker">Gaming Laptop</div>
            <div class="detail-name">${product.name}</div>
            ${product.warranty ? `<div class="detail-warranty">${product.warranty} kafolat</div>` : ""}
          </div>
          <div class="detail-price-card">
            <div class="detail-price-label">Narx</div>
            <div class="cprice">${product.price}<span>$</span></div>
          </div>
        </div>
        ${renderSpecs(product)}
        ${renderFeatures(product)}
        ${renderDescription(product)}
      </div>
      <aside class="detail-side">
        <section class="detail-section">
          <div class="detail-label">Aloqa</div>
          <div class="detail-links">
            <a href="tel:+998979660595" class="clink">+998 97 966 0595</a>
            <a href="tel:+998558080907" class="clink">+998 55 808 0907</a>
            <a href="https://t.me/rogadmin" target="_blank" class="clink">Admin: @rogadmin</a>
            <a href="https://t.me/noteboks_uz" target="_blank" class="clink">Telegram Guruh</a>
            ${product.note ? `<a href="${product.note}" target="_blank" class="clink">Eslatma havolasi</a>` : ""}
          </div>
        </section>
        <a href="https://t.me/rogadmin?text=${encodeURIComponent(buyMessage)}" target="_blank" class="btn-buy-full">Sotib olish</a>
      </aside>
    </div>
  `;

  modal.classList.add("on");
  document.body.style.overflow = "hidden";
}

export function closeDetail() {
  modal.classList.remove("on");
  document.body.style.overflow = "";
}
