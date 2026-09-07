/* =========================================================
   STUDENT PRODUCTIVITY HUB — JAVASCRIPT
========================================================= */

function trackEvent(eventName, params = {}) {
  if (typeof gtag === "function") {
    gtag("event", eventName, params);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initMobileNav();
  initSmoothScroll();
  initTodoList();
  initPomodoroTimer();
  initCgpaCalculator();
  initStudyTips();
  updateQuickStats();
  document.getElementById("currentYear").textContent = new Date().getFullYear();
});

function initThemeToggle() {
  const toggleBtn = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const root = document.documentElement;

  const savedTheme = localStorage.getItem("sph_theme") || "light";
  applyTheme(savedTheme);

  toggleBtn.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem("sph_theme", next);
  });

  function applyTheme(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      themeIcon.textContent = "☀️";
    } else {
      root.removeAttribute("data-theme");
      themeIcon.textContent = "🌙";
    }
  }
}

function initMobileNav() {
  const navToggle = document.getElementById("navToggle");
  const nav = document.getElementById("primaryNav");

  navToggle.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
    });
  });
}

function initSmoothScroll() {
  const exploreBtn = document.getElementById("exploreBtn");
  if(exploreBtn) {
    exploreBtn.addEventListener("click", () => {
      document.getElementById("tools").scrollIntoView({ behavior: "smooth" });
    });
  }
}

function initTodoList() {
  const form = document.getElementById("todoForm");
  const input = document.getElementById("todoInput");
  const list = document.getElementById("todoList");
  const totalEl = document.getElementById("totalTasks");
  const completedEl = document.getElementById("completedTasks");

  let tasks = JSON.parse(localStorage.getItem("sph_tasks") || "[]");
  renderTasks();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (text === "") return;

    const newTask = { id: Date.now(), text, completed: false };
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    input.value = "";
    input.focus();
    trackEvent("todo_task_added", { task_count: tasks.length });
  });

  function renderTasks() {
    list.innerHTML = "";
    tasks.forEach((task) => {
      const li = document.createElement("li");
      li.className = task.completed ? "completed" : "";

      const span = document.createElement("span");
      span.className = "todo-text";
      span.textContent = task.text;
      span.addEventListener("click", () => toggleTask(task.id));

      const deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = "🗑️";
      deleteBtn.className = "btn-icon";
      deleteBtn.style.width = "30px";
      deleteBtn.style.height = "30px";
      deleteBtn.style.fontSize = "0.9rem";
      deleteBtn.addEventListener("click", () => deleteTask(task.id));

      li.appendChild(span);
      li.appendChild(deleteBtn);
      list.appendChild(li);
    });

    totalEl.textContent = tasks.length;
    completedEl.textContent = tasks.filter((t) => t.completed).length;
    updateQuickStats();
  }

  function toggleTask(id) {
    tasks = tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t);
    saveTasks();
    renderTasks();
  }

  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    saveTasks();
    renderTasks();
  }

  function saveTasks() {
    localStorage.setItem("sph_tasks", JSON.stringify(tasks));
  }
}

function initPomodoroTimer() {
  const WORK_MINUTES = 25;
  let totalSeconds = WORK_MINUTES * 60;
  let timerInterval = null;
  let isRunning = false;

  const display = document.getElementById("pomodoroDisplay");
  const message = document.getElementById("pomodoroMessage");
  const ring = document.querySelector(".pomodoro__ring");
  
  const startBtn = document.getElementById("startTimer");
  const pauseBtn = document.getElementById("pauseTimer");
  const resetBtn = document.getElementById("resetTimer");

  updateDisplay();

  startBtn.addEventListener("click", startTimer);
  pauseBtn.addEventListener("click", pauseTimer);
  resetBtn.addEventListener("click", resetTimer);

  function startTimer() {
    if (isRunning) return;
    isRunning = true;
    message.textContent = "Focus mode on!";
    trackEvent("pomodoro_started", { duration_minutes: WORK_MINUTES });

    timerInterval = setInterval(() => {
      totalSeconds--;
      updateDisplay();

      if (totalSeconds <= 0) {
        clearInterval(timerInterval);
        isRunning = false;
        message.textContent = "⏰ Time's up! Take a short break.";
        incrementStudySessions();
      }
    }, 1000);
  }

  function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    message.textContent = "Timer paused.";
  }

  function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    totalSeconds = WORK_MINUTES * 60;
    message.textContent = "";
    updateDisplay();
  }

  function updateDisplay() {
    const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    display.textContent = `${minutes}:${seconds}`;
    
    // Update ring progress
    const progress = ((WORK_MINUTES * 60 - totalSeconds) / (WORK_MINUTES * 60)) * 100;
    ring.style.background = `conic-gradient(var(--secondary) ${progress}%, var(--primary) 0)`;
  }

  function incrementStudySessions() {
    const count = parseInt(localStorage.getItem("sph_sessions") || "0", 10) + 1;
    localStorage.setItem("sph_sessions", count.toString());
    updateQuickStats();
  }
}

