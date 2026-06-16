# Spec Kit Setup Guide

This document records the complete setup process for **Spec Kit** in the Amanat project, for future reference.

---

## What is Spec Kit?

[Spec Kit](https://github.com/github/spec-kit) is an open-source toolkit from GitHub that enables **Spec-Driven Development (SDD)** — a methodology where you write specifications first, then the AI coding agent implements them in a structured, predictable way.

Instead of "vibe coding", you follow a clear workflow:
**Constitution → Specify → Clarify → Plan → Tasks → Implement**

---

## Prerequisites

| Tool | Required | Purpose |
|------|----------|---------|
| Git | Yes | Version control (already installed: v2.52.0) |
| uv | Yes | Python package manager — installs Spec Kit CLI and bundles Python |
| Python 3.11+ | Yes | Runtime for Spec Kit (auto-downloaded by uv) |

---

## Step 1: Install uv

**Why:** `uv` is the recommended package manager for Spec Kit. It handles Python installation automatically, so you don't need to install Python separately.

**Command (Windows PowerShell):**

```powershell
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
```

**Result:**
- `uv` installed to `C:\Users\Administrator\.local\bin`
- Includes `uv.exe`, `uvx.exe`, `uvw.exe`

**Add to PATH (each new terminal session):**

```powershell
$env:Path = "C:\Users\Administrator\.local\bin;$env:Path"
```

> **Tip:** To make this permanent, add `C:\Users\Administrator\.local\bin` to your system PATH environment variable.

**Verify:**

```powershell
uv --version
# Output: uv 0.11.21
```

---

## Step 2: Install Spec Kit CLI

**Why:** The `specify` CLI is the core tool that initializes projects, manages templates, and provides the SDD workflow commands.

**Command:**

```powershell
uv tool install specify-cli --from "git+https://github.com/github/spec-kit.git@v0.10.3"
```

> Replace `v0.10.3` with the latest release tag from: https://github.com/github/spec-kit/releases/latest

**Result:**
- `specify-cli` v0.10.3 installed
- Python 3.14.6 auto-downloaded by uv
- Executable `specify` available in PATH

**Verify:**

```powershell
specify --version
# Output: specify 0.10.3
```

---

## Step 3: Check Available Integrations

**Why:** Spec Kit supports 30+ AI coding agents. You need to pick the right integration for your IDE/agent.

**Command:**

```powershell
specify check
```

**Result:** Shows which agent tools are installed. Available IDE-based integrations (no CLI check needed) include GitHub Copilot, Cursor, Cline, Windsurf, Kilo Code, Trae, Roo Code, and Lingma.

---

## Step 4: Initialize Spec Kit in the Project

**Why:** This scaffolds the `.specify/` directory with templates, scripts, workflows, and agent integration files needed for the SDD workflow.

**Command:**

```powershell
specify init . --force --integration copilot --ignore-agent-tools --script ps
```

| Flag | Purpose |
|------|---------|
| `.` | Initialize in the current directory |
| `--force` | Skip confirmation prompt (needed for non-empty directories) |
| `--integration copilot` | Use GitHub Copilot slash-command format (compatible with most agents) |
| `--ignore-agent-tools` | Skip CLI tool detection (since we're using an IDE-based agent) |
| `--script ps` | Use PowerShell scripts instead of Bash |

**Result — Directory structure created:**

```
.specify/
├── extensions/          # Bundled extensions
├── integrations/        # Agent integration config
├── memory/              # Project constitution (created in next step)
│   └── constitution.md
├── scripts/             # PowerShell helper scripts
├── templates/           # Spec, plan, and tasks templates
├── workflows/           # SDD workflow definitions
├── extensions.yml
├── init-options.json
└── integration.json
```

---

## Step 5: Verify Installation

**Command:**

```powershell
specify integration list
```

> Must be run from a project directory that has `.specify/` initialized.

---

## SDD Workflow Commands

After setup, these slash commands are available in your AI coding agent:

### Core Commands (in order)

| # | Command | Purpose |
|---|---------|---------|
| 1 | `/speckit.constitution` | Establish project principles and development guidelines |
| 2 | `/speckit.specify` | Define what to build — requirements and user stories (focus on **what** and **why**, not tech) |
| 3 | `/speckit.plan` | Create technical implementation plan with your chosen tech stack |
| 4 | `/speckit.tasks` | Break down the plan into actionable, ordered tasks |
| 5 | `/speckit.implement` | Execute all tasks and build the feature |

### Optional Commands

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/speckit.clarify` | Structured Q&A to de-risk ambiguous areas | Before `/speckit.plan` |
| `/speckit.analyze` | Cross-artifact consistency & coverage report | After `/speckit.tasks`, before `/speckit.implement` |
| `/speckit.checklist` | Generate quality checklists for requirements validation | After `/speckit.plan` |

---

## Useful Maintenance Commands

```powershell
# Check for newer Spec Kit releases (read-only)
specify self check

# Preview upgrade without applying
specify self upgrade --dry-run

# Upgrade to latest version
specify self upgrade

# Upgrade to a specific version
specify self upgrade --tag vX.Y.Z

# Browse available community extensions
specify extension search

# Install an extension
specify extension add <extension-name>

# Browse available presets
specify preset search

# Install a preset
specify preset add <preset-name>
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `uv` not recognized | Add `C:\Users\Administrator\.local\bin` to PATH: `$env:Path = "C:\Users\Administrator\.local\bin;$env:Path"` |
| `specify` not recognized | Same as above — `specify` is installed in the uv bin directory |
| "Not a spec-kit project" | Run `specify init . --force` in the project root |
| Non-empty directory error | Add `--force` flag to `specify init` |
| Need different integration | Re-run `specify init . --force --integration <name>` |

---

## References

- GitHub Repo: https://github.com/github/spec-kit
- Releases: https://github.com/github/spec-kit/releases
- Docs: https://github.github.io/spec-kit/
- Spec Kit was installed at version **v0.10.3** (June 16, 2026)
