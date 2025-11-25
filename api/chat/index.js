// Azure Function: Chat con Gemini AI + Application Insights
const { GoogleGenerativeAI } = require("@google/generative-ai");
const appInsights = require("applicationinsights");

// Inicializar Application Insights
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
        .setAutoDependencyCorrelation(true)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .start();
}

const client = appInsights.defaultClient;

module.exports = async function (context, req) {
    const startTime = Date.now();
    context.log('🤖 Procesando mensaje de chat');

    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
        context.res = {
            status: 500,
            body: { error: "Configuración faltante" }
        };
        return;
    }

    const userMessage = req.body?.message;
    const chatHistory = req.body?.history || [];
    const inventoryContext = req.body?.inventoryContext || "";
    const sessionId = req.body?.sessionId || `session-${Date.now()}`;

    if (!userMessage) {
        context.res = {
            status: 400,
            body: { error: "Mensaje requerido" }
        };
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Construir prompt
        const systemPrompt = `Eres TechBot, asistente virtual de TechStore desplegado en Microsoft Azure Cloud ☁️

INVENTARIO DISPONIBLE:
${inventoryContext}

CAPACIDADES:
- Responder preguntas sobre productos
- Recomendar productos según necesidades
- Comparar especificaciones técnicas
- Ayudar con compras

PERSONALIDAD:
- Amigable y profesional
- Usa emojis ocasionalmente 💻📱⚡
- Respuestas concisas y útiles

Responde en español de forma natural.`;

        let fullPrompt = systemPrompt + "\n\n";
        if (chatHistory.length > 0) {
            fullPrompt += "Conversación previa:\n";
            chatHistory.forEach(msg => {
                fullPrompt += `${msg.role === 'user' ? 'Cliente' : 'TechBot'}: ${msg.content}\n`;
            });
        }
        fullPrompt += `\nCliente: ${userMessage}\nTechBot:`;

        const result = await model.generateContent(fullPrompt);
        const botResponse = result.response.text() || "Disculpa, no pude procesar tu mensaje.";

        const duration = Date.now() - startTime;

        // Telemetría a Application Insights
        if (client) {
            client.trackEvent({
                name: "ChatbotInteraction",
                properties: {
                    sessionId: sessionId,
                    messageLength: userMessage.length,
                    responseLength: botResponse.length,
                    historyLength: chatHistory.length
                }
            });

            client.trackMetric({
                name: "ChatResponseTime",
                value: duration
            });
        }

        // Guardar en Cosmos DB
        context.bindings.conversationOut = {
            id: context.executionContext.invocationId,
            timestamp: new Date().toISOString(),
            sessionId: sessionId,
            userMessage,
            botResponse,
            duration
        };

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Powered-By': 'Azure Cloud + Gemini AI'
            },
            body: {
                response: botResponse,
                conversationId: context.executionContext.invocationId,
                timestamp: new Date().toISOString()
            }
        };

    } catch (error) {
        context.log.error('❌ Error:', error);

        if (client) {
            client.trackException({
                exception: error,
                properties: { sessionId }
            });
        }

        context.res = {
            status: 500,
            body: {
                error: "Error al procesar mensaje",
                details: error.message
            }
        };
    }
};
