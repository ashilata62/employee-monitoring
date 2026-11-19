# Git Pull & Synchronization Guide

This guide describes the standard, safe procedure for updating the Employee Monitoring project from the `main` branch.

---

## 1. Do You Need One Pull or Separate Pulls?

**ONE PULL UPDATES EVERYTHING.**

Because `employee-monitoring-frontend`, `employee-monitoirng-backend`, and `agent-source` are part of a **single monorepo**, you only ever pull from the project root:
```
C:\Users\91969\Downloads\employee monitoring
```
You **never** need to run `git pull` separately inside the frontend or backend folders. Doing it once at the root updates every file across the entire application simultaneously.

---

## 2. Standard Safe Pull Workflow (Step-by-Step)

Follow these 5 steps every time you want to pull updates from GitHub:

### Step 1: Open Terminal at Project Root
Ensure you are in the project root:
```powershell
cd "C:\Users\91969\Downloads\employee monitoring"
```

### Step 2: Check Local Status
Before touching remote code, check what you have modified locally:
```powershell
git status
```
- If git status outputs `nothing to commit, working tree clean`, proceed to **Step 4**.
- If you have uncommitted files that you want to keep, proceed to **Step 3**.

### Step 3: Temporarily Stash Uncommitted Local Work
Never pull over uncommitted changes. Stash your work safely:
```powershell
git stash push -m "work-in-progress-before-pull"
```
Verify the working tree is now clean:
```powershell
git status
```

### Step 4: Fetch and Pull Incoming Updates
Fetch remote changes first to inspect what is coming:
```powershell
git fetch origin main
```
Pull and merge the changes into your local branch:
```powershell
git pull origin main
```

### Step 5: Restore Your Local Work
Reapply your stashed changes on top of the newly updated code:
```powershell
git stash pop
```

---

## 3. What To Do If Merge Conflicts Occur

If Git reports `CONFLICT (content): Merge conflict in <file>`:

1. **Do NOT panic and do NOT run `git reset --hard`.**
2. Check which files are conflicting:
   ```powershell
   git status
   ```
   Files under `Unmerged paths` are the ones requiring attention.
3. Open each conflicting file in your editor (e.g., VS Code or Antigravity).
4. Search for conflict markers:
   - `<<<<<<< HEAD` (Your current local code)
   - `=======` (The separator between changes)
   - `>>>>>>> origin/main` (The incoming code from your teammate)
5. **Decide the correct resolution:**
   - If the incoming changes are features or bug fixes from a colleague, preserve their logic.
   - If you both edited the same function, combine the parameters or logic cleanly.
   - Delete all three conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`).
6. **Verify the application compiles:**
   ```powershell
   npm --prefix employee-monitoring-frontend run build
   ```
7. **Complete the merge:**
   ```powershell
   git add <resolved-file>
   git commit -m "Merge remote-tracking branch 'origin/main' with resolved conflicts"
   ```

---

## 4. Quick Reference Cheatsheet

| Task | Command |
| :--- | :--- |
| **Check current status** | `git status` |
| **View incoming commits without pulling** | `git fetch origin main; git log HEAD..origin/main --oneline` |
| **Safely stash uncommitted edits** | `git stash push -m "my-stash"` |
| **Pull latest changes** | `git pull origin main` |
| **Restore stashed edits** | `git stash pop` |
| **Discard a failed merge attempt** | `git merge --abort` |
