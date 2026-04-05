const fs = require('fs');

let content = fs.readFileSync('src/lib/syncService.ts', 'utf8');

content = content.replace(`          if (!remoteIdiomIds.has(idiom.idiomId)) {
            await syncService.pushIdiomInteraction(userId, idiom);
          }
        }
        }`, `          if (!remoteIdiomIds.has(idiom.idiomId)) {
            await syncService.pushIdiomInteraction(userId, idiom);
          }
        }`);

fs.writeFileSync('src/lib/syncService.ts', content, 'utf8');
