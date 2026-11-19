# Git Safety & Multi-Developer Collaboration Rules

These rules protect your project against data loss, accidental code overwrites, and repository corruption when working in a team environment.

---

## 1. Absolute Prohibitions (Never Do These)

### Rule 1: Never Run Destructive Commands
- **NEVER run `git reset --hard`**: This irreversibly wipes out uncommitted edits across your workspace.
- **NEVER run `git clean -fd`**: This deletes untracked files and new folders without asking.
- **NEVER run `git checkout -- .`**: This replaces modified files with the last commit, destroying uncommitted progress.

### Rule 2: Never Force-Pull or Force-Push
- **NEVER use `git push --force` or `-f`**: Overwrites remote commits and erases your colleagues' work on GitHub.
- **NEVER overwrite local code with remote branches without stashing**: Always preserve local uncommitted modifications.

### Rule 3: Never Blindly Choose One Side in a Merge Conflict
- Do not run `git checkout --ours` or `git checkout --theirs` on whole files.
- Automatically picking one side either discards your colleagues' recent bug fixes or discards your own local enhancements.
- Every conflict must be resolved line-by-line by understanding what each developer introduced.

---

## 2. Mandatory Pre-Pull Safety Checklist

Always verify these 3 points before running any pull or merge:

1. **Verify Git Status First:**
   Run `git status`. Ensure you know exactly which files are modified locally.
2. **Protect Dirty Working Trees:**
   If you have local modifications, store them safely with `git stash push` or create a local checkpoint commit before pulling.
3. **Inspect What Is Coming:**
   Run `git fetch origin main` followed by `git log HEAD..origin/main --oneline`. This lets you see which commits your colleagues pushed before merging them.

---

## 3. Mandatory Post-Pull Verification Checklist

After pulling or merging:

1. **Check Working Tree Health:**
   Run `git status`. Confirm there are no lingering unmerged conflict files.
2. **Run Application Builds:**
   - Frontend: `npm --prefix employee-monitoring-frontend run build`
   - Backend: Ensure syntax and database connections are valid.
3. **Verify Dev Servers:**
   Ensure neither the Vite dev server nor the Express backend logs throw transform or syntax errors.

---

## 4. Multi-Developer Ownership Etiquette

1. **Protect Colleague Components:**
   If another developer owns a specific feature (e.g., timesheets, alerts, billing, reports), do not reformat or overwrite their files during a merge.
2. **Communicate Before Branch Operations:**
   If your branch has diverged significantly from `main`, coordinate with the team before pushing structural changes.
3. **Make Small, Atomic Changes:**
   Commit related changes together with clear, descriptive commit messages to make future merges seamless.
