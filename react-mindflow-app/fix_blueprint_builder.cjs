const fs = require('fs');
let content = fs.readFileSync('src/features/quiz/components/BlueprintBuilder.tsx', 'utf8');

content = content.replace(
  `const NodeItem = ({ node, updateNode, deleteNode, depth = 0 }: { node: BlueprintNode, updateNode: (n: BlueprintNode) => void, deleteNode: () => void, depth?: number }) => {`,
  `const NodeItem = ({ node, updateNode, deleteNode, depth = 0, metadataIndex }: { node: BlueprintNode, updateNode: (n: BlueprintNode) => void, deleteNode: () => void, depth?: number, metadataIndex?: Record<string, Record<string, Set<string>>> }) => {`
);

const useMemoInjection = `  const availableOptions = useMemo(() => {
    if (!metadataIndex || !metadataIndex[node.type]) return [];
    const options = Object.keys(metadataIndex[node.type]).sort();
    return options.filter(o => o.trim().length > 0);
  }, [metadataIndex, node.type]);

  return (`;

content = content.replace(/  return \(/, useMemoInjection);

const oldInput = `<input
          type="text"
          value={node.value}
          onChange={(e) => updateNode({...node, value: e.target.value, name: e.target.value})}
          placeholder="e.g. History"
          className="bg-black border border-white/20 rounded p-1 text-sm text-white focus:outline-none focus:border-purple-500 min-w-[100px] flex-1"
        />`;

const newInput = `{availableOptions.length > 0 ? (
          <select
            value={node.value}
            onChange={(e) => updateNode({...node, value: e.target.value, name: e.target.value})}
            className="bg-black border border-white/20 rounded p-1 text-sm text-white focus:outline-none focus:border-purple-500 min-w-[100px] flex-1"
          >
            <option value="" disabled>Select {node.type}</option>
            {availableOptions.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={node.value}
            onChange={(e) => updateNode({...node, value: e.target.value, name: e.target.value})}
            placeholder={\`e.g. \${node.type}\`}
            className="bg-black border border-white/20 rounded p-1 text-sm text-white focus:outline-none focus:border-purple-500 min-w-[100px] flex-1"
          />
        )}`;

content = content.replace(oldInput, newInput);

fs.writeFileSync('src/features/quiz/components/BlueprintBuilder.tsx', content);
