with open("src/features/ows/hooks/useOwsFilterCounts.ts", "r") as f:
    content = f.read()

# Update filterKeys to include deckMode
content = content.replace("type FilterKeys = 'alphabet' | 'examName' | 'examYear' | 'difficulty' | 'readStatus';", "type FilterKeys = 'alphabet' | 'examName' | 'examYear' | 'difficulty' | 'readStatus' | 'deckMode';")
content = content.replace("const filterKeys: FilterKeys[] = ['alphabet', 'examName', 'examYear', 'difficulty', 'readStatus'];", "const filterKeys: FilterKeys[] = ['alphabet', 'examName', 'examYear', 'difficulty', 'readStatus', 'deckMode'];")

# Update useOwsQuestionIndex to assign deckMode to each item
index_logic = """
export function useOwsQuestionIndex(metadata: OwsMetadata[]) {
    return useMemo(() => {
        const index: Record<string, Record<string, Set<string>>> = {};
        const now = new Date().getTime();

        filterKeys.forEach(key => {
            index[key] = {};
        });

        metadata.forEach(item => {
            // Calculate Deck Mode dynamically
            let itemDeckModes: string[] = [];
            if (item.status === 'mastered') {
                itemDeckModes = []; // Completely ignore mastered cards
            } else if (!item.status) {
                itemDeckModes = ['All Unseen', 'Mix'];
            } else if (item.next_review_at && new Date(item.next_review_at).getTime() <= now) {
                itemDeckModes = ['Due for Review', 'Mix'];
            }

            // Assign dynamically computed deckModes so the Set algorithm picks them up
            itemDeckModes.forEach(mode => {
                if (!index['deckMode'][mode]) index['deckMode'][mode] = new Set();
                index['deckMode'][mode].add(item.id);
            });

            filterKeys.forEach(key => {
                if (key === 'deckMode') return; // Handled above
                const value = item[key as keyof OwsMetadata] as string;
                if (!value) return;

                if (!index[key][value]) {
                    index[key][value] = new Set();
                }
                index[key][value].add(item.id);
            });
        });

        return index;
    }, [metadata]);
}
"""

import re
content = re.sub(r'export function useOwsQuestionIndex[\s\S]*?\}, \[metadata\]\);\n\}', index_logic, content)

with open("src/features/ows/hooks/useOwsFilterCounts.ts", "w") as f:
    f.write(content)
