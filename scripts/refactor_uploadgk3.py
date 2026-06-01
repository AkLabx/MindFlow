with open('src/features/admin/components/AdminUploadGK.tsx', 'r') as f:
    content = f.read()

blur_block = """                const { data, error } = await supabase
                    .from('questions')
                    .select('v1_id')
                    .eq('v1_id', val);

                if (error) throw error;"""

new_blur = "                const data = await fetchIdsMutation.mutateAsync([val]);"
content = content.replace(blur_block, new_blur)


search_block = """            const { data, error } = await supabase
                .from('questions')
                .select('*')
                .eq('v1_id', searchEditId)
                .single();

            if (error) throw error;"""

new_search = "            const data = await fetchEditMutation.mutateAsync(searchEditId);"
content = content.replace(search_block, new_search)


update_block = """            const { error } = await supabase
                .from('questions')
                .update(payload)
                .eq('v1_id', payload.v1_id);

            if (error) throw error;"""

new_update = "            await updateMutation.mutateAsync(payload);"
content = content.replace(update_block, new_update)

with open('src/features/admin/components/AdminUploadGK.tsx', 'w') as f:
    f.write(content)
