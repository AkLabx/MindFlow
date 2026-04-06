import re

with open("src/features/ows/components/OWSSession.tsx", "r") as f:
    content = f.read()

# Add haptic feedback tick logic to handlePan
pan_logic = """
  const handlePan = (e: any, info: PanInfo) => {
    const { offset } = info;
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);

    // Continuous Drag Haptics based on distance milestones
    if (navigator.vibrate) {
        if (absX > 40 && absX < 45) navigator.vibrate(10);
        if (absY > 40 && absY < 45) navigator.vibrate(10);
        if (absX > 80 && absX < 85) navigator.vibrate(20);
        if (absY > 80 && absY < 85) navigator.vibrate(20);
    }

    if (absX > absY) {
       setSwipeDirection(offset.x > 0 ? 'right' : 'left');
    } else {
       setSwipeDirection(offset.y > 0 ? 'down' : 'up');
    }
  };
"""

content = re.sub(r'  const handlePan =[\s\S]*?\};\n', pan_logic, content)


# Fix onTap logic to strictly distinguish tap from drag (to prevent glitch)
tap_logic = """
              onTap={(e, info) => {
                 if (isAnimating) return;
                 // Strict tap vs drag distance check
                 if (Math.abs(info.point.x - info.point.x) < 5) {
                     setIsFlipped(!isFlipped);
                 }
              }}
"""

content = re.sub(r'onTap=\{\(\) => \{[\s\S]*?\}\}', tap_logic, content)

with open("src/features/ows/components/OWSSession.tsx", "w") as f:
    f.write(content)
