# Codecov branch-protection recommendation

The repository CI already runs Jest with project-wide coverage thresholds and uploads `coverage/lcov.info` to Codecov. `codecov.yml` adds project and patch status policies, but repository branch-protection settings are not version-controlled here and the current GitHub integration cannot update them.

After the Codecov checks have reported on a pull request at least once, a repository administrator should open **Settings → Rules → Rulesets** (or **Settings → Branches → Branch protection rules**, depending on the repository setup), edit the rule protecting `main`, and require the Codecov project and patch status checks. Use the exact check names shown by GitHub; they may appear as `codecov/project` and `codecov/patch`.

The project target uses the current Codecov baseline with a 2% tolerance, while the patch target is 80% with a 5% tolerance. Review the first real report before making the checks mandatory, and adjust only if the measured baseline shows the initial patch target is not realistic.
