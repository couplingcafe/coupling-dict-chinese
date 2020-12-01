// Generates ../db/cc-cedict.sqlite from ../src/cc-cedict.txt
const Sequelize = require('sequelize');
const fs = require('fs');
const sqlite = require('sqlite3');

// DB config.
const sequelize = new Sequelize(null, null, null, {
  dialect: 'sqlite',
  storage: '../db/cc-cedict.sqlite'
});

// create a sqlite database with every entry
const Word = sequelize.define('Word', {
  traditional: Sequelize.STRING,
  simplified: Sequelize.STRING,
  pronunciation: Sequelize.STRING,
  definitions: Sequelize.STRING
});

// Sync schema.
sequelize
  .sync({force: true})
  .complete(err => {
     if (err) {
       console.log('Error creating table', err);
       return;
     }

     console.log('Database initialized.');

    const data = fs.readFileSync('../src/cc-cedict.txt', 'UTF-8' );
    const lines = data.toString().split('\n');
    console.log('Dictionary loaded, executing parser.');
    addToDB(lines).then(() => console.log('Finished!')).catch(console.error);
  });

async function addToDB (lines) {
  const regex = /\[(.*?)\]/;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Comment.
    if (!line.length) { continue; }
    if (line[0] === '#'){ continue; }

    const spaceSplit = line.split(' ');
    const traditional = spaceSplit[0];
    const simplified = spaceSplit[1];

    const pronunciation = line.match(regex)[0];

    const slashSplit = line.split('/');
    const defs = slashSplit.slice(1, slashSplit.length - 1).join(';');

    await Word.create({
      traditional: traditional,
      simplified: simplified,
      pronunciation: pronunciation,
      definitions: defs
    });
  }
}
