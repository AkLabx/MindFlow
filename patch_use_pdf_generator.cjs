const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, 'src/hooks/usePDFGenerator.ts');
let content = fs.readFileSync(targetFile, 'utf8');

content = content.replace(
  `export function usePDFGenerator<T>(
  generatorFn: (data: T[], config: PDFGenerationConfig) => Promise<Blob>
): UsePDFGeneratorReturn<T> {`,
  `export function usePDFGenerator<T>(
  generatorFnFactory: () => Promise<(data: T[], config: PDFGenerationConfig) => Promise<Blob>>
): UsePDFGeneratorReturn<T> {`
);

content = content.replace(
  `const generatePDF = useCallback(async (data: T[], config: PDFGenerationConfig): Promise<DownloadResult | undefined> => {
    setIsGenerating(true);
    setError(null);
    try {
      const blob = await generatorFn(data, config);`,
  `const generatePDF = useCallback(async (data: T[], config: PDFGenerationConfig): Promise<DownloadResult | undefined> => {
    setIsGenerating(true);
    setError(null);
    try {
      const generatorFn = await generatorFnFactory();
      const blob = await generatorFn(data, config);`
);

content = content.replace(
  `  }, [generatorFn]);`,
  `  }, [generatorFnFactory]);`
);

fs.writeFileSync(targetFile, content, 'utf8');
console.log('patched usePDFGenerator');
