
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Wrench, Image as ImageIcon, FileText, Presentation, ArrowLeft } from 'lucide-react';

const ToolsHome: React.FC = () => {
    const navigate = useNavigate();

    const tools = [
        {
            id: 'flashcard-maker',
            title: 'Flashcard Image Maker',
            description: 'Create beautiful vintage-style flashcards for idioms and OWS.',
            icon: <ImageIcon className="w-6 h-6 text-indigo-600" />,
            color: 'bg-indigo-50',
            borderColor: 'hover:border-indigo-300',
            action: () => navigate('/tools/flashcard-maker'),
            disabled: false
        },
        {
            id: 'pdf-generator',
            title: 'PDF Generator',
            description: 'Generate printable PDF lists from your vocabulary collection.',
            icon: <FileText className="w-6 h-6 text-gray-400" />,
            color: 'bg-gray-50',
            borderColor: 'hover:border-gray-300',
            action: () => {},
            disabled: true
        },
        {
            id: 'ppt-generator',
            title: 'PPT Generator',
            description: 'Create presentation slides for classroom teaching.',
            icon: <Presentation className="w-6 h-6 text-gray-400" />,
            color: 'bg-gray-50',
            borderColor: 'hover:border-gray-300',
            action: () => {},
            disabled: true
        }
    ];

    return (
        <div className="flex flex-col min-h-full bg-gray-50">
             {/* Header */}
             <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-600 transition-colors"
                >
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Wrench className="w-6 h-6 text-amber-500" />
                        Tools & Utilities
                    </h1>
                    <p className="text-gray-500 text-sm font-medium">Helper tools to enhance your content creation.</p>
                </div>
            </div>

            <div className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tools.map((tool) => (
                        <div
                            key={tool.id}
                            onClick={!tool.disabled ? tool.action : undefined}
                            className={`
                                bg-white p-6 rounded-2xl border border-gray-200 shadow-sm transition-all duration-200
                                ${tool.disabled ? 'opacity-60 cursor-not-allowed grayscale' : 'cursor-pointer hover:shadow-md hover:scale-[1.01] ' + tool.borderColor}
                            `}
                        >
                            <div className={`w-12 h-12 ${tool.color} rounded-xl flex items-center justify-center mb-4`}>
                                {tool.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{tool.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed mb-4">
                                {tool.description}
                            </p>
                            {tool.disabled && (
                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full uppercase tracking-wider">
                                    Coming Soon
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ToolsHome;
