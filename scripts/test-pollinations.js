import https from "https";
import fs from "fs";

const prompt = "cute cyberpunk cat";
const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;

console.log("Testando Pollinations.ai...");
console.log("URL:", url);

https.get(url, (res) => {
    console.log("Status:", res.statusCode);
    if (res.statusCode === 200) {
        const file = fs.createWriteStream("pollinations_test.jpg");
        res.pipe(file);
        file.on('finish', () => {
            console.log("Imagem salva com sucesso: pollinations_test.jpg");
        });
    } else {
        console.error("Erro ao baixar imagem");
    }
}).on('error', (e) => {
    console.error("Erro de conexão:", e);
});
