# Rollback — What to Do If Something Breaks

## The site's content (AWS EC2)

The server always shows whatever was on `main` the last time it was built.
To undo a bad change:

1. `git revert <bad-commit> && git push` (use `revert` instead of `reset` —
   it keeps history intact and lets the automatic checks re-verify the
   result).
2. Apply it on the server:
   `ssh -i <pem> ubuntu@<ip> "cd /opt/warrior-code-portal && git pull && cd app && docker compose up -d --build"`

If you need to start completely fresh (takes about 5 minutes):
`terraform taint aws_instance.web && terraform apply`.

## The site's content (if Cloudflare Pages is ever used instead)

Cloudflare dashboard → Pages project → Deployments → pick the last good
deployment → "Rollback to this deployment". Instant, no git commands needed.

## The infrastructure itself (Terraform)

- The state file is versioned in S3 (`wilchesfitness-tfstate`, with version
  history turned on). If it gets corrupted, restore a previous version from
  S3.
- To undo an infrastructure change, revert the `.tf` file change in git and
  run `terraform apply` again.
- In an emergency, `terraform destroy` tears everything down — the site's
  code stays completely safe in git either way.

## Images and other assets

Optimized images are committed to git, so rolling them back is just a
`git revert`. The original photos stay on `F:\MiZonaFit` and are never
modified by the optimization script (`tools/optimize-images.mjs` only reads
from there, never writes to it).
