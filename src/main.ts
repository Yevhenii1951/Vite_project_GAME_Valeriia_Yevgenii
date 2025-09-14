import "./crossword.css";
import { CrosswordGame } from "./crossword.ts";

document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("crossword-grid");
  const across = document.getElementById("across-clues");
  const down = document.getElementById("down-clues");

  if (!grid || !across || !down) {
    console.error("Required HTML elements not found!");
    return;
  }

  try {
    new CrosswordGame();
  } catch (error) {
    console.error("Error creating game:", error);
  }
});

