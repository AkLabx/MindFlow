import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, BookOpen, Calculator, Globe, FlaskConical, PenTool } from 'lucide-react';

const subjects = [
  { name: 'Mathematics', icon: Calculator, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
  { name: 'Science', icon: FlaskConical, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
  { name: 'Social Studies', icon: Globe, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
  { name: 'English', icon: PenTool, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  { name: 'Hindi', icon: BookOpen, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' },
];

export const ClassModulePlaceholder: React.FC = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in pb-20">
      <button
        onClick={() => navigate('/school/dashboard')}
        className="flex items-center text-sm font-medium text-slate-500 hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400 transition-colors mb-6"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        Back to Classes
      </button>

      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 font-cabinet mb-2">
          Class {classId}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Explore subjects, interactive lessons, and NCERT solutions.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((subject) => {
          const Icon = subject.icon;
          return (
            <div
              key={subject.name}
              className="group cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all shadow-sm hover:shadow-md flex items-center gap-5"
            >
              <div className={`w-14 h-14 rounded-2xl ${subject.bg} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className={`w-7 h-7 ${subject.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {subject.name}
                </h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Chapters & Notes
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Coming soon placeholder */}
      <div className="mt-12 bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-8 text-center border border-dashed border-slate-300 dark:border-slate-700">
        <h3 className="text-lg font-medium text-slate-800 dark:text-slate-300 mb-2">Content Loading</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          We are currently organizing the latest NCERT syllabus for Class {classId}. Interactive quizzes, animated lessons, and mock tests will appear here soon.
        </p>
      </div>
    </div>
  );
};
