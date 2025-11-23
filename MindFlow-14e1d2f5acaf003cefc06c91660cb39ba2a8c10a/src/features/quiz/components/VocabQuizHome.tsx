
import React from 'react';
import { ArrowLeft, Quote, Target, Scale, ChevronRight } from 'lucide-react';
import { Button } from '../../../components/Button/Button';

interface VocabQuizHomeProps {
  onBack: () => void;
  onIdiomsClick?: () => void;
  onOWSClick?: () => void;
}

export const VocabQuizHome: React.FC<VocabQuizHomeProps> = ({ onBack, onIdiomsClick, onOWSClick }) => {
  const items = [
    {
      id: 'idioms',
      title: "Idioms & Phrases",
      description: "Master common expressions and their hidden meanings.",
      icon: <Quote className="w-6 h-6 text-amber-600" />,
      bgClass: "bg-amber-50",
      borderClass: "hover:border-amber-300",
      iconBg: "bg-amber-100",
      action: onIdiomsClick
    },
    {
      id: 'oneword',
      title: "One-word Substitution",
      description: "Learn to express complex ideas with a single precise word.",
      icon: <Target className="w-6 h-6 text-teal-600" />,
      bgClass: "bg-teal-50",
      borderClass: "hover:border-teal-300",
      iconBg: "bg-teal-100",
      action: onOWSClick
    },
    {
      id: 'synonyms',
      title: "Synonyms & Antonyms",
      description: "Expand your vocabulary with similar and opposite words.",
      icon: <Scale className="w-6 h-6 text-purple-600" />,
      bgClass: "bg-purple-50",
      borderClass: "hover:border-purple-300",
      iconBg: "bg-purple-100",
      action: () => console.log("Synonyms clicked") // Placeholder
    }
  ];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      <div className="flex-1 flex flex-col items-center justify-center space-y-10 py-10 relative z-10">
        
        {/* Navigation */}
        <div className="w-full max-w-3xl mx-auto px-4">
           <Button 
              variant="ghost" 
              onClick={onBack} 
              className="text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 transition-colors"
           >
             <ArrowLeft className="w-4 h-4" /> Back to English
           </Button>
        </div>

        {/* Header */}
        <div className="text-center max-w-2xl mx-auto px-4">
          <h1 className="text-3xl sm:text-5xl font-black text-gray-900 leading-tight mb-4">
            Vocabulary <span className="text-emerald-600">Master</span>
          </h1>
          <p className="text-gray-500 font-medium">
            Select a topic to begin your practice session.
          </p>
        </div>

        {/* List Buttons */}
        <div className="w-full max-w-3xl mx-auto px-4 space-y-4">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={item.action}
              className={`w-full p-5 bg-white rounded-2xl border border-gray-200 shadow-sm transition-all duration-300 group flex items-center gap-5 text-left hover:shadow-md hover:-translate-y-1 ${item.borderClass}`}
            >
              {/* Icon Box */}
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${item.iconBg}`}>
                {item.icon}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-900 truncate">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-500 font-medium truncate">
                  {item.description}
                </p>
              </div>

              {/* Action Arrow */}
              <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>

      </div>
    </div>
  );
};
