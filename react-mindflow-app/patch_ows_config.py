with open("src/features/ows/OWSConfig.tsx", "r") as f:
    content = f.read()

deck_mode_jsx = """
                    {/* Deck Mode Card */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-teal-100 border-l-4 border-l-teal-400 shadow-sm relative">
                        <div className="flex items-center gap-2 mb-4 text-teal-800 font-bold text-sm uppercase tracking-wider">
                            <CheckCircle className="w-4 h-4" /> Deck Mode (Spatial Engine)
                        </div>
                        <SegmentedControl
                            options={['All Unseen', 'Due for Review', 'Mix']}
                            selectedOptions={filters.deckMode || ['All Unseen']}
                            onOptionToggle={(opt) => setFilters(prev => ({ ...prev, deckMode: [opt] }))}
                            counts={{}}
                        />
                    </div>
"""

if "deckMode" not in content:
    content = content.replace("readStatus: []", "readStatus: [],\n    deckMode: ['All Unseen']")
    content = content.replace("                    {/* Read Status Card */}", deck_mode_jsx + "\n                    {/* Read Status Card */}")

with open("src/features/ows/OWSConfig.tsx", "w") as f:
    f.write(content)
