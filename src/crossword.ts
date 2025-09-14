// ===== IMPORTS =====
import { WORDS_TEMPLATE } from "./words-template.js";

// ===== INTERFACES (DATA TYPES) =====

// Interface describes the structure of one word in the crossword
interface Word {
  text: string; // The word itself (example: "HTML")
  clue: string; // Question-hint (example: "Markup language for web pages")
  startX: number; // Starting position on X axis (column)
  startY: number; // Starting position on Y axis (row)
  direction: "across" | "down"; // Direction: horizontal or vertical
  number: number; // Question number (1, 2, 3...)
}

// ===== MAIN GAME CLASS =====
export class CrosswordGame {
  // PRIVATE PROPERTIES (accessible only within the class)
  private words: Word[] = []; // Array of all words
  private grid: (string | null)[][] = []; // Two-dimensional array for the grid
  private gridSize = 16; // Grid width (16 columns)
  private gridHeight = 12; // Grid height (12 rows) - optimized
  private currentWord: Word | null = null; // Currently selected word
  private completedWords: Set<number> = new Set(); // Numbers of completed words
  private userInputs: Map<string, string> = new Map(); // User input by positions

  // HTML ELEMENTS (obtained through DOM API)
  private gridContainer: HTMLElement | null = null; // Container for grid
  private acrossClues: HTMLElement | null = null; // Container for horizontal clues
  private downClues: HTMLElement | null = null; // Container for vertical clues

  // CONSTRUCTOR (executed when object is created)
  constructor() {
    this.gridContainer = document.getElementById("crossword-grid");
    this.acrossClues = document.getElementById("across-clues");
    this.downClues = document.getElementById("down-clues");

    if (!this.gridContainer) {
      console.error("Element 'crossword-grid' not found!");
      return;
    }
    if (!this.acrossClues) {
      console.error("Element 'across-clues' not found!");
      return;
    }
    if (!this.downClues) {
      console.error("Element 'down-clues' not found!");
      return;
    }

    try {
      this.initializeGrid();
      this.setupWords();
      this.placeWordsInGrid();
      this.renderGrid();
      this.applyWordColors();
      this.renderClues();
    } catch (error) {
      console.error("Error during initialization:", error);
    }
  }

