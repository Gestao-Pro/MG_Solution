const apiKey = "AIzaSyA0lj2g80r7KuI5ZVWsxdHqO8kwl0TzzsQ";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function list() {
  console.log("Consultando API via REST...");
  try {
    const resp = await fetch(url);
    const data = await resp.json();
    console.log("Status:", resp.status);
    if (data.error) {
      console.error("Erro API:", JSON.stringify(data.error, null, 2));
    } else {
      console.log("Modelos encontrados:", data.models?.length);
      if (data.models) {
        data.models.forEach(m => {
          if (m.name.includes("gemini")) {
            console.log(`- ${m.name} (${m.supportedGenerationMethods})`);
          }
        });
      }
    }
  } catch (e) {
    console.error("Erro na requisição:", e);
  }
}

list();