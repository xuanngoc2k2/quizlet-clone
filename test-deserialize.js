const COLS = 25;
const ROWS = 12;

function deserializeCells(text) {
  const cells = [];
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let col = 0;
    let j = 0;
    while (j < line.length && col < COLS) {
      if (/\d/.test(line[j]) && j + 1 < line.length && /\d/.test(line[j + 1])) {
        cells.push(line[j] + line[j + 1]);
        j += 2;
      } else {
        cells.push(line[j]);
        j += 1;
      }
      col++;
    }
    while (col < COLS) {
      cells.push("");
      col++;
    }
  }

  while (cells.length < COLS * ROWS) {
    cells.push("");
  }

  if (cells.length > COLS * ROWS) {
    cells.length = COLS * ROWS;
  }

  return cells;
}

const text = " Hello  World\n12345\n\nEnd";
const cells = deserializeCells(text);
console.log("Line 1:", cells.slice(0, 25).map(c => c === "" ? "_" : c === " " ? "[S]" : c).join(""));
console.log("Line 2:", cells.slice(25, 50).map(c => c === "" ? "_" : c === " " ? "[S]" : c).join(""));
console.log("Line 3:", cells.slice(50, 75).map(c => c === "" ? "_" : c === " " ? "[S]" : c).join(""));
console.log("Line 4:", cells.slice(75, 100).map(c => c === "" ? "_" : c === " " ? "[S]" : c).join(""));
