import re

def rewrite_regex(filepath, regex_search, regex_replace):
    try:
        with open(filepath, 'r') as f:
            content = f.read()

        content = re.sub(regex_search, regex_replace, content)

        with open(filepath, 'w') as f:
            f.write(content)
    except Exception as e:
        print(f"Error processing {filepath}: {e}")

# AppRoutes - TS2345
rewrite_regex('src/routes/AppRoutes.tsx', r'startQuiz\(questions, filters \|\| \(\{\} as InitialFilters\), mode\)', r'startQuiz(questions, filters || ({} as any), mode)')
