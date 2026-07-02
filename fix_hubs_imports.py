import os
import re

hubs = [
    'src/features/vocab/idioms/IdiomsHub.tsx',
    'src/features/vocab/ows/OWSHub.tsx',
    'src/features/vocab/synonyms/SynonymsHub.tsx'
]

for file_path in hubs:
    with open(file_path, 'r') as f:
        content = f.read()

    # The relative imports for the workspace components are slightly off in the context of `src/features/vocab/...`
    # They should be `../../../features/english/components/workspace`

    content = content.replace(
        "import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../english/components/workspace';",
        "import { ContinueLearningBanner, DomainStatsRow, QuickActionsGrid } from '../../english/components/workspace';"
    )
    # Actually, `src/features/vocab/idioms/IdiomsHub.tsx` to `src/features/english/components/workspace` is `../../../english/components/workspace`
    content = content.replace(
        "from '../../english/components/workspace';",
        "from '../../../features/english/components/workspace';"
    )

    with open(file_path, 'w') as f:
        f.write(content)

print("Imports fixed")
