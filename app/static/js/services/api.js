async function request(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof data === "object" && data?.message ? data.message : "Request failed";
    throw new Error(message);
  }

  return data;
}

export const api = {
  getConfig() {
    return request("/api/config");
  },

  getProducts() {
    return request("/api/products");
  },

  createProduct(formData) {
    return request("/api/products", {
      method: "POST",
      body: formData,
    });
  },

  updateProduct(productId, formData) {
    return request(`/api/products/${productId}`, {
      method: "PUT",
      body: formData,
    });
  },

  setFavorite(productId, isFavorite) {
    return request(`/api/products/${productId}/favorite`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ isFavorite }),
    });
  },

  deleteProduct(productId) {
    return request(`/api/products/${productId}`, {
      method: "DELETE",
    });
  },

  saveWebhook() {
    return request("/api/telegram/webhook", {
      method: "POST",
    });
  },
};
