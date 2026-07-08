---
name: Pushing to GitHub from a Replit workspace
description: How to get local commits onto a GitHub repo when tokens/OAuth are blocked — the Git-pane-with-Active-connection path and its gotchas.
---

# Pushing local commits to GitHub from a Replit workspace

The only credential path that reliably has **write** access to GitHub from a Replit
workspace is the **Git pane** when its GitHub connection shows **"Active"** — that push
runs through Replit's git service using the user's *browser* OAuth session.

**Why:** the agent/shell has no access to that browser OAuth token. Every headless route
gives only anonymous read:
- `replit-git-askpass` (the `GIT_ASKPASS` helper) errors headless / only yields anonymous read, so `git ls-remote` on a *public* repo succeeds but `git push` fails with "Invalid username or token."
- `gh` CLI is present but not logged in; no `GH_TOKEN` in env.
- A user-supplied `GITHUB_PAT` was fine-grained + read-only (reads work, push → 403). Empty `X-OAuth-Scopes` header ⇒ it's a fine-grained/read-only token; a **classic** token with the top-level `repo` scope is the foolproof write token if the user is willing to make one.
- `listConnections('github')` (connectors-v2) returns 401 unless `proposeIntegration` was completed.

**How to apply — when the user must push and tokens/OAuth popups are blocked:**
1. Have the user connect GitHub in the **Git pane** until it says "Active" (account-level).
2. The pane's Remote often still points at Replit's internal `git+ssh://…pike.replit.dev`, not GitHub. Set the real remote. The pane's **"Create Remote"** button can fail with **"Unknown error from the Git service"** — that is almost always a **stale `.git/config.lock`** left by an interrupted write (check `ls -la .git/config.lock`, no `git` process running).
3. The agent **cannot** touch anything under `.git/` — the sandbox guard rejects even `rm .git/config.lock` and `git remote add` as "destructive git operations… not allowed in the main agent." A background project task runs in an *isolated* env, so it can't fix the *main* workspace's lock either. **The user must run it in their own Shell** (Tools → Shell), which is not guarded:
   `rm -f .git/config.lock && git remote add origin https://github.com/<user>/<repo>.git`
4. If remote `main` already exists, the pane errors **"The branch specified already exists"** (it tries to *create* the branch). Fix by linking to the existing branch, in the user's Shell:
   `git fetch origin && git branch --set-upstream-to=origin/main main`
5. Then in the Git pane click **"Sync changes"** (not a shell push — shell push has no write creds). The badge count (e.g. "Sync changes 13") dropping to plain "Sync changes" means the push succeeded. Verify with `git ls-remote https://github.com/<user>/<repo>.git refs/heads/main` (anonymous read) matching local HEAD.

**Key reminder:** the user's own Shell `git push` also fails auth (same anonymous askpass). Writes must go through the **pane's Sync/Push button**, but the *remote setup and lock removal* must be done in the user's Shell because the agent is blocked from `.git/`.
