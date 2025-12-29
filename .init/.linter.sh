#!/bin/bash
cd /home/kavia/workspace/code-generation/chess-play-and-save-193006/chess_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

