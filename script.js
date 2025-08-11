document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("chat-form");
  const input = document.getElementById("user-input");
  const chatLog = document.getElementById("chat-box");
  const scrollBtn = document.getElementById("scroll-to-bottom");

  const typingEl = document.getElementById("typing-indicator");
  const heroForm = document.getElementById("email-capture");
  const heroEmail = document.getElementById("email-input");
  const gateBox = document.getElementById("email-gate");
  const gateForm = document.getElementById("email-gate-form");
  const gateInput = document.getElementById("email-gate-input");

  let conversation = [];
  let userMsgCount = 0;

  // Helpers
  const hasEmail = () => {
    try { return !!localStorage.getItem("valoranEmail"); } catch(e){ return false; }
  };
  const storeEmail = (em) => { try { localStorage.setItem("valoranEmail", em); } catch(e){} };
  const showTyping = () => typingEl && typingEl.classList.remove("hidden");
  const hideTyping = () => typingEl && typingEl.classList.add("hidden");
  const scrollToBottom = () => { chatLog.scrollTop = chatLog.scrollHeight; };

  // UI builders
  function addMessage(role, text) {
    const div = document.createElement("div");
    div.className = role === "user" ? "user-msg fade-in" : "bot-msg fade-in";
    div.textContent = text;
    chatLog.appendChild(div);
    scrollToBottom();
    return div;
  }

  function typeByWord(targetEl, text, speed = 22) {
    const parts = (text || "").split(/(\s+)/); // ohrani presledke
    let i = 0;
    targetEl.textContent = "";
    function tick() {
      if (i < parts.length) {
        targetEl.textContent += parts[i++];
        scrollToBottom();
        setTimeout(tick, speed);
      } else {
        hideTyping();
      }
    }
    tick();
  }

  // Email capture (hero)
  if (heroForm) {
    heroForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const em = (heroEmail && heroEmail.value.trim()) || "";
      if (em) {
        storeEmail(em);
        heroEmail.value = "";
        alert("Email shranjen. Dobrodošel v programu.");
      }
    });
  }

  // Gate form
  if (gateForm) {
    gateForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const em = (gateInput && gateInput.value.trim()) || "";
      if (em) {
        storeEmail(em);
        gateBox.style.display = "none";
        form.style.display = "flex";
      }
    });
  }

  // Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const message = input.value.trim();
    if (!message) return;

    // Gate check
    userMsgCount += 1;
    if (userMsgCount >= 3 && !hasEmail()) {
      form.style.display = "none";
      gateBox.style.display = "block";
      gateInput && gateInput.focus();
      return;
    }

    // User message
    addMessage("user", message);
    conversation.push({ role: "user", content: message });
    input.value = "";
    input.focus();

    // Bot placeholder + typing
    const botElement = addMessage("bot", "Valoran tipka");
    botElement.classList.add("typing");
    showTyping();

    try {
      // Non-streaming backend → vrne JSON { reply: "..." }
      const response = await fetch("/.netlify/functions/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation })
      });

      if (!response.ok) {
        botElement.classList.remove("typing");
        hideTyping();
        botElement.textContent = "Napaka pri povezavi z AI.";
        return;
      }

      let data;
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        // če backend vrne goli tekst
        const txt = await response.text();
        data = { reply: txt };
      }

      const botMsg = data.reply || "OK.";
      botElement.classList.remove("typing");
      // tipkanje besedo-po-besedo
      typeByWord(botElement, botMsg, 22);

      conversation.push({ role: "assistant", content: botMsg });
    } catch (err) {
      botElement.classList.remove("typing");
      hideTyping();
      botElement.textContent = "Prišlo je do napake. Poskusi znova.";
      console.error(err);
    }
  });

  // Shift+Enter = nova vrstica / Enter = pošlji
  const ta = document.getElementById("user-input");
  ta.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });

  // Scroll gumb
  const scrollBtn = document.getElementById("scroll-to-bottom");
  chatLog.addEventListener("scroll", () => {
    const nearBottom = chatLog.scrollHeight - chatLog.scrollTop - chatLog.clientHeight < 20;
    scrollBtn.style.display = nearBottom ? "none" : "block";
  });
  scrollBtn.addEventListener("click", () => scrollToBottom());
});






