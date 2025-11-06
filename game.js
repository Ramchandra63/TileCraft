/**
 * TileCraft - Enhanced Infinite 2048 Game
 * 
 * Features:
 * - Infinite gameplay with progressive milestones
 * - Dynamic tile colors up to 131072+
 * - Mobile-optimized with proper color display
 * - Progressive target system
 * - Enhanced visual feedback
 * 
 * @version 2.0.0
 */

/* ============================================
   GAME STATE VARIABLES
   ============================================ */

let SIZE = 4;
let GAP = 15;
let cellSize = 0;
let board = [];
let score = 0;
let bestScore = 0;
let moves = 0;
let gameOver = false;
let hasWon = false;
let highestTile = 2;
let currentTarget = 2048;
let mergeCount = 0;
let comboCount = 0;
let lastMoveHadMerge = false;

// Timed mode
let timedMode = false;
let timeLeft = 60;
let timerInterval = null;

// Undo functionality
let history = [];

// Power-up counts
let shuffleCount = 3;
let removeCount = 2;
let bombCount = 2;

// Milestone tracking
let milestones = [2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144];
let achievedMilestones = [];

/* ============================================
   DOM ELEMENT REFERENCES
   ============================================ */

const gridEl = document.getElementById('grid');
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const movesEl = document.getElementById('moves');
const highestTileEl = document.getElementById('highest-tile');
const targetTileEl = document.getElementById('target-tile');
const mergesEl = document.getElementById('merges');
const comboEl = document.getElementById('combo');
const gameOverEl = document.querySelector('.game-over');
const winMessageEl = document.querySelector('.win-message');
const gameContainer = document.getElementById('game-container');
const comboIndicator = document.getElementById('combo-indicator');
const timerEl = document.getElementById('timer');
const timeLeftEl = document.getElementById('time-left');
const milestoneNotification = document.getElementById('milestone-notification');

/* ============================================
   CORE GAME FUNCTIONS
   ============================================ */

function loadBestScore() {
    const saved = localStorage.getItem('tilecraft-best-score');
    if (saved) {
        bestScore = parseInt(saved);
        bestScoreEl.textContent = bestScore;
    }
}

function saveBestScore() {
    localStorage.setItem('tilecraft-best-score', bestScore.toString());
}

function updateGap() {
    GAP = SIZE === 4 ? 15 : SIZE === 5 ? 12 : 10;
}

function getNextTarget(current) {
    for (let milestone of milestones) {
        if (milestone > current) {
            return milestone;
        }
    }
    return current * 2; // For values beyond predefined milestones
}

function init() {
    board = Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));
    score = 0;
    moves = 0;
    gameOver = false;
    hasWon = false;
    highestTile = 2;
    currentTarget = 2048;
    mergeCount = 0;
    comboCount = 0;
    lastMoveHadMerge = false;
    history = [];
    achievedMilestones = [];
    
    shuffleCount = 3;
    removeCount = 2;
    bombCount = 2;
    updatePowerupUI();
    
    if (timedMode) {
        timeLeft = 60;
        timeLeftEl.textContent = timeLeft;
        timerEl.style.display = 'block';
        startTimer();
    } else {
        timerEl.style.display = 'none';
        stopTimer();
    }
    
    updateStats();
    
    gridEl.innerHTML = '';
    gridEl.className = `grid size-${SIZE}`;
    
    updateGap();
    const containerWidth = gridEl.offsetWidth;
    cellSize = (containerWidth - GAP * (SIZE + 1)) / SIZE;
    
    for (let i = 0; i < SIZE * SIZE; i++) {
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        gridEl.appendChild(cell);
    }
    
    gameOverEl.classList.remove('show');
    winMessageEl.classList.remove('show');
    
    addNewTile();
    addNewTile();
    render();
}

/* ============================================
   TIMER FUNCTIONS
   ============================================ */

