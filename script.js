const quizData = [
  {
    question: "Wie lange dauert die Brute Force Methode bei modernen Sicherheitssystemen?",
    answers: ["Wenige Tage", "Mehrere Wochen", "Mehrere Jahre"],
  },
  {
    question: "Was ist das Hauptziel von Phishing-Angriffen?",
    answers: ["Daten stehlen", "Server zerstören", "Netzwerke lahmlegen"],
  },
  {
    question: "Was ist ein wichtiger Schutz vor Ransomware?",
    answers: ["Regelmäßige Backups", "Kommentare in HTML", "Browser-Design ändern"],
  },
  {
    question: "Was bedeutet Sicherheitsbewusstsein?",
    answers: ["Auf Gefahren achten", "Nur Social Media nutzen", "Jeden Tag Spiele spielen"],
  },
  {
    question: "Wie reagierst du bei einer ungewöhnlichen E-Mail?",
    answers: ["Nicht öffnen und melden", "Einfach anklicken", "Antworten mit Passwort"],
  },
];

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

  setInterval(async () => {
    if (!started || triggered) return;

    try {
      const response = await fetch("state.json?t=" + Date.now());
      const data = await response.json();

      if (data.trigger === true) {
        triggered = true;
        showWarning();
      }
    } catch (error) {
      console.log("Fehler beim Laden:", error);
    }
  }, 1000);
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

  const answersHtml = question.answers
    .map((answer) => `<button onclick="next()">${answer}</button>`)
    .join("");

  content.innerHTML = `
    <h3>Frage ${index}</h3>
    <p>${question.question}</p>
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

  renderEnd();
}

function initialize() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h2>Kurzes interaktives Quiz</h2>
    <p>Cyberangriffe auf Flughäfen</p>
    <button onclick="next()">Start</button>
  `;
}

window.addEventListener("DOMContentLoaded", initialize);
