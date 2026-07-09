import json

with open('package.json', 'r') as f:
    data = json.load(f)

version = data['version']
parts = version.split('.')
parts[-1] = str(int(parts[-1]) + 1)
data['version'] = '.'.join(parts)

with open('package.json', 'w') as f:
    json.dump(data, f, indent=2)