  // ===== FUNCTION 1: CREATE EMPTY GRID =====
  private initializeGrid(): void {
    this.grid = [];

    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridSize; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  // ===== FUNCTION 2: SETUP WORDS =====
  private setupWords(): void {
    // Import words from external file
    this.words = WORDS_TEMPLATE;
  }
  // ===== FUNCTION 3: PLACE WORDS IN GRID =====
  private placeWordsInGrid(): void {
    this.words.forEach((word) => {
      for (let i = 0; i < word.text.length; i++) {
        let x, y;

        if (word.direction === "across") {
          x = word.startX + i;
          y = word.startY;
        } else {
          x = word.startX;
          y = word.startY + i;
        }

        if (x < this.gridSize && y < this.gridHeight) {
          this.grid[y][x] = word.text[i];
        }
      }
    });
  }

  // ===== FUNCTION 4: RENDER GRID =====
  private renderGrid(): void {
    if (!this.gridContainer) {
      console.error("Grid container not found in renderGrid!");
      return;
    }

    this.gridContainer.innerHTML = "";

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        if (this.grid[y][x] !== null) {
          const input = document.createElement("input");
          input.type = "text";
          input.maxLength = 1;
          input.style.border = "none";
          input.style.background = "transparent";
          input.style.textAlign = "center";
          input.style.fontSize = "20px";
          input.style.fontWeight = "bold";
          input.style.width = "100%";
          input.style.height = "100%";
          input.style.outline = "none";
          input.style.textTransform = "uppercase";

          input.value = "";
          input.style.color = "#333";

          input.addEventListener("input", (e) => {
            const target = e.target as HTMLInputElement;
            const value = target.value.toUpperCase();
            target.value = value;

            this.userInputs.set(`${x}-${y}`, value);

            if (value === this.grid[y][x]) {
              target.style.color = "#27ae60";
              target.classList.remove("shake");
              this.checkWordCompletion();
              this.moveToNextCell(x, y);
            } else if (value !== "") {
              target.style.color = "#e74c3c";
              target.classList.add("shake");
              setTimeout(() => target.classList.remove("shake"), 500);
            } else {
              target.style.color = "#333";
              target.classList.remove("shake");
            }
          });

          input.addEventListener("focus", () => {
            this.highlightCurrentWord(x, y);
          });

          input.addEventListener("keydown", (e) => {
            this.handleKeyNavigation(e, x, y);
          });

          cell.appendChild(input);

          const wordNumber = this.getWordNumber(x, y);
          if (wordNumber) {
            const numberSpan = document.createElement("span");
            numberSpan.className = "cell-number";
            numberSpan.textContent = wordNumber.toString();
            numberSpan.style.position = "absolute";
            numberSpan.style.top = "2px";
            numberSpan.style.left = "2px";
            numberSpan.style.fontSize = "10px";
            numberSpan.style.fontWeight = "bold";
            numberSpan.style.color = "#333";
            numberSpan.style.pointerEvents = "none";
            cell.appendChild(numberSpan);
          }
        } else {
          cell.classList.add("blocked");
        }

        if (this.gridContainer) {
          this.gridContainer.appendChild(cell);
        }
      }
    }
  }

  // ===== FUNCTION 5: GET WORD NUMBER =====
  private getWordNumber(x: number, y: number): number | null {
    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];
      if (word.startX === x && word.startY === y) {
        return word.number;
      }
    }
    return null;
  }

  // ===== FUNCTION 6: RENDER CLUES =====
  private renderClues(): void {
    if (!this.acrossClues || !this.downClues) {
      console.error("Clue containers not found in renderClues!");
      return;
    }

    this.acrossClues.innerHTML = "";
    this.downClues.innerHTML = "";

    const acrossWords = [];
    const downWords = [];

    for (let i = 0; i < this.words.length; i++) {
      const word = this.words[i];
      if (word.direction === "across") {
        acrossWords.push(word);
      } else {
        downWords.push(word);
      }
    }

    for (let i = 0; i < acrossWords.length; i++) {
      const word = acrossWords[i];
      const clueElement = document.createElement("div");
      clueElement.className = "clue-item clickable";
      clueElement.innerHTML = `<span class="clue-number">${word.number}.</span> <span class="clue-text">${word.clue}</span>`;
      clueElement.dataset.wordNumber = word.number.toString();
      clueElement.dataset.direction = "across";

      clueElement.addEventListener("click", () => {
        this.selectWordByNumber(word.number);
      });

      if (this.acrossClues) {
        this.acrossClues.appendChild(clueElement);
      }
    }

    for (let i = 0; i < downWords.length; i++) {
      const word = downWords[i];
      const clueElement = document.createElement("div");
      clueElement.className = "clue-item clickable";
      clueElement.innerHTML = `<span class="clue-number">${word.number}.</span> <span class="clue-text">${word.clue}</span>`;
      clueElement.dataset.wordNumber = word.number.toString();
      clueElement.dataset.direction = "down";

      clueElement.addEventListener("click", () => {
        this.selectWordByNumber(word.number);
      });

      if (this.downClues) {
        this.downClues.appendChild(clueElement);
      }
    }

    const buttonsContainer = document.createElement("div");
    buttonsContainer.style.margin = "20px 0";
    buttonsContainer.style.display = "flex";
    buttonsContainer.style.gap = "10px";
    buttonsContainer.style.flexWrap = "wrap";

    const resetBtn = document.createElement("button");
    resetBtn.textContent = "🔄 Reset Crossword";
    resetBtn.style.padding = "12px 20px";
    resetBtn.style.background = "#e74c3c";
    resetBtn.style.color = "white";
    resetBtn.style.border = "none";
    resetBtn.style.borderRadius = "8px";
    resetBtn.style.cursor = "pointer";
    resetBtn.style.fontSize = "14px";
    resetBtn.style.fontWeight = "bold";

    resetBtn.addEventListener("click", () => {
      this.resetCrossword();
    });

    buttonsContainer.appendChild(resetBtn);

    if (this.downClues) {
      this.downClues.appendChild(buttonsContainer);
    }
  }

  // ===== FUNCTION 8: APPLY WORD COLORS =====
  private applyWordColors(): void {
    // Color coding disabled - all cells same color
  }

  // ===== NEW INTERACTIVE METHODS =====

  // Select word by number and focus on first cell
  private selectWordByNumber(wordNumber: number): void {
    let word = null;
    for (let i = 0; i < this.words.length; i++) {
      if (this.words[i].number === wordNumber) {
        word = this.words[i];
        break;
      }
    }
    if (!word) return;

    this.currentWord = word;

    // Find correct index for input element
    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>;

    let inputIndex = 0;
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.grid[y][x] !== null) {
          if (x === word.startX && y === word.startY) {
            const firstInput = inputs[inputIndex];
            if (firstInput) {
              firstInput.focus();
              firstInput.select();
              // Highlight the entire word
              this.highlightWord(word);
            }
            return;
          }
          inputIndex++;
        }
      }
    }
  }

  // Highlight word when focusing on cell
  private highlightCurrentWord(x: number, y: number): void {
    const containingWords = [];

    for (let w = 0; w < this.words.length; w++) {
      const word = this.words[w];
      for (let i = 0; i < word.text.length; i++) {
        let wordX, wordY;
        if (word.direction === "across") {
          wordX = word.startX + i;
          wordY = word.startY;
        } else {
          wordX = word.startX;
          wordY = word.startY + i;
        }

        if (wordX === x && wordY === y) {
          containingWords.push(word);
          break;
        }
      }
    }

    if (containingWords.length > 0) {
      let wordToHighlight = containingWords[0];

      if (this.currentWord) {
        for (let i = 0; i < containingWords.length; i++) {
          if (containingWords[i] === this.currentWord) {
            wordToHighlight = this.currentWord;
            break;
          }
        }
      }

      this.currentWord = wordToHighlight;
      this.highlightWord(wordToHighlight);
    }
  }

  // Highlight all cells of the word
  private highlightWord(word: Word): void {
    // Remove previous highlights
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("highlighted", "current-word");
    });

    // Highlight clue
    document.querySelectorAll(".clue-item").forEach((clueElement) => {
      const clue = clueElement as HTMLElement;
      clue.classList.remove("active");
      if (clue.dataset.wordNumber === word.number.toString()) {
        clue.classList.add("active");
      }
    });

    // Highlight word cells
    for (let i = 0; i < word.text.length; i++) {
      let x, y;
      if (word.direction === "across") {
        x = word.startX + i;
        y = word.startY;
      } else {
        x = word.startX;
        y = word.startY + i;
      }

      if (x < this.gridSize && y < this.gridHeight) {
        const cellIndex = y * this.gridSize + x;
        const cells = document.querySelectorAll(
          ".cell"
        ) as NodeListOf<HTMLElement>;
        const cell = cells[cellIndex];

        if (cell && !cell.classList.contains("blocked")) {
          cell.classList.add("highlighted", "current-word");
        }
      }
    }
  }

  // Check if word is completed
  private checkWordCompletion(): void {
    for (let w = 0; w < this.words.length; w++) {
      const word = this.words[w];
      let isComplete = true;
      let userWord = "";

      // Check each letter of the word
      for (let i = 0; i < word.text.length; i++) {
        let x, y;
        if (word.direction === "across") {
          x = word.startX + i;
          y = word.startY;
        } else {
          x = word.startX;
          y = word.startY + i;
        }

        const userInput = this.userInputs.get(`${x}-${y}`) || "";
        const correctLetter = this.grid[y][x];

        if (userInput !== correctLetter) {
          isComplete = false;
          break;
        }
        userWord += userInput;
      }

      if (
        isComplete &&
        userWord === word.text &&
        !this.completedWords.has(word.number)
      ) {
        this.completedWords.add(word.number);
        this.markWordAsCompleted(word.number);
        this.animateWordCompletion(word);
      }
    }
  }

  // Mark clue as completed with strikethrough
  private markWordAsCompleted(wordNumber: number): void {
    const clueElements = document.querySelectorAll(
      `[data-word-number="${wordNumber}"]`
    );
    clueElements.forEach((clue) => {
      clue.classList.add("completed");
      const clueText = clue.querySelector(".clue-text") as HTMLElement;
      if (clueText) {
        clueText.style.textDecoration = "line-through";
        clueText.style.opacity = "0.6";
        clueText.style.color = "#27ae60";
      }
    });
  }

  // Animate word completion
  private animateWordCompletion(word: Word): void {
    for (let i = 0; i < word.text.length; i++) {
      const x = word.direction === "across" ? word.startX + i : word.startX;
      const y = word.direction === "across" ? word.startY : word.startY + i;

      if (x < this.gridSize && y < this.gridHeight) {
        const cellIndex = y * this.gridSize + x;
        const cells = document.querySelectorAll(
          ".cell"
        ) as NodeListOf<HTMLElement>;
        const cell = cells[cellIndex];

        if (cell) {
          cell.classList.add("word-complete");
          setTimeout(() => {
            cell.classList.remove("word-complete");
          }, 1000);
        }
      }
    }
  }

  // ===== AUTOMATIC MOVE TO NEXT CELL =====
  // Move to next cell in current word after correct input
  private moveToNextCell(currentX: number, currentY: number): void {
    if (!this.currentWord) return;

    // Find position of current cell in the word
    let currentPosition = -1;
    for (let i = 0; i < this.currentWord.text.length; i++) {
      const wordX =
        this.currentWord.direction === "across"
          ? this.currentWord.startX + i
          : this.currentWord.startX;
      const wordY =
        this.currentWord.direction === "across"
          ? this.currentWord.startY
          : this.currentWord.startY + i;

      if (wordX === currentX && wordY === currentY) {
        currentPosition = i;
        break;
      }
    }

    if (
      currentPosition !== -1 &&
      currentPosition < this.currentWord.text.length - 1
    ) {
      const nextPosition = currentPosition + 1;
      const nextX =
        this.currentWord.direction === "across"
          ? this.currentWord.startX + nextPosition
          : this.currentWord.startX;
      const nextY =
        this.currentWord.direction === "across"
          ? this.currentWord.startY
          : this.currentWord.startY + nextPosition;

      const inputs = document.querySelectorAll(
        ".cell input"
      ) as NodeListOf<HTMLInputElement>;

      let inputIndex = 0;
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridSize; x++) {
          if (this.grid[y][x] !== null) {
            if (x === nextX && y === nextY) {
              const nextInput = inputs[inputIndex];
              if (nextInput) {
                setTimeout(() => {
                  nextInput.focus();
                  nextInput.select();
                }, 100);
              }
              return;
            }
            inputIndex++;
          }
        }
      }
    }
  }

  // ===== KEYBOARD NAVIGATION =====
  private handleKeyNavigation(
    e: KeyboardEvent,
    currentX: number,
    currentY: number
  ): void {
    const key = e.key;

    if (key === "Backspace") {
      const target = e.target as HTMLInputElement;
      if (target.value === "" && this.currentWord) {
        e.preventDefault();
        this.moveToPreviousCell(currentX, currentY);
      }
      return;
    }

    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === "ArrowDown"
    ) {
      e.preventDefault();
      this.navigateWithArrows(key, currentX, currentY);
      return;
    }

    if (key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        this.moveToPreviousCell(currentX, currentY);
      } else {
        this.moveToNextCell(currentX, currentY);
      }
      return;
    }
  }

  // Move to previous cell in current word
  private moveToPreviousCell(currentX: number, currentY: number): void {
    if (!this.currentWord) return;

    // Find position of current cell in the word
    let currentPosition = -1;
    for (let i = 0; i < this.currentWord.text.length; i++) {
      const wordX =
        this.currentWord.direction === "across"
          ? this.currentWord.startX + i
          : this.currentWord.startX;
      const wordY =
        this.currentWord.direction === "across"
          ? this.currentWord.startY
          : this.currentWord.startY + i;

      if (wordX === currentX && wordY === currentY) {
        currentPosition = i;
        break;
      }
    }

    if (currentPosition > 0) {
      const prevPosition = currentPosition - 1;
      const prevX =
        this.currentWord.direction === "across"
          ? this.currentWord.startX + prevPosition
          : this.currentWord.startX;
      const prevY =
        this.currentWord.direction === "across"
          ? this.currentWord.startY
          : this.currentWord.startY + prevPosition;

      this.focusOnCell(prevX, prevY);
    }
  }

  // Arrow navigation
  private navigateWithArrows(
    key: string,
    currentX: number,
    currentY: number
  ): void {
    let targetX = currentX;
    let targetY = currentY;

    switch (key) {
      case "ArrowLeft":
        targetX = Math.max(0, currentX - 1);
        break;
      case "ArrowRight":
        targetX = Math.min(this.gridSize - 1, currentX + 1);
        break;
      case "ArrowUp":
        targetY = Math.max(0, currentY - 1);
        break;
      case "ArrowDown":
        targetY = Math.min(this.gridHeight - 1, currentY + 1);
        break;
    }

    if (this.grid[targetY][targetX] !== null) {
      this.focusOnCell(targetX, targetY);
    }
  }

  // Focus on specific cell
  private focusOnCell(targetX: number, targetY: number): void {
    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>;

    let inputIndex = 0;
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.grid[y][x] !== null) {
          if (x === targetX && y === targetY) {
            const targetInput = inputs[inputIndex];
            if (targetInput) {
              targetInput.focus();
              targetInput.select();
            }
            return;
          }
          inputIndex++;
        }
      }
    }
  }

  // ===== RESET SYSTEM =====
  // Reset crossword to empty state
  private resetCrossword(): void {
    if (
      !confirm(
        "Are you sure you want to reset the entire crossword? All progress will be lost."
      )
    ) {
      return;
    }

    this.userInputs.clear();
    this.completedWords.clear();
    this.currentWord = null;

    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>;

    inputs.forEach((input) => {
      input.value = "";
      input.style.color = "#333";
      input.style.fontWeight = "normal";
      input.classList.remove("shake");
    });

    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("highlighted", "current-word", "word-complete");
    });

    document.querySelectorAll(".clue-item").forEach((clue) => {
      clue.classList.remove("completed", "active");
      const clueText = clue.querySelector(".clue-text") as HTMLElement;
      if (clueText) {
        clueText.style.textDecoration = "none";
        clueText.style.opacity = "1";
        clueText.style.color = "#333";
      }
    });
  }
}
