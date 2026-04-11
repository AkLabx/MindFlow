const fs = require('fs');

let fileContent = fs.readFileSync('src/features/ows/components/OWSSession.tsx', 'utf8');

const oldLogic = `     onNext(); // Advance the parent's pointer

     controls.set({ x: 0, y: 0, opacity: 1 });
     setIsAnimating(false);`;

const newLogic = `     if (isLast) {
         onFinish();
     } else {
         onNext(); // Advance the parent's pointer
     }

     controls.set({ x: 0, y: 0, opacity: 1 });
     setIsAnimating(false);`;

if (fileContent.includes(oldLogic)) {
    fileContent = fileContent.replace(oldLogic, newLogic);
    fs.writeFileSync('src/features/ows/components/OWSSession.tsx', fileContent, 'utf8');
    console.log("Updated OWSSession.tsx successfully!");
} else {
    console.error("Could not find old logic in OWSSession.tsx!");
}
