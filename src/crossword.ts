// Interface for word structure
interface Word {
  text: string;
  clue: string;
  startX: number;
  startY: number;
  direction: "across" | "down";
  number: number;
}

// Basic CrosswordGame class
export class CrosswordGame {
  // Basic properties
  private words: Word[] = [];
  private grid: (string | null)[][] = [];
  private gridSize = 16;
  private gridHeight = 12;

  // HTML elements
  private gridContainer: HTMLElement | null = null;
  private acrossClues: HTMLElement | null = null;
  private downClues: HTMLElement | null = null;

  constructor() {
    // Get HTML elements
    this.gridContainer = document.getElementById("crossword-grid");
    this.acrossClues = document.getElementById("across-clues");
    this.downClues = document.getElementById("down-clues");

    // Check if elements exist
    if (!this.gridContainer || !this.acrossClues || !this.downClues) {
      console.error("Required HTML elements not found!");
      return;
    }

    // Initialize the game
    this.initializeGrid();
    this.setupBasicWords();
    this.renderGrid();
  }

  // Create empty grid
  private initializeGrid(): void {
    this.grid = [];
    for (let y = 0; y < this.gridHeight; y++) {
      this.grid[y] = [];
      for (let x = 0; x < this.gridSize; x++) {
        this.grid[y][x] = null;
      }
    }
  }

  // Setup basic words for demonstration
  private setupBasicWords(): void {
    this.words = [
      {
        text: "HTML",
        clue: "CLUE",
        startX: 2,
        startY: 2,
        direction: "across",
        number: 1,
      },
      {
        text: "CSS",
        clue: "CLUE",
        startX: 5,
        startY: 4,
        direction: "across",
        number: 2,
      },
      {
        text: "JAVASCRIPT",
        clue: "CLUE",
        startX: 1,
        startY: 6,
        direction: "across",
        number: 3,
      },
    ];
  }

  // Render basic grid
  private renderGrid(): void {
    if (!this.gridContainer) return;

    // Clear container
    this.gridContainer.innerHTML = "";

    // Create grid cells
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        const cell = document.createElement("div");
        cell.className = "cell";

        // For now, just create input fields in some cells
        if ((x + y) % 3 === 0) {
          const input = document.createElement("input");
          input.type = "text";
          input.maxLength = 1;
          input.style.border = "none";
          input.style.background = "transparent";
          input.style.textAlign = "center";
          input.style.fontSize = "16px";
          input.style.fontWeight = "bold";
          input.style.width = "100%";
          input.style.height = "100%";
          input.style.outline = "none";
          input.style.textTransform = "uppercase";

          cell.appendChild(input);
        } else {
          // Make some cells blocked
          cell.classList.add("blocked");
        }

        this.gridContainer.appendChild(cell);
      }
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  try {
    const game = new CrosswordGame();

    // Make globally accessible for debugging
    (window as any).crosswordGame = game;
  } catch (error) {
    console.error("Error creating game:", error);
  }
});
