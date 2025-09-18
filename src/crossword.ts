// ===== IMPORTS =====
import { WORDS_TEMPLATE } from "./words-template.js"; // Import word template

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
  private gridSize: number; // Grid width (16 columns)
  private gridHeight: number; // Grid height (12 rows) - optimized
  private currentWord: Word | null = null; // Currently selected word
  private completedWords: Set<number> = new Set(); // Numbers of completed words
  private userInputs: Map<string, string> = new Map(); // User input by positions

  // HTML ELEMENTS (obtained through DOM API)
  private gridContainer: HTMLElement | null = null; // Container for grid
  private acrossClues: HTMLElement | null = null; // Container for horizontal clues
  private downClues: HTMLElement | null = null; // Container for vertical clues

  // Now constructor takes template
  constructor(template = WORDS_TEMPLATE) {
    this.gridSize = template.columns; // width
    this.gridHeight = template.rows; // height
    this.words = template.words; // words

    this.gridContainer = document.getElementById("crossword-grid"); // Get grid container
    this.acrossClues = document.getElementById("across-clues"); // Get across clues container
    this.downClues = document.getElementById("down-clues"); // Get down clues container

    if (!this.gridContainer) {
      // If grid container not found
      console.error("Element 'crossword-grid' not found!"); // Report error
      return;
    }
    if (!this.acrossClues) {
      // If across clues container not found
      console.error("Element 'across-clues' not found!"); // Report error
      return;
    }
    if (!this.downClues) {
      // If down clues container not found
      console.error("Element 'down-clues' not found!"); // Report error
      return;
    }

    try {
      this.initializeGrid(); // Initialize grid
      this.placeWordsInGrid(); // Place words in grid
      this.renderGrid(); // Render grid
      this.renderClues(); // Render clues
    } catch (error) {
      console.error("Error during initialization:", error); // Initialization error
    }

    // Dynamically set CSS variables for grid
    this.gridContainer.style.setProperty("--columns", String(this.gridSize));
    this.gridContainer.style.setProperty("--rows", String(this.gridHeight));
  }

  // ===== FUNCTION 1: CREATE EMPTY GRID =====
  private initializeGrid(): void {
    this.grid = []; // Clear grid

    for (let y = 0; y < this.gridHeight; y++) {
      // For each row
      this.grid[y] = []; // Create new row
      for (let x = 0; x < this.gridSize; x++) {
        // For each column
        this.grid[y][x] = null; // Fill cell with null
      }
    }
  }

  // ===== FUNCTION 2: SETUP WORDS =====
  // This function is obsolete and removed for template-based grid
  // ===== FUNCTION 3: PLACE WORDS IN GRID =====
  private placeWordsInGrid(): void {
    this.words.forEach((word) => {
      // For each word
      for (let i = 0; i < word.text.length; i++) {
        // For each letter
        let x, y; // Coordinates

        if (word.direction === "across") {
          // If word is across
          x = word.startX + i; // X increases
          y = word.startY; // Y is fixed
        } else {
          // If word is down
          x = word.startX; // X is fixed
          y = word.startY + i; // Y increases
        }

        if (x < this.gridSize && y < this.gridHeight) {
          // If within grid
          this.grid[y][x] = word.text[i]; // Insert letter
        }
      }
    });
  }

  // ===== FUNCTION 4: RENDER GRID =====
  private renderGrid(): void {
    if (!this.gridContainer) {
      // If container not found
      console.error("Grid container not found in renderGrid!"); // Report error
      return;
    }

    this.gridContainer.innerHTML = ""; // Clear container

    for (let y = 0; y < this.gridHeight; y++) {
      // For each row
      for (let x = 0; x < this.gridSize; x++) {
        // For each column
        const cell = document.createElement("div"); // Create div for cell
        cell.className = "cell"; // Cell class

        if (this.grid[y][x] !== null) {
          // If cell contains a letter
          const input = document.createElement("input"); // Create input
          input.type = "text"; // Text type
          input.maxLength = 1; // Only one letter
          input.style.border = "none"; // No border
          input.style.background = "transparent"; // Transparent background
          input.style.textAlign = "center"; // Center text
          input.style.fontSize = "20px"; // Font size
          input.style.fontWeight = "bold"; // Bold font
          input.style.width = "100%"; // Width 100%
          input.style.height = "100%"; // Height 100%
          input.style.outline = "none"; // No outline
          input.style.textTransform = "uppercase"; // Uppercase

          input.value = ""; // Empty value
          input.style.color = "#333"; // Text color

          input.addEventListener("input", (e) => {
            // Input event
            const target = e.target as HTMLInputElement; // Target element
            const value = target.value.toUpperCase(); // To uppercase
            target.value = value; // Save value

            this.userInputs.set(`${x}-${y}`, value); // Save user input

            if (value === this.grid[y][x]) {
              // If letter is correct
              target.style.color = "#27ae60"; // Green color
              target.classList.remove("shake"); // Remove error animation
              this.checkWordCompletion(); // Check word completion
              this.moveToNextCell(x, y); // Move to next cell
            } else if (value !== "") {
              // If letter is incorrect
              target.style.color = "#e74c3c"; // Red color
              target.classList.add("shake"); // Error animation
              setTimeout(() => target.classList.remove("shake"), 500); // Remove animation after 0.5s
            } else {
              // If field is empty
              target.style.color = "#333"; // Default color
              target.classList.remove("shake"); // Remove animation
            }
          });

          input.addEventListener("focus", () => {
            // Focus event
            this.highlightCurrentWord(x, y); // Highlight word
          });

          input.addEventListener("keydown", (e) => {
            // Keydown event
            this.handleKeyNavigation(e, x, y); // Handle navigation
          });

          cell.appendChild(input); // Add input to cell

          const wordNumber = this.getWordNumber(x, y); // Get word number
          if (wordNumber) {
            // If there is a number
            const numberSpan = document.createElement("span"); // Create span
            numberSpan.className = "cell-number"; // Number class
            numberSpan.textContent = wordNumber.toString(); // Number text
            numberSpan.style.position = "absolute"; // Absolute position
            numberSpan.style.top = "2px"; // Top offset
            numberSpan.style.left = "2px"; // Left offset
            numberSpan.style.fontSize = "10px"; // Font size
            numberSpan.style.fontWeight = "bold"; // Bold font
            numberSpan.style.color = "#333"; // Color
            numberSpan.style.pointerEvents = "none"; // No events
            cell.appendChild(numberSpan); // Add number to cell
          }
        } else {
          cell.classList.add("blocked"); // If cell is empty, make it blocked
        }

        if (this.gridContainer) {
          // If container exists
          this.gridContainer.appendChild(cell); // Add cell to container
        }
      }
    }
  }

  // ===== FUNCTION 5: GET WORD NUMBER =====
  private getWordNumber(x: number, y: number): number | null {
    for (let i = 0; i < this.words.length; i++) {
      // For each word
      const word = this.words[i]; // Current word
      if (word.startX === x && word.startY === y) {
        // If coordinates match
        return word.number; // Return number
      }
    }
    return null; // If not found, return null
  }

  // ===== FUNCTION 6: RENDER CLUES =====
  private renderClues(): void {
    if (!this.acrossClues || !this.downClues) {
      // If containers not found
      console.error("Clue containers not found in renderClues!"); // Report error
      return;
    }

    this.acrossClues.innerHTML = ""; // Clear across container
    this.downClues.innerHTML = ""; // Clear down container

    const acrossWords = []; // Array for across words
    const downWords = []; // Array for down words

    for (let i = 0; i < this.words.length; i++) {
      // For each word
      const word = this.words[i]; // Current word
      if (word.direction === "across") {
        // If across
        acrossWords.push(word); // Add to array
      } else {
        downWords.push(word); // If down, add to other array
      }
    }

    for (let i = 0; i < acrossWords.length; i++) {
      // For each across word
      const word = acrossWords[i]; // Current word
      const clueElement = document.createElement("div"); // Create div for clue
      clueElement.className = "clue-item clickable"; // Clue class
      clueElement.innerHTML = `<span class="clue-number">${word.number}.</span> <span class="clue-text">${word.clue}</span>`; // Clue HTML
      clueElement.dataset.wordNumber = word.number.toString(); // Word number
      clueElement.dataset.direction = "across"; // Direction

      clueElement.addEventListener("click", () => {
        // Click event
        this.selectWordByNumber(word.number); // Select word
      });

      if (this.acrossClues) {
        // If container exists
        this.acrossClues.appendChild(clueElement); // Add clue
      }
    }

    for (let i = 0; i < downWords.length; i++) {
      // For each down word
      const word = downWords[i]; // Current word
      const clueElement = document.createElement("div"); // Create div for clue
      clueElement.className = "clue-item clickable"; // Clue class
      clueElement.innerHTML = `<span class="clue-number">${word.number}.</span> <span class="clue-text">${word.clue}</span>`; // Clue HTML
      clueElement.dataset.wordNumber = word.number.toString(); // Word number
      clueElement.dataset.direction = "down"; // Direction

      clueElement.addEventListener("click", () => {
        // Click event
        this.selectWordByNumber(word.number); // Select word
      });

      if (this.downClues) {
        // If container exists
        this.downClues.appendChild(clueElement); // Add clue
      }
    }

    const buttonsContainer = document.createElement("div"); // Container for buttons
    buttonsContainer.classList.add("buttons-container"); // Container class

    const resetBtn = document.createElement("button"); // Reset button
    resetBtn.textContent = "🔄 Reset Crossword"; // Button text
    resetBtn.classList.add("mybtn"); // Button class

    resetBtn.addEventListener("click", () => {
      // Click event
      this.resetCrossword(); // Reset crossword
    });

    buttonsContainer.appendChild(resetBtn); // Add button to container

    if (this.downClues) {
      // If container exists
      this.downClues.appendChild(buttonsContainer); // Add buttons container
    }
  }

  // ===== FUNCTION 8: APPLY WORD COLORS =====
  private applyWordColors(): void {
    // Color coding disabled - all cells same color
  }

  // ===== NEW INTERACTIVE METHODS =====

  // Select word by number and focus on first cell
  private selectWordByNumber(wordNumber: number): void {
    let word = null; // Variable for word
    for (let i = 0; i < this.words.length; i++) {
      // For each word
      if (this.words[i].number === wordNumber) {
        // If number matches
        word = this.words[i]; // Save word
        break;
      }
    }
    if (!word) return; // If word not found, exit

    this.currentWord = word; // Save current word

    // Find correct index for input element
    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>; // All inputs

    let inputIndex = 0; // Input index
    for (let y = 0; y < this.gridHeight; y++) {
      // For each row
      for (let x = 0; x < this.gridSize; x++) {
        // For each column
        if (this.grid[y][x] !== null) {
          // If cell is not empty
          if (x === word.startX && y === word.startY) {
            // If coordinates match
            const firstInput = inputs[inputIndex]; // First input
            if (firstInput) {
              firstInput.focus(); // Focus
              firstInput.select(); // Select
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
    const containingWords = []; // Array of words containing the cell

    for (let w = 0; w < this.words.length; w++) {
      // For each word
      const word = this.words[w]; // Current word
      for (let i = 0; i < word.text.length; i++) {
        // For each letter
        let wordX, wordY; // Coordinates
        if (word.direction === "across") {
          // If across
          wordX = word.startX + i;
          wordY = word.startY;
        } else {
          wordX = word.startX;
          wordY = word.startY + i;
        }

        if (wordX === x && wordY === y) {
          // If coordinates match
          containingWords.push(word); // Add word
          break;
        }
      }
    }

    if (containingWords.length > 0) {
      // If there are words
      let wordToHighlight = containingWords[0]; // First word

      if (this.currentWord) {
        // If there is a current word
        for (let i = 0; i < containingWords.length; i++) {
          // For each word
          if (containingWords[i] === this.currentWord) {
            // If matches
            wordToHighlight = this.currentWord; // Highlight current
            break;
          }
        }
      }

      this.currentWord = wordToHighlight; // Save
      this.highlightWord(wordToHighlight); // Highlight
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
      let isComplete = true; // Completion flag
      let userWord = ""; // User's word

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

        const userInput = this.userInputs.get(`${x}-${y}`) || ""; // User input
        const correctLetter = this.grid[y][x]; // Correct letter

        if (userInput !== correctLetter) {
          // If letter is incorrect
          isComplete = false; // Not complete
          break;
        }
        userWord += userInput; // Build word
      }

      if (
        isComplete &&
        userWord === word.text &&
        !this.completedWords.has(word.number)
      ) {
        this.completedWords.add(word.number); // Add to completed
        this.markWordAsCompleted(word.number); // Mark as completed
        this.animateWordCompletion(word); // Completion animation
      }
    }
  }

  // Mark clue as completed with strikethrough
  private markWordAsCompleted(wordNumber: number): void {
    const clueElements = document.querySelectorAll(
      `[data-word-number="${wordNumber}"]`
    ); // Find clues
    clueElements.forEach((clue) => {
      clue.classList.add("completed"); // Completed class
      const clueText = clue.querySelector(".clue-text") as HTMLElement; // Clue text
      if (clueText) {
        clueText.style.textDecoration = "line-through"; // Strikethrough
        clueText.style.opacity = "0.6"; // Opacity
        clueText.style.color = "#27ae60"; // Green color
      }
    });
  }

  // Animate word completion
  private animateWordCompletion(word: Word): void {
    for (let i = 0; i < word.text.length; i++) {
      const x = word.direction === "across" ? word.startX + i : word.startX; // X coordinate
      const y = word.direction === "across" ? word.startY : word.startY + i; // Y coordinate

      if (x < this.gridSize && y < this.gridHeight) {
        const cellIndex = y * this.gridSize + x; // Cell index
        const cells = document.querySelectorAll(
          ".cell"
        ) as NodeListOf<HTMLElement>;
        const cell = cells[cellIndex];

        if (cell) {
          cell.classList.add("word-complete"); // Completed class
          setTimeout(() => {
            cell.classList.remove("word-complete"); // Remove class after 1s
          }, 1000);
        }
      }
    }
  }

  // ===== AUTOMATIC MOVE TO NEXT CELL =====
  // Move to next cell in current word after correct input
  private moveToNextCell(currentX: number, currentY: number): void {
    if (!this.currentWord) return; // If no current word, exit

    // Find position of current cell in the word
    let currentPosition = -1; // Current position
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
      const nextPosition = currentPosition + 1; // Next position
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
      ) as NodeListOf<HTMLInputElement>; // All inputs

      let inputIndex = 0; // Input index
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridSize; x++) {
          if (this.grid[y][x] !== null) {
            if (x === nextX && y === nextY) {
              const nextInput = inputs[inputIndex];
              if (nextInput) {
                setTimeout(() => {
                  nextInput.focus(); // Focus
                  nextInput.select(); // Select
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
    const key = e.key; // Get pressed key

    if (key === "Backspace") {
      // If Backspace
      const target = e.target as HTMLInputElement; // Target element
      if (target.value === "" && this.currentWord) {
        // If field is empty and there is a word
        e.preventDefault(); // Prevent default
        this.moveToPreviousCell(currentX, currentY); // Move to previous cell
      }
      return;
    }

    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === "ArrowDown"
    ) {
      e.preventDefault(); // Prevent default
      this.navigateWithArrows(key, currentX, currentY); // Arrow navigation
      return;
    }

    if (key === "Tab") {
      // If Tab
      e.preventDefault(); // Prevent default
      if (e.shiftKey) {
        this.moveToPreviousCell(currentX, currentY); // Shift+Tab: back
      } else {
        this.moveToNextCell(currentX, currentY); // Tab: forward
      }
      return;
    }
  }

  // Move to previous cell in current word
  private moveToPreviousCell(currentX: number, currentY: number): void {
    if (!this.currentWord) return; // If no word, exit

    // Find position of current cell in the word
    let currentPosition = -1; // Current position
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
      const prevPosition = currentPosition - 1; // Previous position
      const prevX =
        this.currentWord.direction === "across"
          ? this.currentWord.startX + prevPosition
          : this.currentWord.startX;
      const prevY =
        this.currentWord.direction === "across"
          ? this.currentWord.startY
          : this.currentWord.startY + prevPosition;

      this.focusOnCell(prevX, prevY); // Focus on previous cell
    }
  }

  // Arrow navigation
  private navigateWithArrows(
    key: string,
    currentX: number,
    currentY: number
  ): void {
    let targetX = currentX; // Target X coordinate
    let targetY = currentY; // Target Y coordinate

    switch (key) {
      case "ArrowLeft":
        targetX = Math.max(0, currentX - 1); // Left
        break;
      case "ArrowRight":
        targetX = Math.min(this.gridSize - 1, currentX + 1); // Right
        break;
      case "ArrowUp":
        targetY = Math.max(0, currentY - 1); // Up
        break;
      case "ArrowDown":
        targetY = Math.min(this.gridHeight - 1, currentY + 1); // Down
        break;
    }

    if (this.grid[targetY][targetX] !== null) {
      // If cell is not empty
      this.focusOnCell(targetX, targetY); // Focus on cell
    }
  }

  // Focus on specific cell
  private focusOnCell(targetX: number, targetY: number): void {
    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>; // All inputs

    let inputIndex = 0; // Input index
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.grid[y][x] !== null) {
          if (x === targetX && y === targetY) {
            const targetInput = inputs[inputIndex]; // Target input
            if (targetInput) {
              targetInput.focus(); // Focus
              targetInput.select(); // Select
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
      ) // Reset confirmation
    ) {
      return; // If cancelled, exit
    }

    this.userInputs.clear(); // Clear user input
    this.completedWords.clear(); // Clear completed words
    this.currentWord = null; // Reset current word

    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>; // All inputs

    inputs.forEach((input) => {
      input.value = ""; // Clear field
      input.style.color = "#333"; // Default color
      input.style.fontWeight = "normal"; // Normal font weight
      input.classList.remove("shake"); // Remove error animation
    });

    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("highlighted", "current-word", "word-complete"); // Remove all classes
    });

    document.querySelectorAll(".clue-item").forEach((clue) => {
      clue.classList.remove("completed", "active"); // Remove classes
      const clueText = clue.querySelector(".clue-text") as HTMLElement; // Clue text
      if (clueText) {
        clueText.style.textDecoration = "none"; // No strikethrough
        clueText.style.opacity = "1"; // Opacity 1
        clueText.style.color = "#333"; // Default color
      }
    });
  }
}
