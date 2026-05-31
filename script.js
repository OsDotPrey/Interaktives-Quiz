let quizData = [];

let step = 0;
let started = false;
let triggered = false;
const userAgent = navigator.userAgent;

function getDevice() {
  if (/mobile/i.test(userAgent)) return "Smartphone";
  if (/tablet/i.test(userAgent)) return "Tablet";
  return "Desktop";
}

function getBrowser() {
  if (userAgent.includes("Brave")) return "Brave";
  if (userAgent.includes("Chrome")) return "Chrome";
  if (userAgent.includes("Firefox")) return "Firefox";
  if (userAgent.includes("Opera")) return "Opera";
  if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
  return "Unbekannt";
}

function startPolling() {
  if (window.pollingStarted || triggered) return;
  window.pollingStarted = true;

  // If you want to use the Trigger.json hosted on GitHub, set its raw URL here,
  // otherwise leave empty to use the local Trigger.json near the site.
  const GITHUB_TRIGGER_URL = ""; // e.g. "https://raw.githubusercontent.com/username/repo/branch/Trigger.json"

  const fetchTrigger = async () => {
    const base = GITHUB_TRIGGER_URL || "Trigger.json";
    try {
      const res = await fetch(base + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      if (data && data.trigger === true) {
        triggered = true;
        showWarning();
      }
    } catch (err) {
      // don't spam console on every poll
      console.debug("Trigger fetch failed:", err.message);
    }
  };

  // Poll every 2 seconds while quiz is running
  setInterval(() => {
    if (!started || triggered) return;
    fetchTrigger();
  }, 2000);
}

function showWarning() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h3>WARNUNG!</h3>
    <p>Sie wurden gerade eben gerickrolled!</p>
    <p>Was würde Ihr Chef von Ihnen denken?</p>
    <p>Sie haben:</p>
    <ul style="text-align: left;">
      <li>mal wieder zu viel Zeit in der Keramikabteilung verbracht!</li>
      <li>die Schulungsunterlagen wohl einfach im Schnell-Durchlauf durchgeklickt!</li>
    </ul>
    <p><strong>An dieser Stelle könnte Ihre Mahnung stehen!</strong></p>
    <p>Vielen Dank für das Annehmen der Cookies :)</p>
    <p><strong>Ihr Gerät:</strong> ${getDevice()}</p>
    <p><strong>Ihr Browser:</strong> ${getBrowser()}</p>
  `;
  playAlarm();
}

function playAlarm() {
  const alarm = document.getElementById("alarm");
  if (!alarm) return;
  alarm.currentTime = 0;
  alarm.play().catch((e) => console.log("Audio blocked:", e));
}

function renderQuestion(index) {
  const content = document.getElementById("content");
  const question = quizData[index - 1];

  const answersHtml = (question.answers || [])
    .map((answer) => `<button onclick="next()">${answer}</button>`)
    .join("");

  content.innerHTML = `
    <h3>Frage ${index}</h3>
    <p>${question.question || "(keine Frage)"}</p>
    ${answersHtml}
  `;
}

function renderEnd() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h3>Quiz beendet</h3>
    <p>Gut gemacht! Du bist am Ende des Quiz angekommen.</p>
    <button onclick="showWarning()">Warnung testen</button>
  `;
}

function next() {
  step += 1;
  started = true;

  if (step === 1) {
    startPolling();
    renderQuestion(step);
    return;
  }

  if (step > 0 && step <= quizData.length) {
    renderQuestion(step);
    return;
  }

  // After the last question: show the warning immediately (no separate "Quiz beendet" screen)
  showWarning();
}

function initialize() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Kurzes interaktives Quiz</h2>
    <p>Cyberangriffe auf Flughäfen</p>
    <button id="startBtn">Start</button>
  `;

  // load Fragen from JSON
  fetch("fragen.json?t=" + Date.now(), { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => {
      if (Array.isArray(data)) quizData = data;
      document.getElementById("startBtn").addEventListener("click", next);
    })
    .catch((err) => {
      console.error("Fehler beim Laden der Fragen:", err);
      document.getElementById("startBtn").addEventListener("click", next);
    });
}

window.addEventListener("DOMContentLoaded", initialize);
