const game = {
    info: {
        html: undefined,
        board: [],
        boardCopy: [],
        size: 10,
        numMines: 10,
        remainFlags: 10,
        playing: true,
        replaying: false,
        moves: [],
        sounds: {
            start: new Audio('assets/audios/start.wav'),
            click: new Audio('assets/audios/click.wav'),
            flag: new Audio('assets/audios/flag.wav'),
            win: new Audio('assets/audios/win.wav'),
            lose: new Audio('assets/audios/lose.wav'),
        }
    },
    init: () => {
        console.log("%c Game Started!", "color: green");

        game.info.playing = true;
        game.info.replaying = false;
        game.info.html.style.cursor = "pointer";
        game.createBoard();
        game.generateMines();
        game.calculateMines();

        try {
            document.getElementById('timeWin').innerHTML = 0;
            document.getElementById('movesWin').innerHTML = 0;
            document.getElementById('win').classList.remove('win-active');
        }
        catch {

        }
    },
    createBoard: () => {
        const size = game.info.size;

        // Create the board
        for (let r = 0; r < size; r++) {
            game.info.board[r] = [];

            const row = document.createElement('tr');
            row.classList.add('row');
            row.id = `row-${r}`;
            game.info.html.appendChild(row);

            for (let c = 0; c < size; c++) {
                game.info.board[r][c] = 0;

                const cell = document.createElement('td');
                cell.classList.add('cell');
                cell.id = `cell-${r}-${c}`;
                cell["row"] = r;
                cell["col"] = c;
                cell.addEventListener('click', function () {
                    if (game.info.playing) {
                        game.handelOnClick(this);
                    }
                })
                cell.addEventListener('contextmenu', function (e) {
                    e.preventDefault();

                    if (game.info.playing) {
                        game.placeFlag(this);
                    }
                })
                document.getElementById(`row-${r}`).appendChild(cell);
            }
        }
    },
    generateMines: () => {
        for (let i = 0; i < game.info.numMines; i++) {
            const row = Math.floor(Math.random() * game.info.size);
            const cell = Math.floor(Math.random() * game.info.size);

            // Check if the cell already has a mine
            if (game.info.board[row][cell] === -1) {
                i--;
                continue;
            }

            game.info.board[row][cell] = -1;
        }
    },
    calculateMines: () => {
        for (let r = 0; r < game.info.board.length; r++) {
            for (let c = 0; c < game.info.board[r].length; c++) {
                if (game.info.board[r][c] === -1) {
                    continue;
                }

                let minesBeside = 0;

                for (let ir = -1; ir <= 1; ir++) {
                    for (let ic = -1; ic <= 1; ic++) {
                        try {
                            if (game.info.board[r + ir][c + ic] === -1) {
                                minesBeside++;
                            }
                        }
                        catch {

                        }
                    }
                }

                game.info.board[r][c] = minesBeside;
            }
        }

        game.info.boardCopy = {...game.info.board};
    },
    handelOnClick: (cell) => {
        if (cell.clicked || (!game.info.playing && !game.info.replaying)) {
            return
        }

        if (cell['flagged']) {
            game.cancelFlag(cell);
            game.info.moves.push({
                action: 'click',
                cell: cell,
            });
            return;
        }

        if (game.info.moves.length === 0 && game.info.playing) {
            timer.start();
        }

        if (game.isMine(cell)) {
            game.lose(cell);
            return;
        }

        const row = cell.row;
        const col = cell.col;
        const text = game.info.board[row][col];

        if (text !== 0) {
            cell.style.color = game.getColor(text);
            cell.innerHTML = text;
        } else if (!cell['flagged']) {
            game.spreadOut(cell);
        }

        cell.style.boxShadow = "-2px -2px rgb(157, 157, 157) inset";
        cell.style.background = "rgb(180, 180, 180)";
        cell['clicked'] = true;

        game.info.sounds.click.currentTime = 0;
        game.info.sounds.click.play();

        game.checkWin();

        game.info.moves.push({
            action: 'click',
            cell: cell,
        });
    },
    spreadOut: (cell) => {
        // BFS (written by ChatGPT)
        const queue = [];
        const visited = new Set();

        queue.push(cell);
        visited.add(`cell-${cell.row}-${cell.col}`);

        while (queue.length > 0) {
            const current = queue.shift();
            const row = current.row;
            const col = current.col;

            // Check all neighbors
            for (let r = -1; r <= 1; r++) {
                for (let c = -1; c <= 1; c++) {
                    const newRow = row + r;
                    const newCol = col + c;

                    // If out of bounds, skip
                    if (newRow < 0 || newCol < 0 || newRow >= game.info.size || newCol >= game.info.size) {
                        continue
                    };

                    // If already visited, skip
                    const id = `cell-${newRow}-${newCol}`;
                    if (visited.has(id)) {
                        continue;
                    }

                    const neighborCell = game.info.html.rows[newRow].cells[newCol];

                    if (!game.isMine(neighborCell) && !neighborCell.clicked && !neighborCell.flagged) {
                        neighborCell.clicked = true;
                        neighborCell.style.boxShadow = "-2px -2px rgb(157, 157, 157) inset";
                        neighborCell.style.background = "rgb(180, 180, 180)";
                        const text = game.info.board[newRow][newCol];

                        if (text > 0) {
                            neighborCell.innerHTML = text;
                            neighborCell.style.color = game.getColor(text);
                        } else {
                            queue.push(neighborCell);
                        }
                    }

                    visited.add(id);
                }
            }
        }
    },
    lose: (cell) => {
        game.info.playing = false;
        game.info.html.style.cursor = "auto";
        cell.style.background = "rgb(255, 0, 0)";

        for (let r = 0; r < game.info.size; r++) {
            for (let c = 0; c < game.info.size; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);

                if (game.isMine(cell)) {
                    if (cell.flagged) {
                        cell.removeChild(cell.childNodes[0]);

                        const flaggedMine = document.createElement('img');
                        flaggedMine.src = "assets/images/mine_flagged.png";
                        flaggedMine.classList.add('mine');
                        cell.appendChild(flaggedMine);

                        continue;
                    } 

                    const mine = document.createElement('img');
                    mine.src = "assets/images/mine.png";
                    mine.classList.add('mine');
                    cell.appendChild(mine);
                } else if (cell.flagged) {
                    cell.removeChild(cell.childNodes[0]);

                    const wrongFlag = document.createElement('img');
                    wrongFlag.src = "assets/images/flag_incorrect.png";
                    wrongFlag.classList.add('mine');
                    cell.appendChild(wrongFlag);
                }
            }
        }

        game.info.sounds.lose.currentTime = 0;
        game.info.sounds.lose.play();

        timer.stop();
    },
    win: () => {
        game.info.playing = false;
        game.info.html.style.cursor = "auto";

        for (let r = 0; r < game.info.size; r++) {
            for (let c = 0; c < game.info.size; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);

                if (game.isMine(cell)) {
                    if (cell.flagged) {
                        cell.removeChild(cell.childNodes[0]);

                        const flaggedMine = document.createElement('img');
                        flaggedMine.src = "assets/images/mine_flagged.png";
                        flaggedMine.classList.add('mine');
                        cell.appendChild(flaggedMine);

                        continue;
                    } 

                    const mine = document.createElement('img');
                    mine.src = "assets/images/mine.png";
                    mine.classList.add('mine');
                    cell.appendChild(mine);
                } else if (cell.flagged) {
                    cell.removeChild(cell.childNodes[0]);

                    const wrongFlag = document.createElement('img');
                    wrongFlag.src = "assets/images/flag_incorrect.png";
                    wrongFlag.classList.add('mine');
                    cell.appendChild(wrongFlag);
                }
            }
        }

        game.info.sounds.win.currentTime = 0;
        game.info.sounds.win.play();

        timer.stop();

        if (!game.info.replaying) {
            document.getElementById('timeWin').innerHTML = timer.timer.time;
            document.getElementById('movesWin').innerHTML = game.info.moves.length;
            document.getElementById('win').classList.add('win-active');
        }
    },
    placeFlag: (cell) => {
        if (cell.clicked || cell.flagged || game.info.remainFlags <= 0 || game.info.moves.length <= 0 || (!game.info.playing && !game.info.replaying)) {
            return;
        }

        cell['flagged'] = true;

        const flag = document.createElement('img');
        flag.src = "assets/images/flag.png";
        flag.classList.add('flag');
        cell.appendChild(flag);

        game.info.remainFlags--;
        game.info.sounds.flag.currentTime = 0;
        game.info.sounds.flag.play();
        game.info.moves.push({
            action: 'flag',
            cell: cell,
        });

        document.getElementById('flagsRemain').innerHTML = game.info.remainFlags;
    },
    cancelFlag: (cell) => {
        if (cell.clicked || !cell.flagged || (!game.info.playing && !game.info.replaying)) {
            return;
        }

        cell['flagged'] = false;
        cell.removeChild(cell.childNodes[0]);

        game.info.remainFlags++;

        document.getElementById('flagsRemain').innerHTML = game.info.remainFlags;
    },
    checkWin: () => {
        let win = true;

        for (let r = 0; r < game.info.size; r++) {
            for (let c = 0; c < game.info.size; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);

                if (!game.isMine(cell) && !cell.clicked) {
                    win = false;
                    break;
                }
            }
        }

        if (win) {
            game.win();
        }
    },
    isMine: (cell) => {
        const row = cell.row;
        const col = cell.col;

        if (game.info.board[row][col] === -1) {
            return true;
        }

        return false;
    },
    replay: async () => {
        console.log("%c Watching replay!", "color: green");

        document.getElementById('win').classList.remove('win-active');

        game.info.playing = false;
        game.info.replaying = true;

        game.info.remainFlags = 10;
        document.getElementById('flagsRemain').innerHTML = game.info.remainFlags;
        
        game.info.html.style.cursor = "auto";
        game.info.board = {...game.info.boardCopy};
        for (let r = 0; r < game.info.size; r++) {
            for (let c = 0; c < game.info.size; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                cell.innerHTML = "";
                cell.style.boxShadow = "4px 4px rgb(225, 225, 225) inset, -4px -4px rgb(123, 123, 123) inset";
                cell['clicked'] = false;
                cell['flagged'] = false;
            }
        }

        for (let i = 0; i < game.info.moves.length; i++) {
            await sleep(1000);
            if (game.info.moves[i].action === 'click') {
                game.handelOnClick(game.info.moves[i].cell);
            } else if (game.info.moves[i].action === 'flag') {
                game.placeFlag(game.info.moves[i].cell);
            }
        }

        game.info.moves.length = 0;
    },
    getColor: (num) => {
        switch (num) {
            case 1:
                return "blue";

            case 2:
                return "green";

            case 3:
                return "red";

            case 4:
                return "purple";

            default:
                return "black";
        }
    },
    clear: () => {
        document.getElementById('minesweeper').innerHTML = "";
        game.info.board = [];
        game.info.playing = false;
        game.info.moves.length = 0;

        game.info.remainFlags = 10;
        document.getElementById('flagsRemain').innerHTML = game.info.remainFlags;

        if (timer.timer.timer) {
            timer.stop();
            timer.timer.time = 0;
            timer.timer.timer.innerHTML = timer.timer.time;
        }
    },
}

const timer = {
    timer: {
        time: 0,
        timer: undefined,
        interval: undefined,
    },
    start: () => {
        timer.timer.timer = document.getElementById('timer');

        timer.timer.interval = setInterval(() => {
            timer.timer.time++
            timer.timer.timer.innerHTML = timer.timer.time;
        }, 1000);
    },
    stop: () => {
        clearInterval(timer.timer.interval);
    },
}

const sleep = (duration) => {
    return new Promise(resolve => {
        setTimeout(resolve, duration);
    });
}

window.onload = () => {
    const gameBoard = document.getElementById('minesweeper');
    game.info.html = gameBoard;

    document.getElementById('flagsRemain').innerHTML = game.info.remainFlags;
    
    const reset = document.getElementById('reset');
    reset.addEventListener('mouseover', () => {
        reset.style.animation = "rotate 0.75s";
    });
    reset.addEventListener('mouseout', () => {
        reset.style.animation = "none";
    });
    reset.addEventListener('click', () => {
        if (confirm("Are you sure you want to restart")) {
            game.clear();
            game.init();
        }
    });

    game.init();
}
