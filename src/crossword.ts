// ===== IMPORTS ===== // ===== ИМПОРТЫ =====
import { WORDS_TEMPLATE } from "./words-template.js"; // Импорт шаблона слов / Import word template

// ===== INTERFACES (DATA TYPES) ===== // ===== ИНТЕРФЕЙСЫ (ТИПЫ ДАННЫХ) =====

// Interface describes the structure of one word in the crossword // Интерфейс описывает структуру одного слова
interface Word {
  text: string; // The word itself (example: "HTML") // Само слово (пример: "HTML")
  clue: string; // Question-hint (example: "Markup language for web pages") // Вопрос-подсказка (пример: "Язык разметки для веб-страниц")
  startX: number; // Starting position on X axis (column) // Начальная позиция по X (столбец)
  startY: number; // Starting position on Y axis (row) // Начальная позиция по Y (строка)
  direction: "across" | "down"; // Direction: horizontal or vertical // Направление: горизонтально или вертикально
  number: number; // Question number (1, 2, 3...) // Номер вопроса (1, 2, 3...)
}

// ===== MAIN GAME CLASS ===== // ===== ГЛАВНЫЙ КЛАСС ИГРЫ =====
export class CrosswordGame {
  // PRIVATE PROPERTIES (accessible only within the class) // Приватные свойства (доступны только внутри класса)
  private words: Word[] = []; // Array of all words // Массив всех слов
  private grid: (string | null)[][] = []; // Two-dimensional array for the grid // Двумерный массив для сетки
  private gridSize: number; // Grid width (16 columns) // Ширина сетки (16 столбцов)
  private gridHeight: number; // Grid height (12 rows) - optimized // Высота сетки (12 строк) - оптимизировано
  private currentWord: Word | null = null; // Currently selected word // Текущее выбранное слово
  private completedWords: Set<number> = new Set(); // Numbers of completed words // Номера завершённых слов
  private userInputs: Map<string, string> = new Map(); // User input by positions // Ввод пользователя по позициям

  // HTML ELEMENTS (obtained through DOM API) // HTML-элементы (получены через DOM API)
  private gridContainer: HTMLElement | null = null; // Container for grid // Контейнер для сетки
  private acrossClues: HTMLElement | null = null; // Container for horizontal clues // Контейнер для горизонтальных подсказок
  private downClues: HTMLElement | null = null; // Container for vertical clues // Контейнер для вертикальных подсказок

  // Теперь конструктор принимает шаблон / Now constructor takes template
  constructor(template = WORDS_TEMPLATE) {
    this.gridSize = template.columns; // ширина / width
    this.gridHeight = template.rows; // высота / height
    this.words = template.words; // слова / words

    this.gridContainer = document.getElementById("crossword-grid"); // Получаем контейнер сетки
    this.acrossClues = document.getElementById("across-clues"); // Получаем контейнер горизонтальных подсказок
    this.downClues = document.getElementById("down-clues"); // Получаем контейнер вертикальных подсказок

    if (!this.gridContainer) {
      // Если контейнер сетки не найден
      console.error("Element 'crossword-grid' not found!"); // Сообщаем об ошибке
      return;
    }
    if (!this.acrossClues) {
      // Если контейнер горизонтальных подсказок не найден
      console.error("Element 'across-clues' not found!"); // Сообщаем об ошибке
      return;
    }
    if (!this.downClues) {
      // Если контейнер вертикальных подсказок не найден
      console.error("Element 'down-clues' not found!"); // Сообщаем об ошибке
      return;
    }

    try {
      this.initializeGrid(); // Инициализируем сетку
      this.placeWordsInGrid(); // Размещаем слова в сетке
      this.renderGrid(); // Рисуем сетку
      this.applyWordColors(); // Применяем цвета (отключено)
      this.renderClues(); // Рисуем подсказки
    } catch (error) {
      console.error("Error during initialization:", error); // Ошибка при инициализации
    }

    // Динамически задаём CSS переменные для сетки
    this.gridContainer.style.setProperty("--columns", String(this.gridSize));
    this.gridContainer.style.setProperty("--rows", String(this.gridHeight));
  }

  // ===== FUNCTION 1: CREATE EMPTY GRID ===== // ===== ФУНКЦИЯ 1: СОЗДАТЬ ПУСТУЮ СЕТКУ =====
  private initializeGrid(): void {
    this.grid = []; // Очищаем сетку

    for (let y = 0; y < this.gridHeight; y++) {
      // Для каждой строки
      this.grid[y] = []; // Создаём новую строку
      for (let x = 0; x < this.gridSize; x++) {
        // Для каждого столбца
        this.grid[y][x] = null; // Заполняем ячейку null
      }
    }
  }

