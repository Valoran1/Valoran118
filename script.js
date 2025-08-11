document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatLog = document.getElementById("chat-box");
  const typingEl = document.getElementById("typing-indicator");
  const heroForm = document.getElementById("email-capture");
  const heroEmail = document.getElementById("email-input");
  const gateBox = document.getElementById("email-gate");
  const gateForm = document.getElementById("email-gate-form");
  const gateInput = document.getElementById("email-gate-input");
  const ctaStart = document.getElementById("cta-start-chat");
  const ctaForge = document.getElementById("cta-forge");
  const scrollBtn = document.getElementById("scroll-to-bottom");

  let conversation = [];
  let userMsgCount = 0;

  // Helpers
  function showTyping() {
    typingEl?.classList.remove("hidden");
  }
  function hideTyping() {
    typingEl?.classList.add("hidden");
  }
  function scrollToBottom() {
    chatLog.scrollTop = chatLog.scrollHeight;
  }
  function autoresize() {
    input.style.height = "auto";
    input.style.height = input.scrollHeight + "px";
  }
  function storeEmail(email) {
    try {
      localStorage.setItem("valoran_email", email);
    } catch {}
  }

  function addBubble(role, text = "") {
    const wrap = document.createElement("div");
    wrap.className = `msg ${role}`;
    const p = document.createElement("div");
    p.className = "bubble";
    p.textContent = text;
    wrap.appendChild(p);
    chatLog.appendChild(wrap);
    scrollToBottom();
    return p; // return bubble element for streaming
  }

  // Typing effect (word-by-word)
  function typeByWord(el, text, speed = 24) {
    const words = text.split(/(\s+)/);
    let i = 0;
    (function tick() {
      if (i < words.length) {
        el.textContent += words[i++];
        scrollToBottom();
        setTimeout(tick, speed);
      } else {
        hideTyping();
      }
    })();
  }

  // Initial nudge
  if (!sessionStorage.getItem("welcomed")) {
    const b = addBubble("assistant");
    b.classList.add("typing");
    showTyping();
    typeByWord(
      b,
      "Jaz sem Valoran. Kratko: povej, kje si šibek – telo, glava ali finance? Nato dobiš jasen izziv za danes.",
      16
    );
    sessionStorage.setItem("welcomed", "1");
  }

  // CTA buttons
  ctaStart?.addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("user-input").focus();
  });
  ctaForge?.addEventListener("click", () => {
    input.value = "Želim 30-dnevni Forge Yourself plan.";
    autoresize();
    input.focus();
  });

  // Enter / Shift+Enter
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.requestSubmit();
    }
  });
  input.addEventListener("input", autoresize);

  // Email capture (hero)
  heroForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const em = heroEmail?.value.trim();
    if (em) {
      storeEmail(em);
      heroEmail.value = "";
      const info = addBubble("system", "Email shranjen. V redu, nadaljuj.");
      info.classList.add("info");
    }
  });

  // Gate capture
  gateForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    const em = gateInput?.value.trim();
    if (em) {
      storeEmail(em);
      gateInput.value = "";
      gateBox.style.display = "none";
    }
  });

  // Submit chat
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // show user bubble
    addBubble("user", text);
    conversation.push({ role: "user", content: text });
    input.value = "";
    autoresize();
    userMsgCount++;

    // Email gate after 3 user messages (if no email yet)
    const hasEmail = !!localStorage.getItem("valoran_email");
    if (!hasEmail && userMsgCount >= 3) {
      gateBox.style.display = "block";
      return;
    }

    // placeholder assistant bubble
    const botBubble = addBubble("assistant", "");
    botBubble.classList.add("typing");
    showTyping();

    try {
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation })
      });

      if (!response.ok) {
        hideTyping();
        botBubble.classList.remove("typing");
        botBubble.textContent = "Napaka pri povezavi. Poskusi znova.";
        return;
      }

      const contentType = response.headers.get("content-type") || "";
      let data;
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = { reply: await response.text() };
      }

      const botMsg = data.reply || "OK.";
      botBubble.classList.remove("typing");
      typeByWord(botBubble, botMsg, 18);
      conversation.push({ role: "assistant", content: botMsg });
    } catch (err) {
      console.error(err);
      hideTyping();
      botBubble.classList.remove("typing");
      botBubble.textContent = "Prišlo je do napake. Poskusi znova.";
    }
  });

  // Scroll button
  chatLog.addEventListener("scroll", () => {
    const nearBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 20;
    scrollBtn.style.display = nearBottom ? "none" : "block";
  });
  scrollBtn.addEventListener("click", scrollToBottom);
});





