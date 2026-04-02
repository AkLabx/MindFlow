const fs = require('fs');
const filePath = 'src/features/quiz/components/AiExplanationButton.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const search = `        try {
            const canvas = await html2canvas(contentRef.current, { scale: 2, useCORS: true, backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff' });
            const dataUrl = canvas.toDataURL('image/png');`;

const replace = `        try {
            const element = contentRef.current;
            const originalScrollTop = element.scrollTop;
            // A common workaround for html2canvas to capture full scrolling content:
            // Temporarily set height to max-content and overflow to visible.
            const originalHeight = element.style.height;
            const originalOverflow = element.style.overflow;
            element.style.height = 'max-content';
            element.style.overflow = 'visible';

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
                windowHeight: element.scrollHeight,
                height: element.scrollHeight,
                scrollY: -window.scrollY
            });

            // Restore original styles
            element.style.height = originalHeight;
            element.style.overflow = originalOverflow;
            element.scrollTop = originalScrollTop;

            const dataUrl = canvas.toDataURL('image/png');`;

content = content.replace(search, replace);
fs.writeFileSync(filePath, content, 'utf8');
