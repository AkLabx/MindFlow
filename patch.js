const fs = require('fs');
const filePath = 'src/features/quiz/components/AiExplanationButton.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const search = `        try {
            const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff' });
            const dataUrl = canvas.toDataURL('image/png');`;

const replace = `        try {
            const element = contentRef.current;
            const originalScrollTop = element.scrollTop;
            element.scrollTop = 0; // Temporarily scroll to top

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                windowHeight: element.scrollHeight,
                height: element.scrollHeight,
                scrollY: -window.scrollY
            });

            element.scrollTop = originalScrollTop; // Restore scroll
            const dataUrl = canvas.toDataURL('image/png');`;

content = content.replace(search, replace);
fs.writeFileSync(filePath, content, 'utf8');
