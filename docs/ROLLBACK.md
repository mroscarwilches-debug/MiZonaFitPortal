# Rollback Strategy

## Site content (AWS EC2)

The instance serves whatever `main` contained when it was last built. To roll
back content:

1. `git revert <bad-commit> && git push` (prefer `revert` over `reset` so
   history stays linear and CI re-validates the result).
2. Apply it on the instance:
   `ssh -i <pem> ubuntu@<ip> "cd /opt/warrior-code-portal && git pull && cd app && docker compose up -d --build"`

Nuclear option (fresh instance from scratch, ~5 min):
`terraform taint aws_instance.web && terraform apply`.

## Site content (Cloudflare Pages, if ever adopted)

Cloudflare dashboard → Pages project → Deployments → previous good deployment →
"Rollback to this deployment" (instant, no git involved).

## Infrastructure (Terraform)

- State is versioned in S3 (`wilchesfitness-tfstate`, versioning enabled).
  A corrupted state can be restored from a previous S3 object version.
- Infrastructure changes are rolled back by reverting the `.tf` change in git
  and running `terraform apply` (manual workflow or CLI).
- Emergency teardown: `terraform destroy` — the site itself stays safe in git.

## Images / assets

Optimized assets are committed to git (rollback = git revert). Original photos
remain on `F:\MiZonaFit` and are never modified by the pipeline
(`tools/optimize-images.mjs` is read-only over sources).
