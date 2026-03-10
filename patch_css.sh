#!/bin/bash
sed -i 's/\.dark::view-transition-old(root)/::view-transition-old(root)/g' src/index.css
sed -i 's/\.dark::view-transition-new(root)/::view-transition-new(root)/g' src/index.css