  // ===== FUNCTION 2: SETUP WORDS ===== // ===== ФУНКЦИЯ 2: ЗАГРУЗИТЬ СЛОВА =====
  // This function is obsolete and removed for template-based grid // Эта функция устарела и удалена для шаблонной сетки
  // ===== FUNCTION 3: PLACE WORDS IN GRID ===== // ===== ФУНКЦИЯ 3: РАЗМЕСТИТЬ СЛОВА В СЕТКЕ =====
  private placeWordsInGrid(): void {
    this.words.forEach((word) => {
      // Для каждого слова
      for (let i = 0; i < word.text.length; i++) {
        // Для каждой буквы
        let x, y; // Координаты

        if (word.direction === "across") {
          // Если слово по горизонтали
          x = word.startX + i; // X увеличивается
          y = word.startY; // Y фиксирован
        } else {
          // Если по вертикали
          x = word.startX; // X фиксирован
          y = word.startY + i; // Y увеличивается
        }

        if (x < this.gridSize && y < this.gridHeight) {
          // Если в пределах сетки
          this.grid[y][x] = word.text[i]; // Вставляем букву
        }
      }
    });
  }

  // ===== FUNCTION 4: RENDER GRID ===== // ===== ФУНКЦИЯ 4: ОТРИСОВАТЬ СЕТКУ =====
  private renderGrid(): void {
    if (!this.gridContainer) {
      // Если контейнер не найден
      console.error("Grid container not found in renderGrid!"); // Сообщаем об ошибке
      return;
    }

    this.gridContainer.innerHTML = ""; // Очищаем контейнер

    for (let y = 0; y < this.gridHeight; y++) {
      // Для каждой строки
      for (let x = 0; x < this.gridSize; x++) {
        // Для каждого столбца
        const cell = document.createElement("div"); // Создаём div для ячейки
        cell.className = "cell"; // Класс ячейки

        if (this.grid[y][x] !== null) {
          // Если ячейка содержит букву
          const input = document.createElement("input"); // Создаём input
          input.type = "text"; // Тип текст
          input.maxLength = 1; // Только одна буква
          input.style.border = "none"; // Без границы
          input.style.background = "transparent"; // Прозрачный фон
          input.style.textAlign = "center"; // Центрируем текст
          input.style.fontSize = "20px"; // Размер шрифта
          input.style.fontWeight = "bold"; // Жирный шрифт
          input.style.width = "100%"; // Ширина 100%
          input.style.height = "100%"; // Высота 100%
          input.style.outline = "none"; // Без рамки
          input.style.textTransform = "uppercase"; // Преобразуем в верхний регистр

          input.value = ""; // Пустое значение
          input.style.color = "#333"; // Цвет текста

          input.addEventListener("input", (e) => {
            // Событие ввода
            const target = e.target as HTMLInputElement; // Целевой элемент
            const value = target.value.toUpperCase(); // Преобразуем в верхний регистр
            target.value = value; // Сохраняем

            this.userInputs.set(`${x}-${y}`, value); // Сохраняем ввод пользователя

            if (value === this.grid[y][x]) {
              // Если буква правильная
              target.style.color = "#27ae60"; // Зелёный цвет
              target.classList.remove("shake"); // Убираем анимацию ошибки
              this.checkWordCompletion(); // Проверяем завершение слова
              this.moveToNextCell(x, y); // Переходим к следующей ячейке
            } else if (value !== "") {
              // Если буква неправильная
              target.style.color = "#e74c3c"; // Красный цвет
              target.classList.add("shake"); // Анимация ошибки
              setTimeout(() => target.classList.remove("shake"), 500); // Убираем анимацию через 0.5 сек
            } else {
              // Если поле пустое
              target.style.color = "#333"; // Обычный цвет
              target.classList.remove("shake"); // Убираем анимацию
            }
          });

          input.addEventListener("focus", () => {
            // Событие фокуса
            this.highlightCurrentWord(x, y); // Подсвечиваем слово
          });

          input.addEventListener("keydown", (e) => {
            // Событие нажатия клавиши
            this.handleKeyNavigation(e, x, y); // Обрабатываем навигацию
          });

          cell.appendChild(input); // Добавляем input в ячейку

          const wordNumber = this.getWordNumber(x, y); // Получаем номер слова
          if (wordNumber) {
            // Если есть номер
            const numberSpan = document.createElement("span"); // Создаём span
            numberSpan.className = "cell-number"; // Класс номера
            numberSpan.textContent = wordNumber.toString(); // Текст номера
            numberSpan.style.position = "absolute"; // Абсолютное позиционирование
            numberSpan.style.top = "2px"; // Отступ сверху
            numberSpan.style.left = "2px"; // Отступ слева
            numberSpan.style.fontSize = "10px"; // Размер шрифта
            numberSpan.style.fontWeight = "bold"; // Жирный шрифт
            numberSpan.style.color = "#333"; // Цвет
            numberSpan.style.pointerEvents = "none"; // Без событий
            cell.appendChild(numberSpan); // Добавляем номер в ячейку
          }
        } else {
          cell.classList.add("blocked"); // Если ячейка пустая, делаем заблокированной
        }

        if (this.gridContainer) {
          // Если контейнер есть
          this.gridContainer.appendChild(cell); // Добавляем ячейку в контейнер
        }
      }
    }
  }

