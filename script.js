// Note: Kleine Änderung für einen No-Op-Commit, um GitHub Actions neu zu triggern.
// Implementiert: zeitgesteuerter Trigger via `triggerTime` in Trigger.json
let quizData = [];

let step = 0;
let started = false;
let triggered = false;
const userAgent = navigator.userAgent;

function getDevice() {
  if (/mobile/i.test(userAgent)) return "Smartphone";
  if (/tablet/i.test(userAgent)) return "Tablet";
  return "Laptop";
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
  const GITHUB_TRIGGER_URL = "https://raw.githubusercontent.com/OsDotPrey/Interaktives-Quiz/main/Trigger.json";

  const fetchTrigger = async () => {
    const base = GITHUB_TRIGGER_URL || "Trigger.json";
    try {
      const res = await fetch(base + "?t=" + Date.now(), { cache: "no-store" });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();
      console.debug("Trigger fetch result:", data);
      // Prüfe zeitgesteuerten Trigger
      if (data && data.triggerTime) {
        const triggerTime = new Date(data.triggerTime);
        const now = new Date();
        console.debug("Now:", now.toISOString(), "TriggerTime:", triggerTime.toISOString());
        if (now >= triggerTime) {
          console.info("Trigger time reached — showing warning.");
          triggered = true;
          showWarning();
        } else {
          console.debug("Trigger time not reached yet.");
        }
      }
      // Fallback: prüfe alten boolean trigger (rückwärtskompatibel)
      else if (data && data.trigger === true) {
        triggered = true;
        showWarning();
      }
    } catch (err) {
      // don't spam console on every poll
      console.debug("Trigger fetch failed:", err.message);
    }
  };

  // Do an immediate check once, then poll every 2 seconds while quiz is running
  fetchTrigger();
  setInterval(() => {
    if (!started || triggered) return;
    fetchTrigger();
  }, 2000);
}

function showWarning() {
  const content = document.getElementById("content");
  content.innerHTML = `
    <h3>WARNUNG!</h3>
    <p>Sie könnten bereits gefährdet sein!</p>
    <p>Was würde Ihr Chef von Ihnen denken?</p>
    <p>Sie haben:</p>
    <ul style="text-align: left;">
      <li>die Cookies angenommen, ohne nachzudenken!</li>
      <li>die Schulungsunterlagen wohl einfach im Schnell-Durchlauf durchgeklickt!</li>
    </ul>
    <p><strong>Bitte seien Sie vorsichtig und vertrauen Sie nicht jedem QR-Code!</strong></p>
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
    .map((answer, i) => `<button onclick="answerQuestion(${i})" data-index="${i}">${answer}</button>`)
    .join("");

  content.innerHTML = `
    <h3>Frage ${index}</h3>
    <p>${question.question || "(keine Frage)"}</p>
    ${answersHtml}
  `;
}

function answerQuestion(selectedIndex) {
  const question = quizData[step - 1];
  const correctIndex = question.correct;
  const buttons = document.querySelectorAll("button[data-index]");

  // Disable all buttons
  buttons.forEach((btn) => {
    btn.onclick = null;
    btn.style.pointerEvents = "none";
  });

  if (selectedIndex === correctIndex) {
    // Correct answer - make button green
    buttons[selectedIndex].classList.add("correct");
  } else {
    // Wrong answer - make selected button red, correct button green border
    buttons[selectedIndex].classList.add("wrong");
    buttons[correctIndex].classList.add("correct-hint");
  }

  // Show "next question" button outside .card with transition
  const nextButtonContainer = document.getElementById("nextButtonContainer");
  nextButtonContainer.innerHTML = "";
  const nextBtn = document.createElement("button");
  nextBtn.textContent = "nächste Frage";
  nextBtn.id = "nextBtn";
  nextBtn.onclick = () => {
    // Hide button with transition, then load next question
    nextButtonContainer.classList.remove("visible");
    setTimeout(() => {
      next();
    }, 400);
  };
  nextButtonContainer.appendChild(nextBtn);
  // Trigger transition by adding class after a tiny delay
  requestAnimationFrame(() => {
    nextButtonContainer.classList.add("visible");
  });
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
    <button id="checkTriggerBtn" style="margin-left:10px;">Prüfe Trigger jetzt</button>
  `;

  // load Fragen from JSON
  fetch("fragen.json?t=" + Date.now(), { cache: "no-store" })
    .then((r) => r.json())
    .then((data) => {
      if (Array.isArray(data)) {
        quizData = data;
        // Shuffle questions randomly for each participant
        quizData.sort(() => Math.random() - 0.5);
      }
      document.getElementById("startBtn").addEventListener("click", next);
    })
    .catch((err) => {
      console.error("Fehler beim Laden der Fragen:", err);
      document.getElementById("startBtn").addEventListener("click", next);
    });

  // Manuelle Trigger-Prüfung für Debug/Test
  window.checkTriggerNow = async function() {
    try {
      const base = ""; // use configured URL inside startPolling
      // call fetchTrigger by temporarily invoking startPolling's inner fetch
      const GITHUB_TRIGGER_URL = "https://raw.githubusercontent.com/OsDotPrey/Interaktives-Quiz/main/Trigger.json";
      const res = await fetch((GITHUB_TRIGGER_URL || "Trigger.json") + "?t=" + Date.now(), { cache: "no-store" });
      const data = await res.json();
      console.log('Manual check result:', data);
      if (data && data.triggerTime && new Date() >= new Date(data.triggerTime)) {
        showWarning();
      } else if (data && data.trigger === true) {
        showWarning();
      } else {
        alert('Trigger noch nicht erreicht');
      }
    } catch (e) {
      console.error('Manual trigger check failed', e);
      alert('Fehler beim Prüfen des Triggers. Siehe Konsole.');
    }
  };
  document.getElementById('checkTriggerBtn').addEventListener('click', () => window.checkTriggerNow());
}

window.addEventListener("DOMContentLoaded", initialize);
