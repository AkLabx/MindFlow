with open('src/features/dashboard/components/subject/TopicCard.tsx', 'r') as f:
    content = f.read()

content = content.replace("                            <button", "              <button")

with open('src/features/dashboard/components/subject/TopicCard.tsx', 'w') as f:
    f.write(content)