  // ===== FUNCTION 5: GET WORD NUMBER ===== // ===== ФУНКЦИЯ 5: ПОЛУЧИТЬ НОМЕР СЛОВА =====
  private getWordNumber(x: number, y: number): number | null {
    for (let i = 0; i < this.words.length; i++) {
      // Для каждого слова
      const word = this.words[i]; // Текущее слово
      if (word.startX === x && word.startY === y) {
        // Если координаты совпадают
        return word.number; // Возвращаем номер
      }
    }
    return null; // Если не найдено, возвращаем null
  }

  // ===== FUNCTION 6: RENDER CLUES ===== // ===== ФУНКЦИЯ 6: ОТРИСОВАТЬ ПОДСКАЗКИ =====
  private renderClues(): void {
    if (!this.acrossClues || !this.downClues) {
      // Если контейнеры не найдены
      console.error("Clue containers not found in renderClues!"); // Сообщаем об ошибке
      return;
    }

    this.acrossClues.innerHTML = ""; // Очищаем контейнер горизонтальных
    this.downClues.innerHTML = ""; // Очищаем контейнер вертикальных

    const acrossWords = []; // Массив горизонтальных слов
    const downWords = []; // Массив вертикальных слов

    for (let i = 0; i < this.words.length; i++) {
      // Для каждого слова
      const word = this.words[i]; // Текущее слово
      if (word.direction === "across") {
        // Если горизонтальное
        acrossWords.push(word); // Добавляем в массив
      } else {
        downWords.push(word); // Если вертикальное, добавляем в другой массив
      }
    }

    for (let i = 0; i < acrossWords.length; i++) {
      // Для каждого горизонтального слова
      const word = acrossWords[i]; // Текущее слово
      const clueElement = document.createElement("div"); // Создаём div для подсказки
      clueElement.className = "clue-item clickable"; // Класс подсказки
      clueElement.innerHTML = `<span class="clue-number">${word.number}.</span> <span class="clue-text">${word.clue}</span>`; // HTML подсказки
      clueElement.dataset.wordNumber = word.number.toString(); // Номер слова
      clueElement.dataset.direction = "across"; // Направление

      clueElement.addEventListener("click", () => {
        // Событие клика
        this.selectWordByNumber(word.number); // Выделяем слово
      });

      if (this.acrossClues) {
        // Если контейнер есть
        this.acrossClues.appendChild(clueElement); // Добавляем подсказку
      }
    }

    for (let i = 0; i < downWords.length; i++) {
      // Для каждого вертикального слова
      const word = downWords[i]; // Текущее слово
      const clueElement = document.createElement("div"); // Создаём div для подсказки
      clueElement.className = "clue-item clickable"; // Класс подсказки
      clueElement.innerHTML = `<span class="clue-number">${word.number}.</span> <span class="clue-text">${word.clue}</span>`; // HTML подсказки
      clueElement.dataset.wordNumber = word.number.toString(); // Номер слова
      clueElement.dataset.direction = "down"; // Направление

      clueElement.addEventListener("click", () => {
        // Событие клика
        this.selectWordByNumber(word.number); // Выделяем слово
      });

      if (this.downClues) {
        // Если контейнер есть
        this.downClues.appendChild(clueElement); // Добавляем подсказку
      }
    }

    const buttonsContainer = document.createElement("div"); // Контейнер для кнопок
    buttonsContainer.classList.add("buttons-container"); // Класс контейнера

    const resetBtn = document.createElement("button"); // Кнопка сброса
    resetBtn.textContent = "🔄 Reset Crossword"; // Текст кнопки
    resetBtn.classList.add("mybtn"); // Класс кнопки

    resetBtn.addEventListener("click", () => {
      // Событие клика
      this.resetCrossword(); // Сбросить кроссворд
    });

    buttonsContainer.appendChild(resetBtn); // Добавляем кнопку в контейнер

    if (this.downClues) {
      // Если контейнер есть
      this.downClues.appendChild(buttonsContainer); // Добавляем контейнер кнопок
    }
  }

