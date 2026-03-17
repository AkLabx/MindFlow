const fs = require('fs');
const file = 'src/features/ai/chat/ChatInput.tsx';
let content = fs.readFileSync(file, 'utf8');

// Imports update
content = content.replace(
    "import { Send, Loader2, Mic, Image as ImageIcon, X, StopCircle, ChevronUp, AudioWaveform } from 'lucide-react';",
    "import { Send, Loader2, Mic, Image as ImageIcon, X, StopCircle, ChevronUp, AudioWaveform, Paperclip, FileText } from 'lucide-react';\nimport { processFile, ProcessedDocument } from './utils/fileProcessing';"
);

// Props update
content = content.replace(
    "onSubmit: (image?: string, audio?: { data: string, mimeType: string }) => void;",
    "onSubmit: (image?: string, audio?: { data: string, mimeType: string }, documents?: ProcessedDocument[]) => void;"
);

// Component body start
content = content.replace(
    "const [imagePreview, setImagePreview] = useState<string | null>(null);",
    "const [imagePreview, setImagePreview] = useState<string | null>(null);\n    const [attachedDocs, setAttachedDocs] = useState<ProcessedDocument[]>([]);\n    const [isProcessingFile, setIsProcessingFile] = useState(false);"
);

// HandleSend update
content = content.replace(
    "const handleSend = () => {\n        if (!value.trim() && !imagePreview) return;\n        onSubmit(imagePreview || undefined);\n        setImagePreview(null);\n    };",
    "const handleSend = () => {\n        if (!value.trim() && !imagePreview && attachedDocs.length === 0) return;\n        onSubmit(imagePreview || undefined, undefined, attachedDocs);\n        setImagePreview(null);\n        setAttachedDocs([]);\n    };"
);

// Condition update for dynamic button inside return block
content = content.replace(
    "} else if (value.trim() || imagePreview) {",
    "} else if (value.trim() || imagePreview || attachedDocs.length > 0) {"
);

content = content.replace(
    "? (value.trim() || imagePreview)",
    "? (value.trim() || imagePreview || attachedDocs.length > 0)"
);

content = content.replace(
    ": (value.trim() || imagePreview)",
    ": (value.trim() || imagePreview || attachedDocs.length > 0)"
);

content = content.replace(
    "title={isLoading ? \"Stop generating\" : (value.trim() || imagePreview) ? \"Send message\" : (isListening ? \"Stop recording\" : \"Record voice\")}",
    "title={isLoading ? \"Stop generating\" : (value.trim() || imagePreview || attachedDocs.length > 0) ? \"Send message\" : (isListening ? \"Stop recording\" : \"Record voice\")}"
);

// Add Document Upload Handler
const docUploadHandler = `

    const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        setIsProcessingFile(true);
        try {
            const newDocs: ProcessedDocument[] = [];
            for (const file of files) {
                const processed = await processFile(file);
                newDocs.push(processed);
            }
            setAttachedDocs(prev => [...prev, ...newDocs]);
        } catch (error: any) {
            alert(error.message || "Failed to process file.");
        } finally {
            setIsProcessingFile(false);
            if (e.target) e.target.value = ''; // Reset input
        }
    };
`;
content = content.replace(
    "const handleImageUpload",
    docUploadHandler.trim() + "\n\n    const handleImageUpload"
);

// Add paperclip icon next to image upload
const paperclipUI = `
                        <label className="p-2 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer rounded-full transition-colors" title="Attach Document (PDF, DOCX, TXT)">
                            <input
                                type="file"
                                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                                multiple
                                className="hidden"
                                onChange={handleDocumentUpload}
                                disabled={isLoading || disabled || isProcessingFile}
                            />
                            {isProcessingFile ? <Loader2 className="h-5 w-5 animate-spin text-indigo-500" /> : <Paperclip className="h-5 w-5" />}
                        </label>
`;
content = content.replace(
    "<div className=\"flex items-center text-gray-400\">",
    "<div className=\"flex items-center text-gray-400\">\n" + paperclipUI
);

// Add attached documents preview chip
const docPreviewUI = `
            {attachedDocs.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {attachedDocs.map((doc, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-3 py-1.5 rounded-full text-sm font-medium border border-indigo-200 dark:border-indigo-800/50 shadow-sm animate-fade-in">
                            <FileText className="h-4 w-4" />
                            <span className="max-w-[150px] truncate">{doc.name}</span>
                            <button
                                onClick={() => setAttachedDocs(prev => prev.filter((_, i) => i !== idx))}
                                className="hover:bg-indigo-200 dark:hover:bg-indigo-800 p-0.5 rounded-full transition-colors"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
`;
content = content.replace(
    "{imagePreview && (",
    docPreviewUI.trim() + "\n\n            {imagePreview && ("
);

// Handle Enter press
content = content.replace(
    "if (value.trim() && !isLoading && !disabled) {",
    "if ((value.trim() || attachedDocs.length > 0) && !isLoading && !disabled) {"
);


fs.writeFileSync(file, content);
console.log("Patched ChatInput.tsx successfully!");
