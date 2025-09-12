import "./crossword.css"; // Connect CSS styles
import { CrosswordGame } from "./crossword.ts"; // Import our main class

// Wait until HTML is fully loaded (built-in DOM event)
document.addEventListener("DOMContentLoaded", () => {
  // Check if HTML elements exist
  const grid = document.getElementById("crossword-grid");
  const across = document.getElementById("across-clues");
  const down = document.getElementById("down-clues");

  if (!grid || !across || !down) {
    console.error("Required HTML elements not found!");
    return;
  }

  // Create new game object (constructor is called)
  try {
    const game = new CrosswordGame();
  } catch (error) {
    console.error("Error creating game:", error);
  }
});
