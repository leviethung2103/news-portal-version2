---
mode: agent
---
Define the task to achieve, including specific requirements, constraints, and success criteria.
- Commit the changes to the repository with a clear and concise message.
- Ensure the commit message follows the conventional commit format.
- The commit should include all recent changes made to the project files.
- The commit should not include any deleted files or directories.
- The commit should be made to the main branch of the repository.
- The commit should include a reference to the issue or task that the changes address, if applicable
- CHANGELOG.md should be updated to reflect the changes made in commit.
- Ensure that the commit does not include any unnecessary files or directories.
- Update the README.md file to reflect the current state of the project, including instructions for running both the frontend and backend.
- Ensure that the README.md file is clear and easy to understand for new developers.
- The commit should be made with a timestamp and author information.
<!-- - Run the npm run build command to ensure the project builds successfully before committing. -->

<!-- ## Frontend Setup
At the root of project, run command
```bash
cd frontend && npm run build
```
## Backend Setup
At the root of project, run command
```bash
cd backend
# conda create -n news-portal python=3.12
conda activate news-portal
pip install -r requirements.txt
python run.py
# or 
python run.py dev
``` -->


- Here is the format of CHANGELOG
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- _(Describe new features or functionality not yet released)_

### Changed
- _(Describe changes to existing features or APIs)_

### Deprecated
- _(List features that will be removed in future versions)_

### Removed
- _(List features removed in this version)_

### Fixed
- _(List bug fixes or issues resolved)_

### Security
- _(List security updates or fixes)_

---

## [1.0.0] - YYYY-MM-DD
### Added
- Initial release.
- _(List main features introduced in this release)_

---

## [Versioning Notes]
- Follow **Semantic Versioning (SemVer)**:
  - `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)
  - Increment:
    - MAJOR for incompatible API changes,
    - MINOR for added functionality (backward-compatible),
    - PATCH for bug fixes.

---

## Example for Next Versions

## [1.1.0] - YYYY-MM-DD
### Added
- Feature X for Y.

### Changed
- Improved performance of Z.

### Fixed
- Resolved crash when using W.