  // ===== FUNCTION 8: APPLY WORD COLORS ===== // ===== ФУНКЦИЯ 8: ПРИМЕНИТЬ ЦВЕТА СЛОВ =====
  private applyWordColors(): void {
    // Color coding disabled - all cells same color // Цветовая кодировка отключена - все ячейки одного цвета
  }

  // ===== NEW INTERACTIVE METHODS ===== // ===== НОВЫЕ ИНТЕРАКТИВНЫЕ МЕТОДЫ =====

  // Select word by number and focus on first cell // Выбрать слово по номеру и сфокусироваться на первой ячейке
  private selectWordByNumber(wordNumber: number): void {
    let word = null; // Переменная для слова
    for (let i = 0; i < this.words.length; i++) {
      // Для каждого слова
      if (this.words[i].number === wordNumber) {
        // Если номер совпадает
        word = this.words[i]; // Сохраняем слово
        break;
      }
    }
    if (!word) return; // Если слово не найдено, выходим

    this.currentWord = word; // Сохраняем текущее слово

    // Find correct index for input element // Находим правильный индекс для input
    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>; // Все input

    let inputIndex = 0; // Индекс input
    for (let y = 0; y < this.gridHeight; y++) {
      // Для каждой строки
      for (let x = 0; x < this.gridSize; x++) {
        // Для каждого столбца
        if (this.grid[y][x] !== null) {
          // Если ячейка не пустая
          if (x === word.startX && y === word.startY) {
            // Если координаты совпадают
            const firstInput = inputs[inputIndex]; // Первый input
            if (firstInput) {
              firstInput.focus(); // Фокусируемся
              firstInput.select(); // Выделяем
              // Highlight the entire word // Подсвечиваем всё слово
              this.highlightWord(word);
            }
            return;
          }
          inputIndex++;
        }
      }
    }
  }

  // Highlight word when focusing on cell // Подсветить слово при фокусе на ячейке
  private highlightCurrentWord(x: number, y: number): void {
    const containingWords = []; // Массив слов, содержащих ячейку

    for (let w = 0; w < this.words.length; w++) {
      // Для каждого слова
      const word = this.words[w]; // Текущее слово
      for (let i = 0; i < word.text.length; i++) {
        // Для каждой буквы
        let wordX, wordY; // Координаты
        if (word.direction === "across") {
          // Если горизонтально
          wordX = word.startX + i;
          wordY = word.startY;
        } else {
          wordX = word.startX;
          wordY = word.startY + i;
        }

        if (wordX === x && wordY === y) {
          // Если координаты совпадают
          containingWords.push(word); // Добавляем слово
          break;
        }
      }
    }

    if (containingWords.length > 0) {
      // Если есть слова
      let wordToHighlight = containingWords[0]; // Первое слово

      if (this.currentWord) {
        // Если есть текущее слово
        for (let i = 0; i < containingWords.length; i++) {
          // Для каждого слова
          if (containingWords[i] === this.currentWord) {
            // Если совпадает
            wordToHighlight = this.currentWord; // Выделяем текущее
            break;
          }
        }
      }

      this.currentWord = wordToHighlight; // Сохраняем
      this.highlightWord(wordToHighlight); // Подсвечиваем
    }
  }

