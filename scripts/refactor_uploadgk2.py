import re

with open('src/features/admin/components/AdminUploadGK.tsx', 'r') as f:
    content = f.read()

pattern_blur = r"const \{ data, error \} = await supabase[\s\S]*?\.eq\('v1_id', val\);[\s\S]*?if \(error\) throw error;"
new_blur = "const data = await fetchIdsMutation.mutateAsync([val]);"
content = re.sub(pattern_blur, new_blur, content)

pattern_search = r"const \{ data, error \} = await supabase[\s\S]*?\.single\(\);[\s\S]*?if \(error\) throw error;"
new_search = "const data = await fetchEditMutation.mutateAsync(searchEditId);"
content = re.sub(pattern_search, new_search, content)

pattern_save = r"const \{ error \} = await supabase[\s\S]*?\.eq\('v1_id', payload\.v1_id\);[\s\S]*?if \(error\) throw error;"
new_save = "await updateMutation.mutateAsync(payload);"
content = re.sub(pattern_save, new_save, content)

with open('src/features/admin/components/AdminUploadGK.tsx', 'w') as f:
    f.write(content)
