// Load the fs module to read and write files
const fs = require('fs');

// Read the JSON file and parse it into an array
fs.readFile('deathSubtitles.json', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  let array = JSON.parse(data);

  // Remove duplicate elements using a Set
  let unique = [...new Set(array)];
  unique = unique.sort(() => Math.random() - .5);

  // Print the array
  console.log(JSON.stringify(unique));
});