  // Highlight all cells of the word // Подсветить все ячейки слова
  private highlightWord(word: Word): void {
    // Remove previous highlights // Удалить предыдущие подсветки
    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("highlighted", "current-word");
    });

    // Highlight clue // Подсветить подсказку
    document.querySelectorAll(".clue-item").forEach((clueElement) => {
      const clue = clueElement as HTMLElement;
      clue.classList.remove("active");
      if (clue.dataset.wordNumber === word.number.toString()) {
        clue.classList.add("active");
      }
    });

    // Highlight word cells // Подсветить ячейки слова
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

  // Check if word is completed // Проверить, завершено ли слово
  private checkWordCompletion(): void {
    for (let w = 0; w < this.words.length; w++) {
      const word = this.words[w];
      let isComplete = true; // Флаг завершения
      let userWord = ""; // Слово пользователя

      // Check each letter of the word // Проверить каждую букву
      for (let i = 0; i < word.text.length; i++) {
        let x, y;
        if (word.direction === "across") {
          x = word.startX + i;
          y = word.startY;
        } else {
          x = word.startX;
          y = word.startY + i;
        }

        const userInput = this.userInputs.get(`${x}-${y}`) || ""; // Ввод пользователя
        const correctLetter = this.grid[y][x]; // Правильная буква

        if (userInput !== correctLetter) {
          // Если буква неправильная
          isComplete = false; // Не завершено
          break;
        }
        userWord += userInput; // Собираем слово
      }

      if (
        isComplete &&
        userWord === word.text &&
        !this.completedWords.has(word.number)
      ) {
        this.completedWords.add(word.number); // Добавляем в завершённые
        this.markWordAsCompleted(word.number); // Отмечаем как завершённое
        this.animateWordCompletion(word); // Анимация завершения
      }
    }
  }

  // Mark clue as completed with strikethrough // Отметить подсказку как завершённую (зачёркнуть)
  private markWordAsCompleted(wordNumber: number): void {
    const clueElements = document.querySelectorAll(
      `[data-word-number="${wordNumber}"]`
    ); // Находим подсказки
    clueElements.forEach((clue) => {
      clue.classList.add("completed"); // Класс завершено
      const clueText = clue.querySelector(".clue-text") as HTMLElement; // Текст подсказки
      if (clueText) {
        clueText.style.textDecoration = "line-through"; // Зачёркнутый текст
        clueText.style.opacity = "0.6"; // Прозрачность
        clueText.style.color = "#27ae60"; // Зелёный цвет
      }
    });
  }

  // Animate word completion // Анимация завершения слова
  private animateWordCompletion(word: Word): void {
    for (let i = 0; i < word.text.length; i++) {
      const x = word.direction === "across" ? word.startX + i : word.startX; // X координата
      const y = word.direction === "across" ? word.startY : word.startY + i; // Y координата

      if (x < this.gridSize && y < this.gridHeight) {
        const cellIndex = y * this.gridSize + x; // Индекс ячейки
        const cells = document.querySelectorAll(
          ".cell"
        ) as NodeListOf<HTMLElement>;
        const cell = cells[cellIndex];

        if (cell) {
          cell.classList.add("word-complete"); // Класс завершено
          setTimeout(() => {
            cell.classList.remove("word-complete"); // Убираем класс через 1 сек
          }, 1000);
        }
      }
    }
  }

  // ===== AUTOMATIC MOVE TO NEXT CELL ===== // ===== АВТОМАТИЧЕСКИЙ ПЕРЕХОД К СЛЕДУЮЩЕЙ ЯЧЕЙКЕ =====
  // Move to next cell in current word after correct input // Перейти к следующей ячейке после правильного ввода
  private moveToNextCell(currentX: number, currentY: number): void {
    if (!this.currentWord) return; // Если нет текущего слова, выходим

    // Find position of current cell in the word // Находим позицию текущей ячейки
    let currentPosition = -1; // Текущая позиция
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
      const nextPosition = currentPosition + 1; // Следующая позиция
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
      ) as NodeListOf<HTMLInputElement>; // Все input

      let inputIndex = 0; // Индекс input
      for (let y = 0; y < this.gridHeight; y++) {
        for (let x = 0; x < this.gridSize; x++) {
          if (this.grid[y][x] !== null) {
            if (x === nextX && y === nextY) {
              const nextInput = inputs[inputIndex];
              if (nextInput) {
                setTimeout(() => {
                  nextInput.focus(); // Фокусируемся
                  nextInput.select(); // Выделяем
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

  // ===== KEYBOARD NAVIGATION ===== // ===== НАВИГАЦИЯ ПО КЛАВИАТУРЕ =====
  private handleKeyNavigation(
    e: KeyboardEvent,
    currentX: number,
    currentY: number
  ): void {
    const key = e.key; // Получаем нажатую клавишу

    if (key === "Backspace") {
      // Если Backspace
      const target = e.target as HTMLInputElement; // Целевой элемент
      if (target.value === "" && this.currentWord) {
        // Если поле пустое и есть слово
        e.preventDefault(); // Отменяем действие
        this.moveToPreviousCell(currentX, currentY); // Переходим к предыдущей ячейке
      }
      return;
    }

    if (
      key === "ArrowLeft" ||
      key === "ArrowRight" ||
      key === "ArrowUp" ||
      key === "ArrowDown"
    ) {
      e.preventDefault(); // Отменяем действие
      this.navigateWithArrows(key, currentX, currentY); // Навигация стрелками
      return;
    }

    if (key === "Tab") {
      // Если Tab
      e.preventDefault(); // Отменяем действие
      if (e.shiftKey) {
        this.moveToPreviousCell(currentX, currentY); // Shift+Tab: назад
      } else {
        this.moveToNextCell(currentX, currentY); // Tab: вперёд
      }
      return;
    }
  }

  // Move to previous cell in current word // Перейти к предыдущей ячейке
  private moveToPreviousCell(currentX: number, currentY: number): void {
    if (!this.currentWord) return; // Если нет слова, выходим

    // Find position of current cell in the word // Находим позицию текущей ячейки
    let currentPosition = -1; // Текущая позиция
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
      const prevPosition = currentPosition - 1; // Предыдущая позиция
      const prevX =
        this.currentWord.direction === "across"
          ? this.currentWord.startX + prevPosition
          : this.currentWord.startX;
      const prevY =
        this.currentWord.direction === "across"
          ? this.currentWord.startY
          : this.currentWord.startY + prevPosition;

      this.focusOnCell(prevX, prevY); // Фокус на предыдущей ячейке
    }
  }

  // Arrow navigation // Навигация стрелками
  private navigateWithArrows(
    key: string,
    currentX: number,
    currentY: number
  ): void {
    let targetX = currentX; // Целевая координата X
    let targetY = currentY; // Целевая координата Y

    switch (key) {
      case "ArrowLeft":
        targetX = Math.max(0, currentX - 1); // Влево
        break;
      case "ArrowRight":
        targetX = Math.min(this.gridSize - 1, currentX + 1); // Вправо
        break;
      case "ArrowUp":
        targetY = Math.max(0, currentY - 1); // Вверх
        break;
      case "ArrowDown":
        targetY = Math.min(this.gridHeight - 1, currentY + 1); // Вниз
        break;
    }

    if (this.grid[targetY][targetX] !== null) {
      // Если ячейка не пустая
      this.focusOnCell(targetX, targetY); // Фокус на ячейке
    }
  }

  // Focus on specific cell // Фокус на конкретной ячейке
  private focusOnCell(targetX: number, targetY: number): void {
    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>; // Все input

    let inputIndex = 0; // Индекс input
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.grid[y][x] !== null) {
          if (x === targetX && y === targetY) {
            const targetInput = inputs[inputIndex]; // Целевой input
            if (targetInput) {
              targetInput.focus(); // Фокусируемся
              targetInput.select(); // Выделяем
            }
            return;
          }
          inputIndex++;
        }
      }
    }
  }

  // ===== RESET SYSTEM ===== // ===== СИСТЕМА СБРОСА =====
  // Reset crossword to empty state // Сбросить кроссворд в пустое состояние
  private resetCrossword(): void {
    if (
      !confirm(
        "Are you sure you want to reset the entire crossword? All progress will be lost."
      ) // Подтверждение сброса
    ) {
      return; // Если отмена, выходим
    }

    this.userInputs.clear(); // Очищаем ввод пользователя
    this.completedWords.clear(); // Очищаем завершённые слова
    this.currentWord = null; // Сбрасываем текущее слово

    const inputs = document.querySelectorAll(
      ".cell input"
    ) as NodeListOf<HTMLInputElement>; // Все input

    inputs.forEach((input) => {
      input.value = ""; // Очищаем поле
      input.style.color = "#333"; // Цвет по умолчанию
      input.style.fontWeight = "normal"; // Обычный вес шрифта
      input.classList.remove("shake"); // Убираем анимацию ошибки
    });

    document.querySelectorAll(".cell").forEach((cell) => {
      cell.classList.remove("highlighted", "current-word", "word-complete"); // Убираем все классы
    });

    document.querySelectorAll(".clue-item").forEach((clue) => {
      clue.classList.remove("completed", "active"); // Убираем классы
      const clueText = clue.querySelector(".clue-text") as HTMLElement; // Текст подсказки
      if (clueText) {
        clueText.style.textDecoration = "none"; // Без зачёркивания
        clueText.style.opacity = "1"; // Прозрачность 1
        clueText.style.color = "#333"; // Цвет по умолчанию
      }
    });
  }
}
