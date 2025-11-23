import React from 'react';

export function FilterGroup({ title, icon, children }: { title: string; icon: React.ReactElement; children?: React.ReactNode }) {
  return (
    <fieldset className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full flex flex-col">
      <legend className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4 w-full">
        <span className="text-indigo-600">{icon}</span>
        <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
      </legend>
      <div className="space-y-5 flex-1">
        {children}
      </div>
    </fieldset>
  );
}