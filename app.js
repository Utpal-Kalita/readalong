/* ReadAlong - read-aloud companion with word tracking and readable typography.
   Uses the browser's built-in SpeechSynthesis. Word-level tracking only where
   the engine emits boundary events (verified at runtime); otherwise an honest
   sentence-level fallback activates and the UI says which mode is live. */
"use strict";

const SAMPLES = {
  science: "Photosynthesis is how green plants turn sunlight into food. Inside every leaf, tiny structures called chloroplasts capture light energy. They use that energy to combine water from the soil with carbon dioxide from the air. The result is glucose, a sugar that feeds the plant, and oxygen, which the plant releases. Nearly every food chain on Earth begins with this quiet chemical recipe. Without it, the air we breathe would not exist.",
  history: "In 1947, India became independent after nearly two centuries of British rule. The transition was led by a mass movement that used non-violent resistance on an unprecedented scale. Millions of ordinary people - farmers, students, weavers - chose boycotts and marches over weapons. Independence also brought Partition, one of the largest migrations in human history. Remembering both the triumph and the cost helps us understand the nation that followed.",
};

let sentences = [];   // [{el, text}]
let wordMode = null;  // true = word boundary events confirmed, false = fallback
let current = 0;
let playing = false;
let utter = null;
let boundaryTimer = null;

const page = document.getElementById("page");
const modeNote = document.getElementById("modeNote");

function splitSentences(text) {
  return text.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g)?.map((s) => s.trim()).filter(Boolean) || [];
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function loadText(text) {
  speechSynthesis.cancel();
  playing = false;
  document.getElementById("playBtn").textContent = "▶ Read aloud";
  sentences = splitSentences(text);
  page.innerHTML = "";
  sentences = sentences.map((s, i) => {
    const span = document.createElement("span");
    span.className = "sentence";
    span.dataset.idx = i;
    span.innerHTML = escapeHtml(s) + " ";
    span.addEventListener("click", () => { current = i; if (playing) speakCurrent(); else highlightSentence(i); });
    page.appendChild(span);
    return { el: span, text: s };
  });
  document.getElementById("reader").hidden = false;
  modeNote.textContent = "";
  wordMode = null;
  document.getElementById("reader").scrollIntoView({ behavior: "smooth" });
}

function highlightSentence(i) {
  sentences.forEach((s, j) => s.el.classList.toggle("active", j === i));
  sentences[i]?.el.scrollIntoView({ block: "nearest", behavior: "smooth" });
}

function clearMarks(s) { s.el.querySelectorAll("mark").forEach((m) => m.replaceWith(m.textContent)); }

function markWord(s, charIdx, charLen) {
  // Rebuild sentence content with the spoken word marked. charIndex is relative
  // to this utterance's text (verified below before use).
  const raw = s.text;
  if (charIdx < 0 || charIdx + charLen > raw.length) return;
  const before = raw.slice(0, charIdx);
  const word = raw.slice(charIdx, charIdx + charLen);
  const after = raw.slice(charIdx + charLen);
  s.el.innerHTML = escapeHtml(before) + `<mark>${escapeHtml(word)}</mark>` + escapeHtml(after) + " ";
}

function speakCurrent() {
  speechSynthesis.cancel();
  if (current >= sentences.length) { stopAll(); return; }
  const s = sentences[current];
  highlightSentence(current);
  utter = new SpeechSynthesisUtterance(s.text);
  utter.rate = parseFloat(document.getElementById("rate").value);

  // Word-mode detection: if a boundary event with a sane charIndex arrives,
  // word tracking is real in this browser; otherwise fall back honestly.
  let sawBoundary = false;
  let started = false;
  clearTimeout(boundaryTimer);
  boundaryTimer = setTimeout(() => {
    if (!started && wordMode === null) {
      wordMode = false;
      modeNote.textContent = "Speech could not start in this browser (no speech engine or voices available).";
    } else if (!sawBoundary && wordMode === null) {
      wordMode = false;
      modeNote.textContent = "Sentence-by-sentence mode (this browser's speech engine does not report word positions).";
    }
  }, 1500);
  utter.onstart = () => {
    started = true;
    if (modeNote.textContent.startsWith("Speech could not")) modeNote.textContent = "";
  };

  utter.onboundary = (e) => {
    if (typeof e.charIndex !== "number") return;
    if (!sawBoundary) {
      sawBoundary = true;
      if (wordMode === null) {
        wordMode = true;
        modeNote.textContent = "Word-by-word tracking active.";
      }
    }
    if (wordMode) markWord(s, e.charIndex, e.charLength || 1);
  };
  utter.onend = () => {
    clearMarks(s);
    if (!playing) return;
    current++;
    if (current < sentences.length) speakCurrent(); else stopAll();
  };
  utter.onerror = () => { if (playing) { current++; if (current < sentences.length) speakCurrent(); else stopAll(); } };
  speechSynthesis.speak(utter);
}

function stopAll() {
  playing = false;
  speechSynthesis.cancel();
  document.getElementById("playBtn").textContent = "▶ Read aloud";
  sentences.forEach((s) => { s.el.classList.remove("active"); clearMarks(s); });
}

document.getElementById("playBtn").addEventListener("click", () => {
  if (sentences.length === 0) return;
  if (playing) {
    playing = false;
    speechSynthesis.pause();
    document.getElementById("playBtn").textContent = "▶ Resume";
  } else if (speechSynthesis.paused) {
    playing = true;
    speechSynthesis.resume();
    document.getElementById("playBtn").textContent = "⏸ Pause";
  } else {
    playing = true;
    document.getElementById("playBtn").textContent = "⏸ Pause";
    speakCurrent();
  }
});

document.getElementById("stopBtn").addEventListener("click", () => { current = 0; stopAll(); });

document.getElementById("rate").addEventListener("input", (e) => {
  document.getElementById("rateVal").textContent = parseFloat(e.target.value).toFixed(1) + "×";
});

document.getElementById("loadBtn").addEventListener("click", () => {
  const t = document.getElementById("text").value;
  if (t.trim()) loadText(t);
});

document.querySelectorAll(".sample").forEach((b) =>
  b.addEventListener("click", () => {
    document.getElementById("text").value = SAMPLES[b.dataset.sample];
    loadText(SAMPLES[b.dataset.sample]);
  })
);

/* readability settings */
const pageEl = page;
document.getElementById("fontSize").addEventListener("input", (e) => { pageEl.style.fontSize = e.target.value + "px"; });
document.getElementById("spacing").addEventListener("input", (e) => { pageEl.style.letterSpacing = e.target.value / 10 + "px"; });
document.getElementById("lineHeight").addEventListener("input", (e) => { pageEl.style.lineHeight = e.target.value / 10; });
document.querySelectorAll("[data-contrast]").forEach((b) =>
  b.addEventListener("click", () => {
    document.body.dataset.contrast = b.dataset.contrast;
    document.querySelectorAll("[data-contrast]").forEach((x) => x.classList.toggle("on", x === b));
  })
);
