with open("src/features/ows/hooks/useOwsFilterCounts.ts", "r") as f:
    content = f.read()

metadata_type = """export type OwsMetadata = {
    id: string;
    alphabet: string;
    examName: string;
    examYear: string;
    difficulty: string;
    readStatus: string;
    status?: string;
    next_review_at?: string;
    deckMode?: string;
};"""

import re
content = re.sub(r'export type OwsMetadata = \{[\s\S]*?\};', metadata_type, content)

with open("src/features/ows/hooks/useOwsFilterCounts.ts", "w") as f:
    f.write(content)
