const cartButton = document.getElementById("cartButton");
const cartModal = document.getElementById("cartModal");
const closeCart = document.getElementById("closeCart");
const cartCount = document.getElementById("cartCount");
const cartItems = document.getElementById("cartItems");
const cartTotal = document.getElementById("cartTotal");
const checkoutButton = document.getElementById("checkoutButton");
const paymentMessage = document.getElementById("paymentMessage");
const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");
const contactForm = document.getElementById("contactForm");
const formMessage = document.getElementById("formMessage");

/* Cada producto empieza con 5 unidades disponibles. */
let cart = [];
const inventory = {};
document.querySelectorAll(".product-card").forEach(card => {
    inventory[card.dataset.name] = Number(card.dataset.stock);
});

/* Convierte números a formato de pesos colombianos. */
function formatPrice(price) {
    return new Intl.NumberFormat("es-CO", {
        style: "currency", currency: "COP", maximumFractionDigits: 0
    }).format(price);
}

function findCartItem(productName) {
    return cart.find(item => item.name === productName);
}

/* Agrega una unidad sin superar el inventario disponible. */
function addToCart(product) {
    if (inventory[product.name] <= 0) {
        showPaymentMessage(`No quedan unidades disponibles de ${product.name}.`);
        return false;
    }

    const existingItem = findCartItem(product.name);
    if (existingItem) existingItem.quantity += 1;
    else cart.push({ name: product.name, price: product.price, quantity: 1 });

    inventory[product.name] -= 1;
    updateCart();
    updateProductStock();
    return true;
}

/* Reduce una unidad y la devuelve al inventario. */
function decreaseCartItem(productName) {
    const item = findCartItem(productName);
    if (!item) return;
    item.quantity -= 1;
    inventory[productName] += 1;
    if (item.quantity <= 0) cart = cart.filter(product => product.name !== productName);
    updateCart();
    updateProductStock();
}

/* Agrega una unidad desde el botón + del carrito. */
function addOneFromCart(productName) {
    const card = [...document.querySelectorAll(".product-card")].find(item => item.dataset.name === productName);
    if (!card) return;
    addToCart({ name: card.dataset.name, price: Number(card.dataset.price) });
}

/* Elimina el producto completo y devuelve sus unidades al inventario. */
function removeFromCart(productName) {
    const item = findCartItem(productName);
    if (!item) return;
    inventory[productName] += item.quantity;
    cart = cart.filter(product => product.name !== productName);
    updateCart();
    updateProductStock();
}

/* Dibuja el contenido del carrito y calcula el subtotal. */
function updateCart() {
    const totalUnits = cart.reduce((sum, product) => sum + product.quantity, 0);
    cartCount.textContent = totalUnits;

    if (cart.length === 0) {
        cartItems.innerHTML = `<p class="empty-cart">Tu carrito está vacío. Agrega una prenda de la colección.</p>`;
        cartTotal.textContent = formatPrice(0);
        checkoutButton.disabled = true;
        return;
    }

    cartItems.innerHTML = cart.map(product => `
        <div class="cart-item">
            <div class="cart-item-name">${product.name}</div>
            <div class="cart-item-price">${formatPrice(product.price * product.quantity)}</div>
            <div class="cart-item-controls">
                <button class="qty-button" onclick="decreaseCartItem('${product.name}')" aria-label="Quitar una unidad">−</button>
                <span class="qty-number">${product.quantity}</span>
                <button class="qty-button" onclick="addOneFromCart('${product.name}')" aria-label="Agregar una unidad">+</button>
                <button class="remove-item" onclick="removeFromCart('${product.name}')">Eliminar</button>
            </div>
        </div>
    `).join("");

    const total = cart.reduce((sum, product) => sum + product.price * product.quantity, 0);
    cartTotal.textContent = formatPrice(total);
    checkoutButton.disabled = false;
}

/* Refresca el texto de unidades disponibles en cada tarjeta. */
function updateProductStock() {
    document.querySelectorAll(".product-card").forEach(card => {
        const available = inventory[card.dataset.name];
        const stockElement = card.querySelector(".stock");
        const addButton = card.querySelector(".add-cart");
        if (!stockElement) return;

        stockElement.innerHTML = `<span class="stock-dot"></span> ${available} ${available === 1 ? "unidad disponible" : "unidades disponibles"}`;
        stockElement.classList.toggle("low", available <= 2);
        stockElement.classList.toggle("sold-out", available === 0);
        addButton.disabled = available === 0;
        addButton.textContent = available === 0 ? "Agotado" : "Agregar al carrito";
    });
}

/* Conecta los botones de productos con el carrito. */
document.querySelectorAll(".add-cart").forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".product-card");
        const product = { name: card.dataset.name, price: Number(card.dataset.price) };
        if (addToCart(product)) {
            button.textContent = "¡Agregado!";
            setTimeout(() => {
                if (inventory[product.name] > 0) button.textContent = "Agregar al carrito";
            }, 900);
        }
    });
});

/* Abre y cierra el carrito. */
cartButton.addEventListener("click", () => { cartModal.classList.add("show"); cartModal.setAttribute("aria-hidden", "false"); });
closeCart.addEventListener("click", () => { cartModal.classList.remove("show"); cartModal.setAttribute("aria-hidden", "true"); });
cartModal.addEventListener("click", event => {
    if (event.target === cartModal) { cartModal.classList.remove("show"); cartModal.setAttribute("aria-hidden", "true"); }
});

/*
   Abre el enlace real de Wompi. Si está vacío, explica qué falta
   para activar cobros reales sin enviar al cliente a una URL falsa.
*/
checkoutButton.addEventListener("click", () => {
    if (cart.length === 0) return;
    if (!WOMPI_PAYMENT_LINK) {
        showPaymentMessage("El carrito está listo. Para activar pagos reales, crea el enlace de pago de Rumore Fashion en Wompi y pégalo en WOMPI_PAYMENT_LINK de este archivo.");
        return;
    }
    window.open(WOMPI_PAYMENT_LINK, "_blank", "noopener,noreferrer");
});

function showPaymentMessage(message) { paymentMessage.textContent = message; }

/* Menú para pantallas pequeñas. */
menuToggle.addEventListener("click", () => { mainNav.classList.toggle("open"); });

/* Formulario de contacto demostrativo. */
contactForm.addEventListener("submit", event => {
    event.preventDefault();
    formMessage.textContent = "¡Gracias! Tu mensaje fue registrado en esta demostración.";
    contactForm.reset();
});

window.decreaseCartItem = decreaseCartItem;
window.addOneFromCart = addOneFromCart;
window.removeFromCart = removeFromCart;

updateProductStock();
updateCart();
