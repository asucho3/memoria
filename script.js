const game = document.querySelector('.game');
const options = document.querySelector('.options');
const timer = document.querySelector('.timer');

let GAME_WIDTH = 4;
let GAME_HEIGHT = 4;
let CELL_COUNT = GAME_WIDTH * GAME_HEIGHT;
const RANDOM_UPPERCASE_VALUE = 3;
const WRONG_TIMEOUT = 800;

class Cell {
  constructor(x, y, value) {
    this.x = x;
    this.y = y;
    this.value = value;
  }
}

let charArr = [];
let emptyPosArr = [];
let cellArr = [];
let selectedCellArr = [];
let interval;

// Set the grid size
game.style.gridTemplateColumns = `repeat(${GAME_WIDTH}, 1fr)`;
game.style.gridTemplateRows = `repeat(${GAME_HEIGHT}, 1fr)`;

// Convert a number to a character
const pickChar = function (number) {
  const random = Math.floor(Math.random() * 10);
  const char =
    random > RANDOM_UPPERCASE_VALUE
      ? String.fromCharCode(number + 97).toUpperCase()
      : String.fromCharCode(number + 97);
  return char;
};

// Fisher-Yates algorithm to shuffle a finite sequence
const shuffle = function (arr) {
  let currentIndex = arr.length;
  let randomIndex;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [arr[currentIndex], arr[randomIndex]] = [
      arr[randomIndex],
      arr[currentIndex],
    ];
  }

  return arr;
};

// Fill up the characters array, which will be "consumed" when creating the game area
const fillCharArr = function () {
  for (let i = 0; i < CELL_COUNT / 2; i++) {
    let foundChar = false;
    let char;
    while (!foundChar) {
      const randomNumber = Math.floor(Math.random() * 20);
      char = pickChar(randomNumber);
      if (!charArr.includes(char)) {
        foundChar = true;
      }
    }
    charArr.push(char);
  }
};

// Initialize the empty positions array, which will be "consumed" when creating the game area
const emptyPositions = function () {
  for (let i = 0; i < GAME_HEIGHT; i++) {
    for (let j = 0; j < GAME_WIDTH; j++) {
      emptyPosArr.push(`${i},${j}`);
    }
  }
};

// Generate the game array
const createCellArray = function () {
  for (let i = 0; i < CELL_COUNT / 2; i++) {
    // 1- Get a character from the char array
    const char = charArr.pop();

    // 2- Get a position from the empty positions array
    const [x1, y1] = emptyPosArr
      .pop()
      .split(',')
      .map((el) => Number(el));

    // 3- Create a cell object with x,y,value and push it to a master array
    const cell = new Cell(x1, y1, char);
    cellArr.push(cell);

    // 4- Get another position from the empty positions array and assign the same value
    const [x2, y2] = emptyPosArr
      .pop()
      .split(',')
      .map((el) => Number(el));

    const duplicateCell = new Cell(x2, y2, char);
    cellArr.push(duplicateCell);
  }
};

// Handle the cell selection by the user
const selectedCell = function (el) {
  // Start the timer if it hasn't been activated yet
  if (!interval) startTimer();

  // If the array is full, exit (because there is a 'wrong' animation in progress)
  // Also exit if this cell is 'ok' or 'wrong'
  if (selectedCellArr.length > 1) return;
  if (el.classList.contains('ok') || el.classList.contains('wrong')) return;

  // Deselect the cell if it was previously selected, and remove it from the comparison array
  if (el.classList.contains('selected')) {
    el.classList.remove('selected');
    selectedCellArr.pop();
    return;
  }

  el.classList.add('selected');

  // Add the cell to the comparison array
  selectedCellArr.push(el);

  // If this is the first selected cell, exit the function
  if (selectedCellArr.length === 1) return;

  el.classList.remove('selected');

  // Compare the selected cells
  if (selectedCellArr[0].dataset.value === selectedCellArr[1].dataset.value) {
    selectedCellArr.forEach((el) => {
      el.classList.add('ok');
      selectedCellArr = [];
    });
  } else {
    selectedCellArr.forEach((el) => {
      el.classList.add('wrong');
      setTimeout(() => {
        el.classList.remove('wrong');
        el.classList.remove('selected');
        selectedCellArr = [];
      }, WRONG_TIMEOUT);
    });
  }
};

