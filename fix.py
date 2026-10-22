with open('src/features/dashboard/pages/subject/SubjectTopicsPage.tsx', 'r') as f:
    content = f.read()

content = content.replace("  return (\n      <div className=\"flex flex-col gap-4\">\n        {Object.entries(topicsHierarchy)", "  const renderContent = () => {\n    if (isLoading) return <SubjectSkeleton />;\n    if (error || !topicsHierarchy) return <EmptyState message=\"Failed to load topics.\" />;\n    if (Object.keys(topicsHierarchy).length === 0) return <EmptyState message=\"No topics found for this subject.\" />;\n\n    return (\n      <div className=\"flex flex-col gap-4\">\n        {Object.entries(topicsHierarchy)")

with open('src/features/dashboard/pages/subject/SubjectTopicsPage.tsx', 'w') as f:
    f.write(content)
