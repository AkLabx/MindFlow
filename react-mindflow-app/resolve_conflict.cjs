const fs = require('fs');

let fileContent = fs.readFileSync('src/features/ows/utils/supabaseOws.ts', 'utf8');

const conflict = `<<<<<<< HEAD

=======

>>>>>>> origin/main`;

fileContent = fileContent.replace(conflict, '');
fs.writeFileSync('src/features/ows/utils/supabaseOws.ts', fileContent, 'utf8');

// Also update update_sieve.cjs conflict
fileContent = fs.readFileSync('update_sieve.cjs', 'utf8');

const sieveConflict = `<<<<<<< HEAD

             return true;
        });\`;

if (fileContent.includes(oldSieve)) {
    fileContent = fileContent.replace(oldSieve, newSieve);
    fs.writeFileSync('src/features/ows/utils/supabaseOws.ts', fileContent, 'utf8');
    console.log("Updated supabaseOws.ts successfully!");
} else {
    console.error("Could not find old logic in supabaseOws.ts!");
}
=======

             return true;
        });\`;

if (fileContent.includes(oldSieve)) {
    fileContent = fileContent.replace(oldSieve, newSieve);
    fs.writeFileSync('src/features/ows/utils/supabaseOws.ts', fileContent, 'utf8');
    console.log("Updated supabaseOws.ts successfully!");
} else {
    console.error("Could not find old logic in supabaseOws.ts!");
}
>>>>>>> origin/main`;

fileContent = fileContent.replace(sieveConflict, `             return true;
        });\`;

if (fileContent.includes(oldSieve)) {
    fileContent = fileContent.replace(oldSieve, newSieve);
    fs.writeFileSync('src/features/ows/utils/supabaseOws.ts', fileContent, 'utf8');
    console.log("Updated supabaseOws.ts successfully!");
} else {
    console.error("Could not find old logic in supabaseOws.ts!");
}`);
fs.writeFileSync('update_sieve.cjs', fileContent, 'utf8');

console.log("Resolved conflicts");