function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
        timeLeft--;
        timeLeftEl.textContent = timeLeft;
        if (timeLeft <= 0) {
            stopTimer();
            gameOver = true;
            showGameOver();
        }
    }, 1000);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
}

/* ============================================
   TILE MANAGEMENT
   ============================================ */

function addNewTile() {
    const empty = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) empty.push([r, c]);
        }
    }
    if (empty.length > 0) {
        const [r, c] = empty[Math.floor(Math.random() * empty.length)];
        board[r][c] = Math.random() < 0.9 ? 2 : 4;
    }
}

function getTileClass(value) {
    // Return appropriate class for any tile value
    if (value <= 131072) {
        return `tile-${value}`;
    }
    return 'tile-super';
}

function getTileFontSize(value) {
    let fontSize;
    const digits = value.toString().length;
    
    if (SIZE === 6) {
        if (digits >= 6) fontSize = 12;
        else if (digits >= 5) fontSize = 14;
        else if (digits >= 4) fontSize = 16;
        else if (digits >= 3) fontSize = 20;
        else fontSize = 24;
    } else if (SIZE === 5) {
        if (digits >= 6) fontSize = 16;
        else if (digits >= 5) fontSize = 18;
        else if (digits >= 4) fontSize = 20;
        else if (digits >= 3) fontSize = 24;
        else fontSize = 28;
    } else {
        if (digits >= 6) fontSize = 20;
        else if (digits >= 5) fontSize = 24;
        else if (digits >= 4) fontSize = 28;
        else if (digits >= 3) fontSize = 32;
        else if (digits >= 2) fontSize = 36;
        else fontSize = 40;
    }
    
    return fontSize;
}

function render() {
    document.querySelectorAll('.tile').forEach(t => t.remove());
    
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] !== 0) {
                const tile = document.createElement('div');
                const val = board[r][c];
                
                tile.className = `tile ${getTileClass(val)}`;
                tile.textContent = val;
                
                const fontSize = getTileFontSize(val);
                
                tile.style.fontSize = fontSize + 'px';
                tile.style.width = cellSize + 'px';
                tile.style.height = cellSize + 'px';
                tile.style.left = (GAP + c * (cellSize + GAP)) + 'px';
                tile.style.top = (GAP + r * (cellSize + GAP)) + 'px';
                tile.style.lineHeight = cellSize + 'px';
                
                gridEl.appendChild(tile);
            }
        }
    }
}

function updateStats() {
    scoreEl.textContent = score;
    movesEl.textContent = moves;
    highestTileEl.textContent = highestTile;
    targetTileEl.textContent = currentTarget;
    mergesEl.textContent = mergeCount;
    comboEl.textContent = comboCount;
    
    if (score > bestScore) {
        bestScore = score;
        saveBestScore();
    }
    bestScoreEl.textContent = bestScore;
}

/* ============================================
   MILESTONE SYSTEM
   ============================================ */

function checkMilestone(value) {
    if (milestones.includes(value) && !achievedMilestones.includes(value)) {
        achievedMilestones.push(value);
        showMilestone(value);
        currentTarget = getNextTarget(value);
        updateStats();
    }
}

function showMilestone(value) {
    const nextTarget = getNextTarget(value);
    document.getElementById('milestone-value').textContent = value;
    document.getElementById('milestone-next').textContent = nextTarget;
    
    milestoneNotification.classList.add('show');
    
    setTimeout(() => {
        milestoneNotification.classList.remove('show');
    }, 3000);
}

/* ============================================
   UNDO FUNCTIONALITY
   ============================================ */

function saveState() {
    history.push({
        board: board.map(row => [...row]),
        score,
        moves,
        mergeCount,
        highestTile,
        comboCount,
        currentTarget,
        achievedMilestones: [...achievedMilestones]
    });
    if (history.length > 5) history.shift();
}

