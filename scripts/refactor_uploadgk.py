import re

with open('src/features/admin/components/AdminUploadGK.tsx', 'r') as f:
    content = f.read()

# Imports
content = content.replace("import { supabase } from '../../../lib/supabase';", "import { useFetchQuestionsByIds, useInsertQuestions, useFetchQuestionByV1Id, useUpdateQuestion } from '../hooks/useAdminUploadGK';")
content = content.replace("const { showToast } = useNotification();", "const { showToast } = useNotification();\n    const fetchIdsMutation = useFetchQuestionsByIds();\n    const insertMutation = useInsertQuestions();\n    const fetchEditMutation = useFetchQuestionByV1Id();\n    const updateMutation = useUpdateQuestion();")

# 1. handleV1IdBlur (Line 188)
pattern_blur = r"const \{ data, error \} = await supabase\n\s*\.from\('questions'\)\n\s*\.select\('v1_id'\)\n\s*\.eq\('v1_id', val\);[\s\S]*?if \(error\) throw error;"
new_blur = "const data = await fetchIdsMutation.mutateAsync([val]);"
content = re.sub(pattern_blur, new_blur, content)

# 2. handleSingleSubmit (Line 288)
pattern_single = r"const \{ error \} = await supabase\.from\('questions'\)\.insert\(\[payload\]\);\n\s*if \(error\) throw error;"
new_single = "await insertMutation.mutateAsync([payload]);"
content = re.sub(pattern_single, new_single, content)

# 3. parseBulkText (Line 564)
pattern_bulk1 = r"const \{ data, error \} = await supabase\n\s*\.from\('questions'\)\n\s*\.select\('v1_id'\)\n\s*\.in\('v1_id', v1IdsToFetch\);[\s\S]*?if \(error\) throw error;"
new_bulk1 = "const data = await fetchIdsMutation.mutateAsync(v1IdsToFetch);"
content = re.sub(pattern_bulk1, new_bulk1, content)

# 4. handleBulkUpload (Line 605)
pattern_bulk2 = r"const \{ error \} = await supabase\.from\('questions'\)\.insert\(previewData\);\n\s*if \(error\) throw error;"
new_bulk2 = "await insertMutation.mutateAsync(previewData);"
content = re.sub(pattern_bulk2, new_bulk2, content)

# 5. handleSearchEdit (Line 729)
pattern_search = r"const \{ data, error \} = await supabase\n\s*\.from\('questions'\)\n\s*\.select\('\*'\)\n\s*\.eq\('v1_id', searchEditId\)\n\s*\.single\(\);[\s\S]*?if \(error\) throw error;"
new_search = "const data = await fetchEditMutation.mutateAsync(searchEditId);"
content = re.sub(pattern_search, new_search, content)

# 6. handleSaveEdit (Line 830)
pattern_save = r"const \{ error \} = await supabase\n\s*\.from\('questions'\)\n\s*\.update\(payload\)\n\s*\.eq\('v1_id', payload\.v1_id\);[\s\S]*?if \(error\) throw error;"
new_save = "await updateMutation.mutateAsync(payload);"
content = re.sub(pattern_save, new_save, content)

with open('src/features/admin/components/AdminUploadGK.tsx', 'w') as f:
    f.write(content)
