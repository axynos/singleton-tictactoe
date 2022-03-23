// Max two players
let players
let currentPlayer
let computerPlayer
let winningPlayer
let stalemate = false
let gameLoaded = false
let waitingForComputer = false
let computerTurnTimeout
let boardSize
const defaultBoardSize = 3
let errorMessage
let lastPlayedCell

// Display current state of game to user
const updateStatusDisplay = () => {
  const currentStatusElement = document.getElementById('display-status')
  const states = {
    playing: `Current Player: ${currentPlayer}`,
    playingComputer: `Computer (${currentPlayer}) is playing.`,
    won: `Player ${winningPlayer} won.`,
    stalemate: 'Game ended in stalemate.',
    error: `Error: ${errorMessage}`
  }

  let content = states.playing

  if (currentPlayer == computerPlayer) content = states.playingComputer
  if (winningPlayer) content = states.won
  if (stalemate) content = states.stalemate
  if (errorMessage) content = states.error

  currentStatusElement.innerText = content
}

const doGameTick = () => {
  calculateBoardState()
  switchPlayer()
  updateStatusDisplay()

  if (!winningPlayer
      && !stalemate
      && currentPlayer == computerPlayer) {
    doComputerTurn();
  } 
}

const switchPlayer = () => {
  // Filter removes undefined elements
  const otherPlayer = players.map(player => {
    if (player != currentPlayer) {
      return player
    }
  }).filter(val => val)[0]

  currentPlayer = otherPlayer
}

// Based on gist
// Used to get board with columns as elements
// https://gist.github.com/femto113/1784503
const transposeArray = (array) => {
  const transposedArray = array[0].map((_, c) => {
    return array.map((r) => {
      return r[c]
    })
  })
  return transposedArray
}

const getCell = (row, col) => {
  return document.getElementById(`cell-${row+1}-${col+1}`)
}

const getCells = () => {
  return document.getElementsByClassName('cell')
}

const getAvailableCells = () => {
  const allCells = Array.from(getCells())
  const availableCells = allCells.filter(cell => {
    for (player of players) {
      if (isCellMarked(cell)) return false
    }

    return true
  })

  return availableCells
}

const handleCellClick = (event) => {
  if (waitingForComputer) return

  const cell = event.target
  doTurn(cell)
}

const doMove = (cell) => {
  markCell(cell)
  doGameTick()
}


const doTurn = (cell) => {
  // Guard: Allow moves only if game has loaded
  if (!gameLoaded) return

  // Guard: Allow move only if no winning player exists
  if (winningPlayer) return

  // Guard: Allow move if cell not already marked
  if (isCellMarked(cell)) return

  doMove(cell)
}

const doComputerTurn = () => {
  waitingForComputer = true

  const center = Math.round(boardSize/2)-1
  let cellToMark = { row: center, col: center}

  if (lastPlayedCell) {
    const { row, col } = lastPlayedCell
    const lastCellAtEdge = isCellAtEdge(lastPlayedCell.row, lastPlayedCell.col)
    const lastCellAtAnyEdge = Object.values(lastCellAtEdge).some(atEdge => atEdge == true)


    if (lastCellAtAnyEdge) {
      const { top, bottom, left, right } = lastCellAtEdge

      // Sides
      if (top) { cellToMark = { row, col: col+1 } }
      if (bottom) { cellToMark = { row, col: col-1 } }
      if (left) { cellToMark = { row: row-1, col } }
      if (right) { cellToMark = { row: row+1, col } }

      // Corners
      if (top && left) { cellToMark = { row, col: col+1 } }
      if (top && right) { cellToMark = { row: row+1, col } }
      if (bottom && left) { cellToMark = { row: row-1, col } }
      if (bottom && right) { cellToMark = { row, col: col-1 } }
    } else {
      cellToMark = { row, col: col+1 }
    }
  }

  let cellToMarkElement = getCell(cellToMark.row, cellToMark.col)
  if (isCellMarked(cellToMarkElement)) {
    const availableCells = getAvailableCells()
    cellToMarkElement = availableCells[Math.floor(Math.random()*availableCells.length)]
  }

  computerTurnTimeout = setTimeout(() => {
    doMove(cellToMarkElement)
    waitingForComputer = false
  }, computerDelay)
}

const isCellAtEdge = (row, col) => {
  let top = false
  let bottom = false
  let left = false
  let right = false

  if (row == 0) top = true
  if (row == boardSize-1) bottom = true

  if (col == 0) left = true
  if (col == boardSize-1) right = true

  return {
    top,
    bottom,
    left,
    right
  }
}

const markCell = (cell) => {
  cell.classList.add(currentPlayer)
  cell.innerText = currentPlayer.toUpperCase()

  const parts = cell.id.split('-')
  const row = parts[1]
  const col = parts[2]

  lastPlayedCell = {
    element: cell,
    row: row-1,
    col: col-1
  }
}

const isCellMarked = (cell) => {
  for (player of players) {
    if (cell.classList.contains(player)) {
      return true
    }
  }

  return false
}

