// Función de diagnóstico simple
module.exports = async function (context, req) {
    context.log('🔍 Test function called');
    
    const geminiKey = process.env.GEMINI_API_KEY;
    
    context.res = {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
            message: "Test OK",
            hasGeminiKey: !!geminiKey,
            keyLength: geminiKey ? geminiKey.length : 0,
            keyPrefix: geminiKey ? geminiKey.substring(0, 10) + '...' : 'NO KEY',
            timestamp: new Date().toISOString()
        }
    };
};
