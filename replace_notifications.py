import os

def replace_in_file(filepath, search, replace):
    with open(filepath, 'r') as f:
        content = f.read()

    content = content.replace(search, replace)

    with open(filepath, 'w') as f:
        f.write(content)

# Popup
replace_in_file("src/components/ui/Notification/Popup.tsx",
    "import { useNotification, PopupVariant } from '../../../contexts/NotificationContext';",
    "import { useNotification, PopupVariant } from '../../../stores/useNotificationStore';")

# ToastContainer
replace_in_file("src/components/ui/Notification/ToastContainer.tsx",
    "import { useNotification } from '../../../contexts/NotificationContext';",
    "import { useNotification } from '../../../stores/useNotificationStore';")

# Toast
replace_in_file("src/components/ui/Notification/Toast.tsx",
    "import { ToastOptions, useNotification } from '../../../contexts/NotificationContext';",
    "import { ToastOptions, useNotification } from '../../../stores/useNotificationStore';")

# Hooks re-export
replace_in_file("src/hooks/useNotification.ts",
    "export { useNotification } from '../contexts/NotificationContext';",
    "export { useNotification } from '../stores/useNotificationStore';")

# Providers
replace_in_file("src/providers/AppProvider.tsx",
    "import { NotificationProvider } from '../contexts/NotificationContext';\n",
    "")
replace_in_file("src/providers/AppProvider.tsx",
    "      <NotificationProvider>\n",
    "")
replace_in_file("src/providers/AppProvider.tsx",
    "      </NotificationProvider>\n",
    "")