const markCellsAsWon = ({ diagonal, row: wonRow, column: wonCol }) => {
  if (diagonal) {
    if (diagonal == 'primary') {
      // Create diagonals for the board
      for (let row = 0; row < boardSize; row++) {
        const cell = getCell(row, row)
        cell.classList.add('won')
      }
    } else {
      // Create diagonals for the board
      for (let row = 0; row < boardSize; row++) {
        const cell = getCell(row, boardSize-1-row)
        cell.classList.add('won')
      }
    }
  }

  if (Number.isInteger(wonRow)) {
    let cells = []
    for (let col = 0; col < boardSize; col++) {
      const cell = getCell(wonRow, col)
      cells.push(cell)
    }

    for (cell of cells) {
      cell.classList.add('won')
    }
  }

  console.log(wonCol)
  if (Number.isInteger(wonCol)) {
    let cells = []
    for (let row = 0; row < boardSize; row++) {
      const cell = getCell(row, wonCol)
      cells.push(cell)
    }

    for (cell of cells) {
      cell.classList.add('won')
    }
  }
}

const checkIfPlayerWon = (playerBoard) => {
  const columns = playerBoard
  const rows = transposeArray(columns)

  let primaryDiagonal = []
  let secondaryDiagonal = []
  let diagonals = [primaryDiagonal, secondaryDiagonal]

  // Create diagonals for the board
  for (let row = 0; row < rows.length; row++) {
    primaryDiagonal.push(rows[row][row])
    secondaryDiagonal.push(rows[row][rows.length-1-row])
  }

  let won = false

  for (const [index, row] of rows.entries()) {
    if (row.every(val => val == true)) {
      won = true

      if (won) {
        markCellsAsWon({ row: index })
      }
      break
    }
  }

  for (const [index, column] of columns.entries()) {
    if (column.every(val => val == true)) {
      won = true

      if (won) {
        markCellsAsWon({ column: index })
      }
      break
    }
  }

  for (const [index, diagonal] of diagonals.entries()) {
    if (diagonal.every(val => val == true)) {
      won = true
      
      if (won && index==0) {
        markCellsAsWon({ diagonal: 'primary' })
      }

      if (won && index==1) {
        markCellsAsWon({ diagonal: 'secondary' })
      }
    }
  }

  return won
}

const calculatePlayerState = (player) => {
  const cells = getCells()
  let board = []
  
  for (let col = 0; col < boardSize; col++) {
    let rowState = []
    for (let row = 0; row < boardSize; row++) {
      const cellId = `cell-${row+1}-${col+1}`
      const cell = cells[cellId]
      if (cell.classList.contains(player)) {
        rowState.push(true)
      }
      else {
        rowState.push(false)
      }
    }

    board.push(rowState)
  }

  return board
}

const calculateBoardState = () => {
  for (player of players) {
    const playerState = calculatePlayerState(player)
    const playerHasWon = checkIfPlayerWon(playerState)

    if (playerHasWon) {
      winningPlayer = player
      break
    }
  }

  const cells = getCells()
  const cellCount = cells.length
  let markedCellCount = 0
  for (cell of cells) {
    for (player of players) {
      if (cell.classList.contains(player)) {
        markedCellCount += 1
        break
      }
    }
  }

  if (markedCellCount == cellCount && !winningPlayer) {
    stalemate = true
  }
}

const generateGame = () => {
  const board = document.getElementById('board')
  const boardSizeInput = document.getElementById('input-board-size')
  boardSize = boardSizeInput.valueAsNumber ?? board.dataset.boardSize

  // Guard: Generate only if board size is compatible with the game.
  if (boardSize % 2 == 0 || boardSize < 3) {
    errorMessage = 'Board size is not compatible with the game.'
    return false
  }

  players = board.dataset.players.split(',')
  currentPlayer = players[0]
  
  const inputFirstPlayer = document.getElementById('input-first-player')
  currentPlayer = inputFirstPlayer.value

  const inputComputerPlayer = document.getElementById('input-computer-player')
  computerPlayer = inputComputerPlayer.value != '-' ? inputComputerPlayer.value : board.dataset.computerPlayer
  computerDelay = board.dataset.computerDelay ?? 500

  for (let row = 0; row < boardSize; row++) {
    for (let col = 0; col < boardSize; col++) {
      const cell = document.createElement('div')
      const content = document.createElement('a')

      cell.classList.add('cell-container')
      content.classList.add('cell')
      content.id = `cell-${row+1}-${col+1}`

      cell.appendChild(content)
      board.appendChild(cell)
    }
  }

  const cellStyle = `repeat(${boardSize}, 1fr)`
  board.style = `grid-template-columns: ${cellStyle}; grid-template-rows: ${cellStyle};`

  const cells = getCells()

  for (cell of cells) {
    cell.addEventListener('click', handleCellClick)
  }

  return true
}

const resetGame = () => {
  const board = document.getElementById('board')
  board.innerHTML = ''

  if (computerTurnTimeout) {
    clearTimeout(computerTurnTimeout)
    computerTurnTimeout = undefined
  }

  waitingForComputer = false
  errorMessage = undefined
  lastPlayedCell = undefined
  gameLoaded = false

  winningPlayer = undefined
  stalemate = false
}

handleInputChange = (event) => {
  resetGame()
  generateGame()

  updateStatusDisplay()
  if (computerPlayer == currentPlayer) doComputerTurn()
  gameLoaded = true
}

window.onload = () => {
  const board = generateGame()

  const boardSizeInput = document.getElementById('input-board-size')
  const computerPlayerInput = document.getElementById('input-computer-player')
  const firstPlayerInput = document.getElementById('input-first-player')
  boardSizeInput.addEventListener('change', handleInputChange)
  computerPlayerInput.addEventListener('change', handleInputChange)
  firstPlayerInput.addEventListener('change', handleInputChange)

  updateStatusDisplay()
  if (computerPlayer == currentPlayer) doComputerTurn()
  gameLoaded = true
}
