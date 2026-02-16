# Contributing Guide

## Rules
- Do NOT push directly to `main`
- Use branches: `feature/<name>`, `fix/<name>`, `docs/<name>`
- Open a Pull Request (PR) to merge into `main`
- At least 1 teammate review before merge

## Basic workflow
```bash
git checkout main
git pull origin main
git checkout -b feature/<name>
# work...
git add .
git commit -m "feat: <message>"
git push -u origin feature/<name>
