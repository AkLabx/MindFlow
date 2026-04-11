const fs = require('fs');

let fileContent = fs.readFileSync('src/features/ows/OWSConfig.tsx', 'utf8');

const oldDeckModeArray = "deckMode: ['All Unseen']";
const newDeckModeArray = "deckMode: ['Unseen']";

const oldSegmentedOptions = "options={['All Unseen', 'Due for Review', 'Mix']}";
const newSegmentedOptions = "options={['Unseen', 'Mastered', 'Review', 'Clueless', 'Tricky']}";

const oldSelectedOptions = "selectedOptions={filters.deckMode || ['All Unseen']}";
const newSelectedOptions = "selectedOptions={filters.deckMode || ['Unseen']}";

if (fileContent.includes(oldDeckModeArray) && fileContent.includes(oldSegmentedOptions) && fileContent.includes(oldSelectedOptions)) {
    fileContent = fileContent.replace(oldDeckModeArray, newDeckModeArray);
    fileContent = fileContent.replace(oldSegmentedOptions, newSegmentedOptions);
    fileContent = fileContent.replace(oldSelectedOptions, newSelectedOptions);
    fs.writeFileSync('src/features/ows/OWSConfig.tsx', fileContent, 'utf8');
    console.log("Updated OWSConfig.tsx successfully!");
} else {
    console.error("Could not find all old config logic in OWSConfig.tsx!");
}
