export function renderCard(product, index = 0) {
  const previewImage = product.images?.length
    ? `<img class="cimg" src="${product.images[0]}" alt="${product.name}" loading="lazy">`
    : `<div class="cph">Laptop</div>`;

  const features = product.features?.length
    ? `
      <div class="ftags">
        ${product.features
          .slice(0, 3)
          .map((feature) => `<span class="ftag">${feature}</span>`)
          .join("")}
        ${product.features.length > 3 ? `<span class="ftag">+${product.features.length - 3}</span>` : ""}
      </div>
    `
    : "";

  return `
    <article class="card" data-product-id="${product._docId}" style="animation-delay:${index * 0.07}s">
      <div class="card-noise"></div>
      <div class="card-glow"></div>
      <div class="cc tl"></div><div class="cc tr"></div><div class="cc bl"></div><div class="cc br"></div>
      <div class="card-media">
        ${previewImage}
        <div class="card-media-overlay"></div>
      </div>
      <div class="cbadge">#${product.id || "-"}</div>
      ${product.isFavorite ? `<div class="cfavorite">Featured</div>` : ""}
      <div class="cbody">
        <div class="cid">ID: ${product.id || "-"}</div>
        <div class="ctitle">${product.name}</div>
        ${product.warranty ? `<div class="warrant">${product.warranty} Kafolat</div>` : ""}
        <div class="sgrid">
          ${product.cpu ? `<div class="si"><div class="sk">CPU</div><div class="sv">${product.cpu.split(" ").slice(0, 3).join(" ")}</div></div>` : ""}
          ${product.ram ? `<div class="si"><div class="sk">RAM</div><div class="sv">${product.ram}</div></div>` : ""}
          ${product.gpu ? `<div class="si"><div class="sk">GPU</div><div class="sv">${product.gpu}</div></div>` : ""}
          ${product.screen ? `<div class="si"><div class="sk">Ekran</div><div class="sv">${product.screen}</div></div>` : ""}
        </div>
        ${features}
        <div class="cfoot">
          <div class="cprice">${product.price}<span>$</span></div>
          <div class="cacts">
            <button class="btn btn-d" data-action="detail" data-product-id="${product._docId}">Ko'rish</button>
            <button class="btn btn-b" data-action="buy" data-product-id="${product._docId}">Sotib ol</button>
          </div>
        </div>
      </div>
    </article>
  `;
}
