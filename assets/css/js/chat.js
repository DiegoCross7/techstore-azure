function toggleChat() {
    document.getElementById("chatPopup").classList.toggle("hidden");
}

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("userInput");
let chatHistory = [];
const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

function addMessage(role, text) {
    const bubble = document.createElement("div");
    bubble.style.maxWidth = "75%";
    bubble.style.padding = "8px 12px";
    bubble.style.margin = "5px 0";
    bubble.style.borderRadius = "12px";
    bubble.style.fontSize = "14px";

    if (role === "user") {
        bubble.style.background = "#3b82f6";
        bubble.style.color = "white";
        bubble.style.marginLeft = "auto";
    } else {
        bubble.style.background = "#e2e8f0";
        bubble.style.color = "#1e293b";
        bubble.style.marginRight = "auto";
    }

    bubble.textContent = text;
    chatBox.appendChild(bubble);
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage("user", msg);
    input.value = "";

    // Agregar al historial
    chatHistory.push({ role: 'user', content: msg });

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: msg,
                history: chatHistory,
                sessionId: sessionId,
                inventoryContext: "Laptops Gamer, Smartphones, Auriculares, Smartwatches"
            })
        });

        if (!response.ok) {
            throw new Error('Error en la respuesta del servidor');
        }

        const data = await response.json();
        const botReply = data.response || "Lo siento, no pude procesar tu mensaje.";
        
        chatHistory.push({ role: 'assistant', content: botReply });
        addMessage("bot", botReply);
    } catch (error) {
        console.error('Error:', error);
        addMessage("bot", "Lo siento, tuve un problema procesando eso. ¿Podrías intentar de nuevo?");
    }
}

input?.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});
