function toggleChat() {
    document.getElementById("chatPopup").classList.toggle("hidden");
}

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("userInput");
let chatHistory = [];
const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

// Cargar historial del localStorage
function loadHistory() {
    const saved = localStorage.getItem(`chat_${sessionId}`);
    if (saved) {
        chatHistory = JSON.parse(saved);
        chatHistory.forEach(msg => {
            addMessage(msg.role, msg.content, false);
        });
    } else {
        // Mensaje de bienvenida
        addMessage("bot", "👋 ¡Hola! Soy **TechBot**, tu asistente experto en tecnología.\n\n¿En qué puedo ayudarte hoy?\n• 🔍 Buscar productos\n• 💰 Encontrar ofertas\n• 🆚 Comparar opciones\n• 💡 Recibir recomendaciones", false);
    }
}

// Guardar historial
function saveHistory() {
    localStorage.setItem(`chat_${sessionId}`, JSON.stringify(chatHistory));
}

function addMessage(role, text, save = true) {
    const bubble = document.createElement("div");
    bubble.style.maxWidth = "80%";
    bubble.style.padding = "10px 14px";
    bubble.style.margin = "8px 0";
    bubble.style.borderRadius = "16px";
    bubble.style.fontSize = "14px";
    bubble.style.lineHeight = "1.5";
    bubble.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";

    if (role === "user") {
        bubble.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
        bubble.style.color = "white";
        bubble.style.marginLeft = "auto";
        bubble.style.borderBottomRightRadius = "4px";
    } else {
        bubble.style.background = "#f8f9fa";
        bubble.style.color = "#1e293b";
        bubble.style.marginRight = "auto";
        bubble.style.borderBottomLeftRadius = "4px";
        bubble.style.border = "1px solid #e2e8f0";
        
        // Procesar markdown simple
        text = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/• /g, '• ')
            .replace(/\n/g, '<br>');
        
        bubble.innerHTML = text;
    }

    if (role === "user") {
        bubble.textContent = text;
    }
    
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
    
    if (save) {
        chatHistory.push({ role, content: text.replace(/<[^>]*>/g, '') });
        saveHistory();
    }
}

// Mostrar indicador "escribiendo..."
function showTyping() {
    const typing = document.createElement("div");
    typing.id = "typingIndicator";
    typing.style.maxWidth = "80%";
    typing.style.padding = "10px 14px";
    typing.style.margin = "8px 0";
    typing.style.borderRadius = "16px";
    typing.style.fontSize = "14px";
    typing.style.background = "#f8f9fa";
    typing.style.color = "#64748b";
    typing.style.marginRight = "auto";
    typing.innerHTML = `<span class="typing-dots">●●●</span> TechBot está escribiendo...`;
    
    chatBox.appendChild(typing);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideTyping() {
    const typing = document.getElementById("typingIndicator");
    if (typing) typing.remove();
}

async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage("user", msg);
    input.value = "";
    input.disabled = true;
    
    showTyping();

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                history: chatHistory.slice(-10), // Últimos 10 mensajes para contexto
                sessionId: sessionId
            })
        });

        hideTyping();

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();
        const botReply = data.response || "Lo siento, no pude procesar tu mensaje. 😕";
        
        addMessage("bot", botReply);
    } catch (error) {
        hideTyping();
        console.error('Error:', error);
        addMessage("bot", "⚠️ Lo siento, tuve un problema procesando tu mensaje. ¿Podrías intentar de nuevo?");
    } finally {
        input.disabled = false;
        input.focus();
    }
}

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', () => {
    loadHistory();
});

input?.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});
