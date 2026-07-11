const diceContainer = document.getElementById('dice-container');
const resultText = document.getElementById('result');
const styleButtons = document.querySelectorAll('.style-btn');
const addBtn = document.getElementById('add-btn');
const removeBtn = document.getElementById('remove-btn');
const diceCountText = document.getElementById('dice-count');
const rollBtn = document.getElementById('roll-btn');

let isRolling = false; 
let shakeEnabled = false;
let lastShakeTime = 0;
const SHAKE_DEBOUNCE = 500; 

let currentDiceCount = 0;
let currentStyle = 'classic'; 

// We explicitly set data-value="1" and coordinates to 0 so the math never breaks
const diceHTML = `
  <div class="scene">
    <div class="cube dice-style-classic" data-value="1" data-x="0" data-y="0">
      <div class="face front one"><div class="dot"></div></div>
      <div class="face back six"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      <div class="face right three"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      <div class="face left four"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
      <div class="face top two"><div class="dot"></div><div class="dot"></div></div>
      <div class="face bottom five"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
    </div>
  </div>
`;

// --- ADD & REMOVE DICE ---
function addDice() {
  if (currentDiceCount >= 6) return; 
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = diceHTML.trim();
  const newScene = tempDiv.firstChild;

  // Tapping the wrapper toggles the hold
  newScene.addEventListener('click', () => {
    if (isRolling) return; 
    newScene.classList.toggle('held');
  });

  diceContainer.appendChild(newScene);
  currentDiceCount++;
  diceCountText.textContent = `${currentDiceCount} Dice`;
  setDiceStyle(currentStyle); 
}

function removeDice() {
  if (currentDiceCount <= 1) return; 
  diceContainer.removeChild(diceContainer.lastElementChild);
  currentDiceCount--;
  diceCountText.textContent = `${currentDiceCount} Dice`;
}

// --- STYLE SWITCHING ---
function setDiceStyle(style) {
  currentStyle = style;
  document.querySelectorAll('.cube').forEach(die => {
    die.classList.remove('dice-style-classic', 'dice-style-red', 'dice-style-white', 'dice-style-colorful');
    die.classList.add(`dice-style-${style}`);
  });
  styleButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.style === style);
  });
}

styleButtons.forEach(btn => btn.addEventListener('click', () => setDiceStyle(btn.dataset.style)));

// --- THE ROLLING LOGIC ---
function rollAllDice() {
  if (isRolling) return;
  
  const allScenes = document.querySelectorAll('.scene');
  const heldScenes = document.querySelectorAll('.scene.held');
  
  if (heldScenes.length === allScenes.length && allScenes.length > 0) {
    resultText.textContent = "All dice are held!";
    return;
  }

  isRolling = true;
  let totalScore = 0;
  resultText.textContent = "Rolling...";

  allScenes.forEach(scene => {
    const die = scene.querySelector('.cube');
    
    // If held, just add its value and skip animation
    if (scene.classList.contains('held')) {
      totalScore += parseInt(die.dataset.value);
      return; 
    }

    const roll = Math.floor(Math.random() * 6) + 1;
    die.dataset.value = roll; 
    totalScore += roll;
    
    const extraSpins = 5 + Math.floor(Math.random() * 5); 
    let targetX = 0, targetY = 0;

    switch (roll) {
      case 1: targetX = 0;   targetY = 0;   break;
      case 6: targetX = 0;   targetY = 180; break;
      case 3: targetX = 0;   targetY = -90; break;
      case 4: targetX = 0;   targetY = 90;  break;
      case 2: targetX = -90; targetY = 0;   break;
      case 5: targetX = 90;  targetY = 0;   break;
    }

    let currentX = parseFloat(die.dataset.x) || 0;
    let currentY = parseFloat(die.dataset.y) || 0;

    currentX += (extraSpins * 360) + targetX - (currentX % 360);
    currentY += (extraSpins * 360) + targetY - (currentY % 360);

    die.dataset.x = currentX;
    die.dataset.y = currentY;

    die.style.transform = `rotateY(${currentY}deg) rotateX(${currentX}deg)`;
  });

  setTimeout(() => {
    resultText.textContent = `Total: ${totalScore}`;
    isRolling = false;
  }, 1000);
}

// --- SHAKE DETECTION LOGIC ---
function enableShake() {
  if (shakeEnabled) return; 
  shakeEnabled = true;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  if (isIOS && typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
    DeviceMotionEvent.requestPermission()
      .then(permissionState => {
        if (permissionState === 'granted') window.addEventListener('devicemotion', handleMotion);
      }).catch(console.error);
  } else {
    window.addEventListener('devicemotion', handleMotion);
  }
}

function handleMotion(event) {
  const threshold = 25;
  const accel = event.accelerationIncludingGravity;
  if (!accel) return;

  const magnitude = Math.sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z);
  const now = Date.now();

  if (magnitude > threshold && (now - lastShakeTime) > SHAKE_DEBOUNCE) {
    lastShakeTime = now;
    rollAllDice();
  }
}

// --- INITIALIZATION ---
addBtn.addEventListener('click', addDice);
removeBtn.addEventListener('click', removeDice);

// Use the dedicated button instead of clicking the background
rollBtn.addEventListener('click', () => {
  rollAllDice();
  if (!shakeEnabled) setTimeout(enableShake, 100);
});

// Start with 1 die
addDice();
