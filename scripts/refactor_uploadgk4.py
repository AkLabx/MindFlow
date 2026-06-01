import re

with open('src/features/admin/components/AdminUploadGK.tsx', 'r') as f:
    content = f.read()


content = re.sub(r"const \{ data, error \} = await supabase[\s\S]*?\.limit\(1\);\s*if \(error\) throw error;", "const data = await fetchIdsMutation.mutateAsync([formData.v1_id]);", content)

content = re.sub(r"const \{ data, error \} = await supabase[\s\S]*?\.limit\(1\);\s*if \(error\) throw error;", "const data = await fetchEditMutation.mutateAsync(searchId.trim());", content)

content = re.sub(r"const \{ error \} = await supabase[\s\S]*?\.eq\('v1_id', formData\.v1_id\);\s*if \(error\) throw error;", "await updateMutation.mutateAsync(payload);", content)


with open('src/features/admin/components/AdminUploadGK.tsx', 'w') as f:
    f.write(content)
