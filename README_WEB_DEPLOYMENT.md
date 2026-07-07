# IntelligenceSuite-WebVersion

This folder is the web-deployable copy of the Feedback Intelligence Suite. It is isolated from `Feedback Intelligence Suite (Version 28.6)` and is prepared for Git + Render deployment.

## What changed for web deployment

- Removed visible Concentrix / India Innovation branding from the web copy.
- Removed Windows-only executable artifacts from the web copy.
- The main server now uses Render's `PORT` environment variable and binds to `0.0.0.0` in hosted mode.
- Added `requirements.txt`, `render.yaml`, `.gitignore`, and `.gitattributes`.
- Kept Sparrow and Owl model artifacts so the current functionality remains available.

## Important Git note

This project contains large ML model files. Before pushing to GitHub, install and enable Git LFS:

```powershell
git lfs install
git init
git add .gitattributes
git add .
git commit -m "Prepare web version of intelligence suite"
git remote add origin <your-github-repo-url>
git push -u origin main
```

Without Git LFS, GitHub will reject model files larger than 100 MB.

## Render note

Render can deploy this with `render.yaml`. Because the suite includes PyTorch, Transformers, Sentence Transformers, and local model files, use a paid/standard web service rather than the free plan for dependable memory and disk availability.

Start command:

```bash
python backend/server.py
```

