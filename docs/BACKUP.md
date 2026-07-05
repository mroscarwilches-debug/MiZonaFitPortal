# Backup Strategy

The system is intentionally stateless: there is no database and no user data is
stored server-side. That reduces backup scope to three artifacts.

| Artifact | Primary copy | Backup | Frequency |
|---|---|---|---|
| Source code + optimized assets + docs | Local repo | GitHub remote (`origin`) | every push |
| Original photos | `F:\MiZonaFit`, `F:\MarcaPersonal` | **Action required** — external drive or cloud storage (see below) | manual |
| Terraform state | S3 `wilchesfitness-tfstate` | S3 versioning (enabled) | automatic |

## Recommendations

1. **Push regularly.** The GitHub remote is the disaster-recovery copy of the
   entire site (images included — optimized variants total < 2 MB).
2. **Original photos are the only unrecoverable asset.** They exist on a single
   local drive (`F:`). Recommended: back them up to an external disk or a cloud
   drive (Google Drive/OneDrive; ~free at this volume). The site can be rebuilt
   without them, but new image sizes/crops cannot.
3. **Contact form submissions** are not stored by the site. If a form endpoint
   is added at publish time (docs/DEPLOYMENT.md), submissions arrive by email —
   the mailbox is the record.
4. **Terraform state**: S3 versioning already provides point-in-time recovery.
   Do not store state files locally or in git.

## Restore procedures

- **Lost workstation:** `git clone` → `cd app && docker compose up --build`.
  Full local environment restored in minutes; no other setup required.
- **Corrupted deployment:** see docs/ROLLBACK.md.
- **Corrupted Terraform state:** restore the previous object version of
  `terraform.tfstate` in the S3 bucket, then `terraform plan` to verify drift.
