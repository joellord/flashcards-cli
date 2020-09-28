const fs = require("fs");
const DELAY = 50;
const ACTIONITEMDELAY = 3;

class CardDeck {
  constructor(deck) {
    this.cards = fs.readFileSync(deck).toString();
    this.cards = JSON.parse(this.cards);
  }

  getRandomCard() {
    let cardId = Math.round(Math.random() * (this.cards.length - 1));
    return this.cards[cardId];
  }

  get(index) {
    return this.cards[index];
  }
}

let cards = new CardDeck("./cards.json");

function write(text) {
  process.stdout.write(text);
}

function writeLine(text) {
  let p = new Promise((resolve, reject) => {
    for (let i = 0; i < text.length; i++) {
      setTimeout(() => write(text[i]), i * DELAY);
    }
    setTimeout(resolve, DELAY * text.length);
  });
  return p;
}

function main() {
  // console.log(process.stdout.columns);
}

function splitText(text, length = 36) {
  let words = text.split(" ");
  let lines = [];
  let line = "";
  while(words.length > 0) {
    if (line.length + words[0].length < length) {
      line += words[0] + " ";
      words = words.slice(1);
    } else {
      lines.push(line.trim());
      line = "";
    }
  }
  lines.push(line.trim());
  return lines;
}

function addBorderStars(text, cols) {
  let missingSpaces = cols - text.length;
  if (missingSpaces <= 0) {
    console.log("Error printing out border stars with text " + text);
    process.exit();
  }
  return `* ${text}${missingSpaces ? " ".repeat(missingSpaces - 4) : ""} *\n`;
}

function displayTitle(title) {
  const columns = process.stdout.columns;
  let hr = "*".repeat(columns) + "\n";
  let lines = splitText(title, columns - 4);
  let p = new Promise(async (resolve, reject) => {
    await writeLine(hr);
    for (let i = 0; i < lines.length; i++) {
      await writeLine(addBorderStars(lines[i], columns));
    }
    await writeLine(hr);
    resolve();
  });
  return p;
}

function pause(seconds) {
  let p = new Promise((resolve, reject) => {
    setTimeout(resolve, seconds * 1000);
  });
  return p;
}

function writeActionItem(item) {
  let p = new Promise(async (resolve, reject) => {
    write(item.item);
    await pause(ACTIONITEMDELAY);
    let dots = process.stdout.columns - (item.item.length + item.action.length);
    write(".".repeat(dots));
    await pause(ACTIONITEMDELAY);
    write(item.action);
    resolve();
  });
  return p;
}

function writeNote(item) {
  let p = new Promise(async (resolve, reject) => {
    let text = splitText(item.item, process.stdout.columns);
    for (let i = 0; i < text.length; i++) {
      await writeLine(text[i]);
      await writeLine("\n");
    }
    await pause(ACTIONITEMDELAY);
    resolve();
  });
  return p;
}

function writeSectionBreak(item) {
  let text = item.item;
  let p = new Promise(async (resolve, reject) => {
    let spaces = Math.round((process.stdout.columns - text.length) / 2);
    text = " ".repeat(spaces) + text + " ".repeat(spaces);
    await writeLine("\n");
    await writeLine(text);
    text = text.replace(/[a-z]/ig, "-");
    await writeLine(text);
    await pause(ACTIONITEMDELAY);
    resolve();
  });
  return p;
}

function newCardComing() {
  let p = new Promise(async (resolve, reject) => {
    let text = "NEW CARD !";
    let colours = [31, 32, 33, 34, 35, 36, 37, 31, 32, 33, 34, 35, 36];
    let oddColumns = !!(process.stdout.columns % 2);
    let spaces = Math.round((process.stdout.columns - text.length) / 2);
    text = " ".repeat(spaces) + text + " ".repeat(oddColumns ? spaces - 1 : spaces);

    write("\033c");
    await writeLine("\n\n\n\n\n\n")

    for (let i = 0; i < colours.length; i++) {
      write(`\x1b[${colours[i]}m${text}\x1b[0m`);
      await pause(0.5);
      write("\b".repeat(text.length));
    }
    write("\033c");
    resolve();
  });
  return p;
}

async function showCard(card) {
  await newCardComing();
  process.stdout.write("\033c");
  await displayTitle(card.title);
  for (let i = 0; i < card.checklist.length; i++) {
    await pause(2);
    switch(card.checklist[i].style) {
      case "note":
        await writeNote(card.checklist[i]);
        break;
      case "section":
        await writeSectionBreak(card.checklist[i]);
        break;
      default:
        await writeActionItem(card.checklist[i]);
    }
  }
  await pause(2);
  writeLine("\n\n\nDone!");
  await pause(30);

  process.stdout.write("\033c");
}

setInterval(main, 1000);

showCard(cards.getRandomCard());

//Every 5 minutes, show a flash card
setInterval(() => showCard(cards.getRandomCard()), 5 * 60 * 1000);
