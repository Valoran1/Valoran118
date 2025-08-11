const { OpenAI } = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const systemPrompt = `Govori kot starejši brat in mentor. Ton: stoičen, neposreden, spoštljiv. Vedno daj jasne naloge, brez olepševanja. Struktura:
- Če je vprašanje splošno, postavi 2–3 kratka podvprašanja (profiliranje).
- Nato podaj konkreten izziv za DANES (jutro/dan/večer) z razlogom "zakaj".
- Uporabljaj kratek, močan jezik. Brez opravičil.
- Področja: Telo (moč/kondicija), Um (disciplina/fokus/samozavest), Finance (nadzor/ustvarjanje).`;

    const chatMessages = [{ role: "system", content: systemPrompt }, ...messages];

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 450,
      stream: false,
    });

    const reply = completion?.choices?.[0]?.message?.content || "OK.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    };
  } catch (err) {
    console.error("Napaka:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: "Napaka na strežniku. Preveri OPENAI_API_KEY ali poskusi znova." }),
    };
  }
};