function initCgpaCalculator() {
  const form = document.getElementById("cgpaForm");
  const nameInput = document.getElementById("subjectName");
  const creditsInput = document.getElementById("subjectCredits");
  const gradeInput = document.getElementById("subjectGrade");
  const subjectList = document.getElementById("subjectList");
  const cgpaValue = document.getElementById("cgpaValue");
  const resetBtn = document.getElementById("resetCgpa");

  let subjects = JSON.parse(localStorage.getItem("sph_subjects") || "[]");

  renderSubjects();
  calculateCgpa();

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = nameInput.value.trim();
    const credits = parseFloat(creditsInput.value);
    const gradePoint = parseFloat(gradeInput.value);

    if (name === "" || isNaN(credits) || isNaN(gradePoint)) return;

    subjects.push({ name, credits, gradePoint });
    saveSubjects();
    renderSubjects();
    calculateCgpa();

    form.reset();
    nameInput.focus();
  });

  resetBtn.addEventListener("click", () => {
    subjects = [];
    saveSubjects();
    renderSubjects();
    calculateCgpa();
  });

  function renderSubjects() {
    subjectList.innerHTML = "";
    subjects.forEach((subj, idx) => {
      const li = document.createElement("li");
      li.style.display = 'flex';
      li.style.justifyContent = 'space-between';
      
      const span = document.createElement('span');
      span.textContent = `${subj.name} (Cr: ${subj.credits}, GP: ${subj.gradePoint})`;
      
      const del = document.createElement('button');
      del.textContent = '✕';
      del.style.color = 'var(--danger)';
      del.addEventListener('click', () => {
        subjects.splice(idx, 1);
        saveSubjects();
        renderSubjects();
        calculateCgpa();
      });
      
      li.appendChild(span);
      li.appendChild(del);
      subjectList.appendChild(li);
    });
    updateQuickStats();
  }

  function calculateCgpa() {
    if (subjects.length === 0) {
      cgpaValue.textContent = "0.00";
      return;
    }

    const totalCredits = subjects.reduce((sum, s) => sum + s.credits, 0);
    const weightedSum = subjects.reduce((sum, s) => sum + s.credits * s.gradePoint, 0);

    const cgpa = totalCredits > 0 ? weightedSum / totalCredits : 0;
    cgpaValue.textContent = cgpa.toFixed(2);
    trackEvent("cgpa_calculated", { subject_count: subjects.length, cgpa: Number(cgpa.toFixed(2)) });
  }

  function saveSubjects() {
    localStorage.setItem("sph_subjects", JSON.stringify(subjects));
  }
}

const STUDY_TIPS = [
  "Use the Pomodoro technique: study in focused 25-minute bursts.",
  "Avoid distractions — put your phone in another room while studying.",
  "Make a daily study plan and stick to it as much as possible.",
  "Take short breaks every hour to keep your mind fresh.",
  "Revise regularly instead of cramming right before exams.",
  "Practice with past questions instead of only reading notes.",
  "Teach someone else what you've learned to cement your knowledge.",
  "Ensure you get 7-8 hours of sleep for memory consolidation."
];

function initStudyTips() {
  const tipText = document.getElementById("studyTipText");
  const tipBtn = document.getElementById("randomTipBtn");
  const tipsGrid = document.getElementById("tipsGrid");

  STUDY_TIPS.forEach((tip) => {
    const card = document.createElement("div");
    card.className = "tip-card";
    card.textContent = tip;
    tipsGrid.appendChild(card);
  });

  tipBtn.addEventListener("click", () => {
    const randomIndex = Math.floor(Math.random() * STUDY_TIPS.length);
    tipText.textContent = STUDY_TIPS[randomIndex];
    tipText.style.animation = 'none';
    tipText.offsetHeight; /* trigger reflow */
    tipText.style.animation = 'pulse 0.5s ease';
    trackEvent("study_tip_viewed", { tip_index: randomIndex });
  });
}

function updateQuickStats() {
  const tasks = JSON.parse(localStorage.getItem("sph_tasks") || "[]");
  const sessions = parseInt(localStorage.getItem("sph_sessions") || "0", 10);
  const subjects = JSON.parse(localStorage.getItem("sph_subjects") || "[]");

  const completedTasks = tasks.filter((t) => t.completed).length;
  const score = Math.min(100, completedTasks * 10 + sessions * 15);

  const statTasksCompleted = document.getElementById("statTasksCompleted");
  const statStudySessions = document.getElementById("statStudySessions");
  const statSubjects = document.getElementById("statSubjects");
  const statProductivity = document.getElementById("statProductivity");

  if (statTasksCompleted) statTasksCompleted.textContent = completedTasks;
  if (statStudySessions) statStudySessions.textContent = sessions;
  if (statSubjects) statSubjects.textContent = subjects.length;
  if (statProductivity) statProductivity.textContent = `${score}%`;
}
