import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    if 'setHideGlobalHeader' in content:
        return

    # Add imports
    content = content.replace("import React from 'react';", "import React, { useEffect } from 'react';\nimport { useLayoutStore } from '@/stores/useLayoutStore';")

    # Add hooks
    hook_str = """
  const setHideGlobalHeader = useLayoutStore((state) => state.setHideGlobalHeader);

  useEffect(() => {
    setHideGlobalHeader(true);
    return () => setHideGlobalHeader(false);
  }, [setHideGlobalHeader]);
"""

    # Insert after `const navigate = useNavigate();`
    content = re.sub(r'(const navigate = useNavigate\(\);\n)', r'\1' + hook_str, content)

    with open(filepath, 'w') as f:
        f.write(content)

update_file('src/features/dashboard/pages/subject/SubjectHubPage.tsx')
update_file('src/features/dashboard/pages/subject/SubjectTopicsPage.tsx')
