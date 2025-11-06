 let SIZE = 4;
        let GAP = 15;
        let board = [];
        let score = 0;
        let bestScore = 0;
        let moves = 0;
        let gameOver = false;
        let hasWon = false;
        let highestTile = 2;
        let mergeCount = 0;
        let comboCount = 0;
        let lastMoveHadMerge = false;
        
        let timedMode = false;
        let timeLeft = 60;
        let timerInterval = null;
        
        let history = [];
        let shuffleCount = 3;
        let removeCount = 2;
        let bombCount = 2;
        
        const gridEl = document.getElementById('grid');
        const scoreEl = document.getElementById('score');
        const bestScoreEl = document.getElementById('best-score');
        const movesEl = document.getElementById('moves');
        const highestTileEl = document.getElementById('highest-tile');
        const mergesEl = document.getElementById('merges');
        const comboEl = document.getElementById('combo');
        const gameOverEl = document.querySelector('.game-over');
        const winMessageEl = document.querySelector('.win-message');
        const gameContainer = document.getElementById('game-container');
        const comboIndicator = document.getElementById('combo-indicator');
        const timerEl = document.getElementById('timer');
        const timeLeftEl = document.getElementById('time-left');
        
        let cellSize = 0;

        function loadBestScore() {
            const saved = localStorage.getItem('2048-best-score');
            if (saved) {
                bestScore = parseInt(saved);
                bestScoreEl.textContent = bestScore;
            }
        }

        function saveBestScore() {
            localStorage.setItem('2048-best-score', bestScore.toString());
        }

        function updateGap() {
            GAP = SIZE === 4 ? 15 : SIZE === 5 ? 12 : 10;
        }

        function init() {
            board = Array(SIZE).fill(0).map(() => Array(SIZE).fill(0));
            score = 0;
            moves = 0;
            gameOver = false;
            hasWon = false;
            highestTile = 2;
            mergeCount = 0;
            comboCount = 0;
            lastMoveHadMerge = false;
            history = [];
            
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

        function render() {
            document.querySelectorAll('.tile').forEach(t => t.remove());
            
            for (let r = 0; r < SIZE; r++) {
                for (let c = 0; c < SIZE; c++) {
                    if (board[r][c] !== 0) {
                        const tile = document.createElement('div');
                        const val = board[r][c];
                        
                        tile.className = `tile tile-${val <= 8192 ? val : 'super'}`;
                        tile.textContent = val;
                        
                        let fontSize;
                        if (SIZE === 6) fontSize = val >= 1024 ? 16 : val >= 100 ? 20 : 24;
                        else if (SIZE === 5) fontSize = val >= 1024 ? 20 : val >= 100 ? 24 : 28;
                        else fontSize = val >= 1024 ? 28 : val >= 128 ? 32 : val >= 100 ? 36 : 40;
                        
                        tile.style.fontSize = fontSize + 'px';
                        tile.style.width = cellSize + 'px';
                        tile.style.height = cellSize + 'px';
                        tile.style.left = (GAP + c * (cellSize + GAP)) + 'px';
                        tile.style.top = (GAP + r * (cellSize + GAP)) + 'px';
                        
                        gridEl.appendChild(tile);
                    }
                }
            }
        }

        function updateStats() {
            scoreEl.textContent = score;
            movesEl.textContent = moves;
            highestTileEl.textContent = highestTile;
            mergesEl.textContent = mergeCount;
            comboEl.textContent = comboCount;
            
            if (score > bestScore) {
                bestScore = score;
                saveBestScore();
            }
            bestScoreEl.textContent = bestScore;
        }

        function saveState() {
            history.push({
                board: board.map(row => [...row]),
                score,
                moves,
                mergeCount,
                highestTile,
                comboCount
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
                updateStats();
                render();
            }
        }

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
                    
                    if (mergedValue > highestTile) highestTile = mergedValue;
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
                    
                    if (!hasWon) {
                        for (let r = 0; r < SIZE; r++) {
                            for (let c = 0; c < SIZE; c++) {
                                if (board[r][c] === 2048) {
                                    hasWon = true;
                                    showWin();
                                    return;
                                }
                            }
                        }
                    }
                    
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

        function showWin() {
            const stats = `Score: ${score} | Moves: ${moves} | Merges: ${mergeCount}`;
            document.getElementById('win-stats').textContent = stats;
            winMessageEl.classList.add('show');
        }

        function showGameOver() {
            stopTimer();
            const stats = `Final Score: ${score}\nMoves: ${moves} | Highest Tile: ${highestTile}`;
            document.getElementById('game-over-stats').textContent = stats;
            gameOverEl.classList.add('show');
        }

        // Powerups
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

        // Keyboard controls
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

        // Touch/swipe controls
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

        // Mode selection
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                SIZE = parseInt(btn.dataset.size);
                init();
            });
        });

        // Button events
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
            this.textContent = timedMode ? '⏱️ Normal Mode' : '⏱️ Timed Mode';
            init();
        });

        // Powerup buttons
        document.getElementById('shuffle-btn').addEventListener('click', shuffleTiles);
        document.getElementById('remove-btn').addEventListener('click', removeSmallest);
        document.getElementById('bomb-btn').addEventListener('click', bombArea);

        // Initialize
        loadBestScore();
        init();