function undo() {
    if (history.length > 0 && !gameOver) {
        const state = history.pop();
        board = state.board;
        score = state.score;
        moves = state.moves;
        mergeCount = state.mergeCount;
        highestTile = state.highestTile;
        comboCount = state.comboCount;
        currentTarget = state.currentTarget;
        achievedMilestones = state.achievedMilestones;
        updateStats();
        render();
    }
}

/* ============================================
   GAME LOGIC
   ============================================ */

function slideRow(row) {
    let arr = row.filter(val => val !== 0);
    let newRow = [];
    let i = 0;
    let hadMerge = false;
    
    while (i < arr.length) {
        if (i + 1 < arr.length && arr[i] === arr[i + 1]) {
            const mergedValue = arr[i] * 2;
            newRow.push(mergedValue);
            
            const comboBonus = lastMoveHadMerge ? comboCount + 1 : 1;
            score += mergedValue * comboBonus;
            mergeCount++;
            hadMerge = true;
            
            if (mergedValue > highestTile) {
                highestTile = mergedValue;
                checkMilestone(mergedValue);
            }
            i += 2;
        } else {
            newRow.push(arr[i]);
            i++;
        }
    }
    
    if (hadMerge && lastMoveHadMerge) {
        comboCount++;
        showCombo();
    } else if (hadMerge) {
        comboCount = 1;
    } else {
        comboCount = 0;
    }
    
    lastMoveHadMerge = hadMerge;
    
    while (newRow.length < SIZE) newRow.push(0);
    return newRow;
}

function showCombo() {
    document.getElementById('combo-mult').textContent = comboCount + 1;
    comboIndicator.classList.add('show');
    setTimeout(() => comboIndicator.classList.remove('show'), 1000);
}

function move(direction) {
    if (gameOver) return false;
    
    saveState();
    let moved = false;
    const oldBoard = board.map(row => [...row]);
    
    if (direction === 'left') {
        for (let r = 0; r < SIZE; r++) {
            board[r] = slideRow(board[r]);
        }
    } else if (direction === 'right') {
        for (let r = 0; r < SIZE; r++) {
            board[r] = slideRow(board[r].reverse()).reverse();
        }
    } else if (direction === 'up') {
        for (let c = 0; c < SIZE; c++) {
            let col = [];
            for (let r = 0; r < SIZE; r++) col.push(board[r][c]);
            col = slideRow(col);
            for (let r = 0; r < SIZE; r++) board[r][c] = col[r];
        }
    } else if (direction === 'down') {
        for (let c = 0; c < SIZE; c++) {
            let col = [];
            for (let r = 0; r < SIZE; r++) col.push(board[r][c]);
            col = slideRow(col.reverse()).reverse();
            for (let r = 0; r < SIZE; r++) board[r][c] = col[r];
        }
    }
    
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] !== oldBoard[r][c]) moved = true;
        }
    }
    
    if (moved) {
        moves++;
        updateStats();
        setTimeout(() => {
            addNewTile();
            render();
            
            if (!canMove()) {
                gameOver = true;
                showGameOver();
            }
        }, 150);
    } else {
        history.pop();
    }
    
    return moved;
}

function canMove() {
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] === 0) return true;
            if (c < SIZE - 1 && board[r][c] === board[r][c + 1]) return true;
            if (r < SIZE - 1 && board[r][c] === board[r + 1][c]) return true;
        }
    }
    return false;
}

/* ============================================
   WIN/LOSE SCREENS
   ============================================ */

function showWin() {
    const stats = `🎉 Milestone Reached: ${currentTarget}\nScore: ${score} | Moves: ${moves} | Merges: ${mergeCount}`;
    document.getElementById('win-stats').textContent = stats;
    winMessageEl.classList.add('show');
}

function showGameOver() {
    stopTimer();
    const stats = `Final Score: ${score}\nHighest Tile: ${highestTile}\nMoves: ${moves} | Merges: ${mergeCount}`;
    document.getElementById('game-over-stats').textContent = stats;
    gameOverEl.classList.add('show');
}

