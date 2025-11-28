document.addEventListener("DOMContentLoaded", () => {
  const cart = [];
  const cartEl = document.getElementById("cart");
  const cartItemsEl = document.getElementById("cart-items");
  const subtotalEl = document.getElementById("subtotal");
  const taxEl = document.getElementById("tax");
  const totalEl = document.getElementById("total");
  const cartIcon = document.getElementById("cart-icon");

  // Toggle cart
  cartIcon.addEventListener("click", () => {
    cartEl.classList.toggle("active");
  });

  // Add to cart
  document.querySelectorAll(".add-cart").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const product = e.target.closest(".product");
      const name = product.querySelector("h3").innerText;
      const price = parseInt(product.querySelector("p").innerText.replace("₹", ""));
      const existing = cart.find((item) => item.name === name);

      if (existing) {
        existing.qty++;
      } else {
        cart.push({ name, price, qty: 1 });
      }
      updateCart();
    });
  });

  // Update cart
  function updateCart() {
    cartItemsEl.innerHTML = "";
    let subtotal = 0;

    cart.forEach((item, index) => {
      subtotal += item.price * item.qty;
      const li = document.createElement("li");
      li.innerHTML = `
        ${item.name} (x${item.qty}) - ₹${item.price * item.qty}
        <button class="remove-btn" data-index="${index}">
          <i class="fa-solid fa-trash"></i>
        </button>
      `;
      cartItemsEl.appendChild(li);
    });

    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    subtotalEl.innerText = `Subtotal: ₹${subtotal}`;
    taxEl.innerText = `Tax (5%): ₹${tax}`;
    totalEl.innerText = `Total: ₹${total}`;

    document.querySelectorAll(".remove-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const index = e.currentTarget.dataset.index;
        cart.splice(index, 1);
        updateCart();
      });
    });
  }

  // Filters
  const categoryFilter = document.getElementById("categoryFilter");
  const priceFilter = document.getElementById("priceFilter");

  categoryFilter.addEventListener("change", filterProducts);
  priceFilter.addEventListener("change", filterProducts);

  function filterProducts() {
    const categoryValue = categoryFilter.value;
    const priceValue = priceFilter.value;

    document.querySelectorAll(".product").forEach((product) => {
      const category = product.dataset.category;
      const price = parseInt(product.dataset.price);
      let visible = true;

      if (categoryValue !== "all" && category !== categoryValue) visible = false;
      if (priceValue === "low" && price >= 500) visible = false;
      if (priceValue === "mid" && (price < 500 || price > 1000)) visible = false;
      if (priceValue === "high" && price <= 1000) visible = false;

      product.style.display = visible ? "block" : "none";
    });
  }
});
