const GRID_SIZE = 9;
const ROUND_SECONDS = 30;
const STORAGE_KEY = 'whackamole-difficulty';
const EXPLOSION_MS = 350;

const DIFFICULTIES = [
  { label: 'Leicht', emoji: '🐢', color: '#8FE388', moleVisibleMs: 1100, fakeChance: 0.08 },
  { label: 'Mittel', emoji: '🐹', color: '#5D3FDF', moleVisibleMs: 800,  fakeChance: 0.18 },
  { label: 'Schwer', emoji: '🔥', color: '#F06868', moleVisibleMs: 550,  fakeChance: 0.30 },
];

const startScreen = document.getElementById('start-screen');
const playScreen = document.getElementById('play-screen');
const difficultySlider = document.getElementById('difficulty');
const difficultyEmoji = document.getElementById('difficultyEmoji');
const ticks = document.querySelectorAll('.tick');
const startBtn = document.getElementById('startBtn');
const changeDifficultyBtn = document.getElementById('changeDifficulty');

const grid = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const timeEl = document.getElementById('time');
const resultEl = document.getElementById('result');
const restartBtn = document.getElementById('restart');

let score = 0;
let timeLeft = ROUND_SECONDS;
let holes = [];
let moleTimer = null;
let countdownTimer = null;
let activeHole = null;
let running = false;
let currentDifficulty = DIFFICULTIES[1];

function updateDifficultyUI(index) {
  const difficulty = DIFFICULTIES[index];
  difficultyEmoji.textContent = difficulty.emoji;
  difficultySlider.style.setProperty('--thumb-color', difficulty.color);
  ticks.forEach(tick => {
    tick.classList.toggle('active', Number(tick.dataset.index) === index);
  });
  localStorage.setItem(STORAGE_KEY, String(index));
}

function initDifficultyPicker() {
  const stored = localStorage.getItem(STORAGE_KEY);
  const storedIndex = stored === null ? NaN : Number(stored);
  const initialIndex = Number.isInteger(storedIndex) && DIFFICULTIES[storedIndex] ? storedIndex : 1;
  difficultySlider.value = initialIndex;
  updateDifficultyUI(initialIndex);
}

difficultySlider.addEventListener('input', () => {
  updateDifficultyUI(Number(difficultySlider.value));
});

function buildGrid() {
  grid.innerHTML = '';
  holes = [];
  for (let i = 0; i < GRID_SIZE; i++) {
    const hole = document.createElement('div');
    hole.className = 'hole';
    hole.addEventListener('click', () => whack(hole));
    grid.appendChild(hole);
    holes.push(hole);
  }
}

function showMole() {
  if (activeHole) {
    activeHole.classList.remove('active', 'fake');
    activeHole.textContent = '';
  }
  const next = holes[Math.floor(Math.random() * holes.length)];
  const isFake = Math.random() < currentDifficulty.fakeChance;
  next.classList.add(isFake ? 'fake' : 'active');
  if (isFake) {
    next.textContent = '💣';
  } else {
    const img = document.createElement('img');
    img.src = 'mole.png';
    img.alt = 'Maulwurf';
    img.className = 'mole-img';
    next.appendChild(img);
  }
  activeHole = next;
}

function explode(hole) {
  hole.classList.add('exploding');
  hole.textContent = '💥';
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 * i) / 8 + (Math.random() * 0.4 - 0.2);
    const distance = 30 + Math.random() * 20;
    const particle = document.createElement('span');
    particle.className = 'particle';
    particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
    particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
    hole.appendChild(particle);
  }
  setTimeout(() => {
    hole.classList.remove('exploding', 'fake');
    hole.textContent = '';
    hole.querySelectorAll('.particle').forEach(p => p.remove());
  }, EXPLOSION_MS);
}

function pauseSpawning() {
  clearInterval(moleTimer);
  setTimeout(() => {
    if (running) moleTimer = setInterval(showMole, currentDifficulty.moleVisibleMs);
  }, EXPLOSION_MS);
}

function whack(hole) {
  if (!running || hole !== activeHole) return;
  if (hole.classList.contains('fake')) {
    score = Math.max(0, score - 1);
    scoreEl.textContent = score;
    activeHole = null;
    explode(hole);
    pauseSpawning();
  } else {
    score += 1;
    scoreEl.textContent = score;
    hole.classList.remove('active');
    hole.textContent = '';
    activeHole = null;
  }
}

function tick() {
  timeLeft -= 1;
  timeEl.textContent = timeLeft;
  if (timeLeft <= 0) endGame();
}

function startGame(difficulty) {
  currentDifficulty = difficulty;
  score = 0;
  timeLeft = ROUND_SECONDS;
  scoreEl.textContent = score;
  timeEl.textContent = timeLeft;
  resultEl.textContent = '';
  restartBtn.style.display = 'none';
  changeDifficultyBtn.style.display = 'none';
  running = true;
  buildGrid();
  moleTimer = setInterval(showMole, currentDifficulty.moleVisibleMs);
  countdownTimer = setInterval(tick, 1000);
}

function endGame() {
  running = false;
  clearInterval(moleTimer);
  clearInterval(countdownTimer);
  holes.forEach(h => {
    h.classList.remove('active', 'fake', 'exploding');
    h.textContent = '';
    h.querySelectorAll('.particle').forEach(p => p.remove());
  });
  resultEl.textContent = `Runde vorbei – Punkte: ${score}`;
  restartBtn.style.display = 'inline-block';
  changeDifficultyBtn.style.display = 'inline-block';
}

startBtn.addEventListener('click', () => {
  startScreen.hidden = true;
  playScreen.hidden = false;
  startGame(DIFFICULTIES[Number(difficultySlider.value)]);
});

restartBtn.addEventListener('click', () => startGame(currentDifficulty));

changeDifficultyBtn.addEventListener('click', () => {
  running = false;
  clearInterval(moleTimer);
  clearInterval(countdownTimer);
  playScreen.hidden = true;
  startScreen.hidden = false;
});

initDifficultyPicker();