/* ============================================
   POWER-UP FUNCTIONS
   ============================================ */

function shuffleTiles() {
    if (shuffleCount <= 0 || gameOver) return;
    
    const tiles = [];
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] !== 0) tiles.push(board[r][c]);
        }
    }
    
    for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
    
    let idx = 0;
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            board[r][c] = idx < tiles.length ? tiles[idx++] : 0;
        }
    }
    
    shuffleCount--;
    updatePowerupUI();
    render();
}

function removeSmallest() {
    if (removeCount <= 0 || gameOver) return;
    
    let minVal = Infinity;
    let minPos = null;
    
    for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
            if (board[r][c] !== 0 && board[r][c] < minVal) {
                minVal = board[r][c];
                minPos = [r, c];
            }
        }
    }
    
    if (minPos) {
        board[minPos[0]][minPos[1]] = 0;
        removeCount--;
        updatePowerupUI();
        render();
    }
}

function bombArea() {
    if (bombCount <= 0 || gameOver) return;
    
    const r = Math.floor(Math.random() * SIZE);
    const c = Math.floor(Math.random() * SIZE);
    
    for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < SIZE && nc >= 0 && nc < SIZE) {
                board[nr][nc] = 0;
            }
        }
    }
    
    bombCount--;
    updatePowerupUI();
    render();
}

function updatePowerupUI() {
    document.getElementById('shuffle-count').textContent = shuffleCount;
    document.getElementById('remove-count').textContent = removeCount;
    document.getElementById('bomb-count').textContent = bombCount;
    
    document.getElementById('shuffle-btn').disabled = shuffleCount <= 0;
    document.getElementById('remove-btn').disabled = removeCount <= 0;
    document.getElementById('bomb-btn').disabled = bombCount <= 0;
}

/* ============================================
   INPUT HANDLING
   ============================================ */

document.addEventListener('keydown', e => {
    if (gameOver) return;
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
            e.preventDefault();
            move('left');
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            e.preventDefault();
            move('right');
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            e.preventDefault();
            move('up');
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            e.preventDefault();
            move('down');
            break;
        case 'z':
        case 'Z':
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();
                undo();
            }
            break;
    }
});

// Touch controls
let touchStartX = 0;
let touchStartY = 0;

gameContainer.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

gameContainer.addEventListener('touchmove', e => {
    e.preventDefault();
}, { passive: false });

gameContainer.addEventListener('touchend', e => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const minSwipe = 30;
    
    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) return;
    
    if (Math.abs(dx) > Math.abs(dy)) {
        move(dx > 0 ? 'right' : 'left');
    } else {
        move(dy > 0 ? 'down' : 'up');
    }
}, { passive: true });

/* ============================================
   EVENT LISTENERS
   ============================================ */

document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        SIZE = parseInt(btn.dataset.size);
        init();
    });
});

document.getElementById('new-game').addEventListener('click', init);
document.getElementById('try-again').addEventListener('click', init);
document.getElementById('new-game-win').addEventListener('click', init);
document.getElementById('keep-going').addEventListener('click', () => {
    winMessageEl.classList.remove('show');
});
document.getElementById('undo-btn').addEventListener('click', undo);

document.getElementById('timed-mode').addEventListener('click', function() {
    timedMode = !timedMode;
    this.style.background = timedMode ? 
        'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)' : 
        'linear-gradient(135deg, #8f7a66 0%, #7a6857 100%)';
    this.textContent = timedMode ? '⏱️ Normal' : '⏱️ Timed';
    init();
});

document.getElementById('shuffle-btn').addEventListener('click', shuffleTiles);
document.getElementById('remove-btn').addEventListener('click', removeSmallest);
document.getElementById('bomb-btn').addEventListener('click', bombArea);

/* ============================================
   INITIALIZATION
   ============================================ */

loadBestScore();
init();