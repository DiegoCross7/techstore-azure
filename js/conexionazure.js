const AZURE_ENDPOINT = "https://<tu-endpoint>.openai.azure.com/";
const AZURE_DEPLOYMENT = "mi-modelo";
const AZURE_API_VERSION = "2024-02-01";
const AZURE_KEY = "XXXX";

async function chatAzure(message){
  return fetch(
    `${AZURE_ENDPOINT}openai/deployments/${AZURE_DEPLOYMENT}/chat/completions?api-version=${AZURE_API_VERSION}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": AZURE_KEY
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: message }]
      })
    }
  );
}
