// Azure Function: Chat con Gemini AI + Application Insights
const { GoogleGenerativeAI } = require("@google/generative-ai");
const appInsights = require("applicationinsights");

// Inicializar Application Insights solo si está configurado
if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    try {
        appInsights.setup(process.env.APPLICATIONINSIGHTS_CONNECTION_STRING)
            .setAutoDependencyCorrelation(true)
            .setAutoCollectRequests(true)
            .setAutoCollectPerformance(true)
            .setAutoCollectExceptions(true)
            .setAutoCollectDependencies(true)
            .start();
    } catch (e) {
        console.warn('App Insights setup failed:', e.message);
    }
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

        // Inventario completo de productos
        const fullInventory = `
🎮 LAPTOPS GAMER:
1. Laptop ASUS ROG Strix G15 - $1,499
   • Ryzen 9 5900HX, RTX 3070, 16GB RAM, 1TB SSD
   • Pantalla 15.6" 300Hz, RGB Keyboard
   • Ideal para: Gaming competitivo, streaming, edición de video
   
2. Laptop MSI Katana GF66 - $1,199
   • Intel i7-12700H, RTX 3060, 16GB RAM, 512GB SSD
   • Pantalla 15.6" 144Hz
   • Ideal para: Gaming casual, multitarea, desarrollo

3. Laptop Lenovo Legion 5 Pro - $1,599
   • Ryzen 7 6800H, RTX 3070 Ti, 32GB RAM, 1TB SSD
   • Pantalla 16" QHD 165Hz
   • Ideal para: Gaming profesional, creación de contenido

📱 SMARTPHONES:
4. iPhone 15 Pro Max 256GB - $1,299
   • A17 Pro, Triple cámara 48MP, Titanio
   • 6.7" Super Retina XDR
   • Ideal para: Fotografía, productividad, ecosistema Apple

5. Samsung Galaxy S24 Ultra 512GB - $1,399
   • Snapdragon 8 Gen 3, Quad camera 200MP, S Pen
   • 6.8" Dynamic AMOLED 2X
   • Ideal para: Power users, fotografía profesional, multitarea

6. Google Pixel 8 Pro 256GB - $999
   • Tensor G3, Triple camera 50MP, AI avanzada
   • 6.7" LTPO OLED 120Hz
   • Ideal para: Fotografía computacional, Android puro, AI

🎧 AURICULARES:
7. Sony WH-1000XM5 - $399
   • ANC líder de la industria, 30h batería
   • LDAC, multipunto, controles táctiles
   • Ideal para: Viajeros, oficina, audiofilia

8. AirPods Pro 2 - $249
   • ANC adaptativo, audio espacial personalizado
   • Cancelación de ruido hasta 2x mejor
   • Ideal para: Usuarios Apple, llamadas, ejercicio

9. Bose QuietComfort 45 - $329
   • ANC premium, 24h batería, comodidad superior
   • Modo Aware, multipunto Bluetooth
   • Ideal para: Uso diario, oficina, viajes

⌚ SMARTWATCHES:
10. Apple Watch Series 9 GPS 45mm - $429
    • S9 chip, Always-On Retina, sensor temperatura
    • Detección de caídas/accidentes, ECG
    • Ideal para: Fitness, salud, notificaciones iOS

11. Samsung Galaxy Watch 6 Classic 47mm - $399
    • Wear OS, bisel giratorio, sensor BioActive
    • GPS de doble frecuencia, seguimiento avanzado
    • Ideal para: Android users, fitness, estilo premium

12. Garmin Fenix 7 Solar - $699
    • Carga solar, mapas TopoActive, 37 días batería
    • Multi-GNSS, métricas avanzadas
    • Ideal para: Deportistas serios, aventura, outdoor

💰 OFERTAS ESPECIALES:
• Black Friday: 15% descuento en laptops
• Cyber Monday: 2x1 en auriculares seleccionados
• Bundle Deal: Smartphone + Smartwatch = 10% descuento
• Estudiantes: 5% adicional con credencial`;

        // Construir prompt mejorado
        const systemPrompt = `Eres TechBot 🤖, el asistente virtual experto de TechStore, desplegado en Microsoft Azure Cloud ☁️

${fullInventory}

🎯 CAPACIDADES AVANZADAS:
1. RECOMENDACIONES PERSONALIZADAS
   - Analiza necesidades del usuario (gaming, trabajo, estudio, fotografía)
   - Considera presupuesto y preferencias
   - Sugiere productos ideales con justificación

2. COMPARADOR INTELIGENTE
   - Compara hasta 3 productos lado a lado
   - Destaca diferencias clave en specs y precio
   - Recomienda el mejor según uso

3. CALCULADORA DE PRESUPUESTO
   - Optimiza presupuesto del cliente
   - Sugiere combos y bundles
   - Aplica ofertas y descuentos automáticamente

4. ASESOR DE COMPRA
   - Explica especificaciones técnicas en lenguaje simple
   - Recomienda accesorios complementarios
   - Informa sobre garantía y envíos

5. BÚSQUEDA AVANZADA
   - Filtra por categoría, precio, marca, specs
   - Encuentra el producto exacto que busca el cliente

💡 PERSONALIDAD:
- Entusiasta y conocedor de tecnología
- Usa emojis estratégicamente 💻📱⚡🎮🔥
- Respuestas estructuradas con bullets cuando sea útil
- Proactivo: sugiere productos relacionados
- Pregunta para entender mejor las necesidades

📋 FORMATO DE RESPUESTA:
- Saluda amigablemente al primer mensaje
- Usa negritas (**producto**) para destacar nombres
- Lista opciones numeradas cuando compares
- Incluye precios siempre que menciones productos
- Finaliza con pregunta para continuar la conversación

🎁 PROMOCIONES ACTIVAS:
- Menciona ofertas relevantes cuando corresponda
- Calcula descuentos automáticamente
- Sugiere bundles para ahorrar

Responde SIEMPRE en español, de forma natural, útil y atractiva.`;

        let fullPrompt = systemPrompt + "\n\n";
        if (chatHistory.length > 0) {
            fullPrompt += "Conversación previa:\n";
            chatHistory.forEach(msg => {
                const text = msg.parts?.[0]?.text || msg.content || '';
                fullPrompt += `${msg.role === 'user' ? 'Cliente' : 'TechBot'}: ${text}\n`;
            });
        }
        fullPrompt += `\nCliente: ${userMessage}\nTechBot:`;

        const result = await model.generateContent(fullPrompt);
        const botResponse = result.response.text() || "Disculpa, no pude procesar tu mensaje.";

        const duration = Date.now() - startTime;

        // Telemetría a Application Insights
        if (client) {
            try {
                client.trackEvent({
                    name: "ChatbotInteraction",
                    properties: {
                        sessionId: sessionId,
                        messageLength: userMessage.length,
                        responseLength: botResponse.length
                    }
                });

                client.trackMetric({
                    name: "ChatResponseTime",
                    value: duration
                });
            } catch (e) {
                context.log.warn('Telemetry failed:', e.message);
            }
        }

        context.res = {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'X-Powered-By': 'Azure Cloud + Gemini AI'
            },
            body: {
                reply: botResponse,
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
