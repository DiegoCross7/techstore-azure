// js/app.js

const app = {
    state: {
        cart: JSON.parse(localStorage.getItem('techstore_cart')) || [],
        view: 'home'
    },

    init: () => {
        app.router('home');
        app.updateCartBadge();
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    router: (viewName) => {
        const root = document.getElementById('app-root');
        const template = document.getElementById(`view-${viewName}`);
        
        if (!template) return;

        root.innerHTML = '';
        const clone = template.content.cloneNode(true);
        root.appendChild(clone);
        
        if (viewName === 'home') app.renderProducts();
        if (viewName === 'cart') app.renderCart();
        if (viewName === 'checkout') app.prepareCheckout();

        window.scrollTo(0, 0);
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    renderProducts: () => {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        // Usamos productsDB que viene de data.js
        grid.innerHTML = productsDB.map(product => `
            <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition border border-gray-100 flex flex-col overflow-hidden">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="p-5 flex flex-col flex-grow">
                    <h3 class="text-lg font-bold text-gray-800">${product.name}</h3>
                    <p class="text-sm text-gray-500 mb-4">${product.desc}</p>
                    <div class="mt-auto flex justify-between items-center">
                        <span class="text-xl font-bold text-indigo-600">$${product.price.toFixed(2)}</span>
                        <button onclick="app.addToCart(${product.id})" class="bg-gray-900 text-white px-3 py-2 rounded-lg hover:bg-indigo-600 text-sm">
                            Agregar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    addToCart: (productId) => {
        const existingItem = app.state.cart.find(item => item.id === productId);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            const product = productsDB.find(p => p.id === productId);
            app.state.cart.push({ ...product, quantity: 1 });
        }
        app.saveCart();
        app.showToast("Producto agregado");
    },

    removeFromCart: (productId) => {
        app.state.cart = app.state.cart.filter(item => item.id !== productId);
        app.saveCart();
        app.renderCart();
    },

    updateQuantity: (productId, change) => {
        const item = app.state.cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) app.removeFromCart(productId);
            else {
                app.saveCart();
                app.renderCart();
            }
        }
    },

    saveCart: () => {
        localStorage.setItem('techstore_cart', JSON.stringify(app.state.cart));
        app.updateCartBadge();
    },

    updateCartBadge: () => {
        const count = app.state.cart.reduce((acc, item) => acc + item.quantity, 0);
        const badge = document.getElementById('cart-count');
        if(badge) {
            badge.innerText = count;
            badge.classList.toggle('hidden', count === 0);
        }
    },

    getCartTotals: () => {
        const subtotal = app.state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const tax = subtotal * 0.18;
        return { subtotal, tax, total: subtotal + tax };
    },

    renderCart: () => {
        const container = document.getElementById('cart-items-container');
        const emptyState = document.getElementById('cart-empty');
        
        if (app.state.cart.length === 0) {
            if(container) container.parentElement.classList.add('hidden');
            if(emptyState) emptyState.classList.remove('hidden');
            return;
        }
        
        if(emptyState) emptyState.classList.add('hidden');
        if(container) {
            container.parentElement.classList.remove('hidden');
            container.innerHTML = app.state.cart.map(item => `
                <div class="flex items-center gap-4 py-4 border-b">
                    <img src="${item.image}" class="w-16 h-16 object-cover rounded bg-gray-100">
                    <div class="flex-grow">
                        <h4 class="font-bold">${item.name}</h4>
                        <p class="text-sm text-gray-500">$${item.price}</p>
                    </div>
                    <div class="flex items-center gap-2">
                        <button onclick="app.updateQuantity(${item.id}, -1)" class="px-2 bg-gray-200 rounded">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="app.updateQuantity(${item.id}, 1)" class="px-2 bg-gray-200 rounded">+</button>
                    </div>
                    <button onclick="app.removeFromCart(${item.id})" class="text-red-500 ml-4">Eliminar</button>
                </div>
            `).join('');
        }

        const totals = app.getCartTotals();
        const totalEl = document.getElementById('cart-total');
        if(totalEl) totalEl.innerText = `$${totals.total.toFixed(2)}`;
        
        if(typeof lucide !== 'undefined') lucide.createIcons();
    },

    prepareCheckout: () => {
        // Lógica extra si es necesaria al cargar checkout
    },

    handleCheckout: (e) => {
        e.preventDefault();
        const btn = e.target.querySelector('button[type="submit"]');
        btn.disabled = true;
        btn.innerText = "Procesando...";

        setTimeout(() => {
            app.state.cart = [];
            app.saveCart();
            app.showToast("¡Compra Exitosa!", "success");
            app.router('home');
        }, 1500);
    },

    showToast: (message, type = 'normal') => {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<span class="font-medium text-sm text-gray-700">${message}</span>`;
        container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
};

// Inicialización
document.addEventListener('DOMContentLoaded', app.init);

