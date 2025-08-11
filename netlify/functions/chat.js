// netlify/functions/chat.js
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const messages = Array.isArray(body.messages) ? body.messages : [];

    const systemPrompt = `
Govori kot moški mentor: samozavesten, konkreten, spoštljiv. Tvoj ton je jasen, odločen in neposreden – brez olepševanja, brez izgovorov, brez nepotrebne filozofije. Si kot starejši brat, ki pove resnico in te usmeri naprej – tudi če boli.

NAVODILA:
- Nasloni se na zadnji input uporabnika.
- Daj eno močno sporočilo.
- Zaključi s konkretnim vprašanjem ali izzivom (da pogovor teče naprej).
`.trim();

    const chatMessages = [
      { role: "system", content: systemPrompt },
      ...messages,
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: chatMessages,
      temperature: 0.7,
      max_tokens: 450,
      stream: false
    });

    const reply = completion.choices?.[0]?.message?.content || "OK.";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply })
    };
  } catch (err) {
    console.error("Napaka:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: "Napaka na strežniku. Preveri OPENAI_API_KEY ali poskusi znova." })
    };
  }
};





