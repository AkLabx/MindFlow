with open("src/features/ows/components/OWSCard.tsx", "r") as f:
    content = f.read()

# Make the card a motion.div
if "import { motion } from 'framer-motion';" not in content:
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { motion, useMotionValue, useTransform } from 'framer-motion';")

content = content.replace(
    'className={cn(\n          "relative w-full h-full transition-transform duration-500 transform-style-3d shadow-xl rounded-3xl",\n          isFlipped ? "rotate-y-180" : ""\n        )}',
    'className={cn(\n          "relative w-full h-full transition-transform transform-style-3d shadow-xl rounded-3xl",\n          isFlipped ? "rotate-y-180" : ""\n        )}\n        style={{ transitionDuration: isFlipped ? "500ms" : "0ms" }}'
)


with open("src/features/ows/components/OWSCard.tsx", "w") as f:
    f.write(content)
