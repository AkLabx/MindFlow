import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, GraduationCap, ChevronRight, Calculator, FlaskConical, Globe, PenTool } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const classes = Array.from({ length: 12 }, (_, i) => i + 1);

export const SchoolDashboard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="mb-8">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500 font-cabinet mb-2">
          My Classroom
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Select your class to start learning CBSE/NCERT subjects.
        </p>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {classes.map((cls) => (
          <motion.button
            key={cls}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(`/school/class/${cls}`)}
            className="group relative bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all text-left shadow-sm hover:shadow-md flex flex-col justify-between min-h-[120px]"
          >
            <div className="flex justify-between items-start mb-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 dark:text-slate-600 group-hover:text-emerald-500 transition-colors" />
            </div>

            <div>
              <h3 className="font-semibold text-lg text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                Class {cls}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                NCERT Syllabus
              </p>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 to-teal-500/0 group-hover:from-emerald-500/5 group-hover:to-teal-500/5 rounded-2xl transition-all duration-300 pointer-events-none" />
          </motion.button>
        ))}
      </div>

      {/* Quick Access Tools */}
      <section className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-200">Interactive Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Math Solver</h3>
              <p className="text-sm text-emerald-100">Step-by-step solutions</p>
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
              <FlaskConical className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold">Virtual Lab</h3>
              <p className="text-sm text-indigo-100">Science experiments</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
