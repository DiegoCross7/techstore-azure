function toggleChat() {
    document.getElementById("chatPopup").classList.toggle("hidden");
}

const chatBox = document.getElementById("chatBox");
const input = document.getElementById("userInput");

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

function sendMessage() {
    const msg = input.value.trim();
    if (!msg) return;

    addMessage("user", msg);
    input.value = "";

    // Simulación (luego lo conectamos a tu API)
    setTimeout(() => {
        addMessage("bot", "Respuesta temporal.");
    }, 500);
}

input?.addEventListener("keypress", e => {
    if (e.key === "Enter") sendMessage();
});
