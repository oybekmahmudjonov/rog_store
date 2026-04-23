export function filterProducts(products, filter) {
  if (filter === "rtx") {
    return products.filter((product) => product.gpu?.toUpperCase().includes("RTX"));
  }
  if (filter === "i7") {
    return products.filter((product) => /i[79]/i.test(product.cpu || ""));
  }
  if (filter === "oled") {
    return products.filter((product) => product.screen?.toUpperCase().includes("OLED"));
  }
  if (filter === "budget") {
    return products.filter((product) => Number(product.price) < 800);
  }
  return products;
}