// callback for the 'click' event listeners in the 'game'
const callBackFn = function (e) {
  const parentCell = e.target.closest('.cell');
  if (!parentCell) return;
  selectedCell(parentCell.querySelector('.cell-back'));
};

// Generate the markup and add event listeners
const generateMarkup = function () {
  // remove previous event listener
  game.removeEventListener('click', callBackFn);

  game.innerHTML = '';
  for (let i = 0; i < GAME_HEIGHT; i++) {
    for (let j = 0; j < GAME_WIDTH; j++) {
      const newCell = `
                        <div class="cell">
                            <div class="cell-back" data-x="${j}" data-y="${i}" data-value=""></div>
                            <div class="cell-front"></div>
                        </div>
                    `;
      game.insertAdjacentHTML('beforeend', newCell);
    }
  }

  // add the event listener
  game.addEventListener('click', callBackFn);
};

// Set the char values for the DOM elements
const setCells = function () {
  cellArr.forEach((cellObj) => {
    const cellEl = document.querySelector(
      `.cell-back[data-x="${cellObj.x}"][data-y="${cellObj.y}"]`
    );
    cellEl.setAttribute('data-value', cellObj.value);
    cellEl.textContent = cellObj.value;
  });
};

// Define the function to check for a winner
const checkWinner = function () {
  let win = true;
  const allCells = document.querySelectorAll('.cell-back');
  allCells.forEach((el) => {
    if (!el.classList.contains('ok')) win = false;
  });
  return win;
};

// Clear the timer
const clearTimer = function () {
  clearInterval(interval);
  interval = undefined;
  timer.textContent = '00:00';
};

// Start the timer
const startTimer = function () {
  // Begin the timer
  interval = setInterval(() => {
    // Check for win condition
    const win = checkWinner();
    if (win) {
      clearInterval(interval);
      game.classList.add('winner');
      return;
    }
    let [minutes, seconds] = timer.textContent.split(':');
    seconds++;
    if (seconds === 60) {
      seconds = 0;
      minutes++;
    }
    seconds = String(seconds).padStart(2, '0');
    minutes = String(minutes).padStart(2, '0');
    timer.textContent = `${minutes}:${seconds}`;
  }, 1000);
};

const init = function (restart = false, changeSize) {
  if (restart) {
    GAME_WIDTH += changeSize;
    GAME_HEIGHT += changeSize;
    CELL_COUNT = GAME_WIDTH * GAME_HEIGHT;

    // Clear the arrays
    charArr = [];
    emptyPosArr = [];
    cellArr = [];
    selectedCellArr = [];

    // Set the grid size
    game.style.gridTemplateColumns = `repeat(${GAME_WIDTH}, 1fr)`;
    game.style.gridTemplateRows = `repeat(${GAME_HEIGHT}, 1fr)`;
  }

  clearTimer();
  game.classList.remove('winner');
  fillCharArr();
  emptyPositions();
  shuffle(emptyPosArr);
  createCellArray();
  generateMarkup();
  setCells();
};

// Options
const changeGameSize = function (e) {
  if (!e.target.classList.contains('btn')) return;
  if (e.target.classList.contains('btn-increase')) {
    if (GAME_WIDTH < 8) init(true, 2);
  }
  if (e.target.classList.contains('btn-decrease')) {
    if (GAME_WIDTH > 2) init(true, -2);
  }
  if (e.target.classList.contains('btn-restart')) {
    init(true, 0);
  }
};

options.addEventListener('click', function (e) {
  changeGameSize(e);
});

init();
