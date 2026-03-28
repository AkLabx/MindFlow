import re

with open('src/features/school/components/SchoolProfile.tsx', 'r') as f:
    content = f.read()

# Make sure we import ModeSelector and useSettingsStore
if "import { ModeSelector }" not in content:
    content = content.replace("import { ClaymorphismSwitch } from '../../quiz/components/ui/ClaymorphismSwitch';", "import { ClaymorphismSwitch } from '../../quiz/components/ui/ClaymorphismSwitch';\nimport { ModeSelector } from '../../../components/ModeSelector';")

# In SchoolProfile, it already has:
#   const handleSwitchToCompetitive = () => {
#     setTargetAudience('competitive');
#     navigate('/dashboard');
#   };
# And a menu item: { id: 'switch_mode', label: 'Switch to Competitive Mode', action: handleSwitchToCompetitive, rightElement: <ChevronRight /> }

# Let's replace that menu item's rightElement with ModeSelector, and remove action since ModeSelector handles it natively, or keep it.
# Actually, since ModeSelector is a self-contained dropdown, we can just render the ModeSelector instead of ChevronRight for that specific row.

menu_group_regex = r"""\{\s*id:\s*'switch_mode',\s*label:\s*'Switch to Competitive Mode',\s*icon:\s*<Monitor className="w-5 h-5" \/>,\s*action:\s*handleSwitchToCompetitive,\s*rightElement:\s*<ChevronRight className="w-5 h-5 text-slate-400" \/>\s*\}"""

new_menu_item = r"""{
          id: 'switch_mode',
          label: 'App Mode',
          icon: <Monitor className="w-5 h-5" />,
          action: () => {},
          rightElement: <ModeSelector />
        }"""

content = re.sub(menu_group_regex, new_menu_item, content)

with open('src/features/school/components/SchoolProfile.tsx', 'w') as f:
    f.write(content)
