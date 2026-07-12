# Backup Strategy

The site doesn't store any data on its own — there's no database, and
nothing typed by a visitor is saved on a server. That makes backups simple:
there are only three things worth protecting.

| What | Main copy lives here | Backed up to | How often |
|---|---|---|---|
| Site code + images + docs | This computer's repo | GitHub (`origin`) | Every push |
| Original photos | `F:\MiZonaFit`, `F:\MarcaPersonal` | **Needs action** — see below | Manual |
| Terraform's state file | S3 bucket `wilchesfitness-tfstate` | S3 versioning (already on) | Automatic |

## What to do

1. **Push often.** GitHub is the safety copy of the entire site, images
   included — the optimized versions add up to under 2 MB total.
2. **The original photos are the one thing that can't be recreated.** They
   only exist on one drive (`F:`). It's worth backing them up to an external
   drive or a cloud service like Google Drive or OneDrive (free at this
   size). The site itself can be rebuilt without them, but new photo crops
   or sizes can't be made without the originals.
3. **Contact form messages aren't stored anywhere** by the site itself. If a
   real form endpoint gets added when the site goes live (see
   docs/DEPLOYMENT.md), messages will simply arrive by email — the inbox
   becomes the record.
4. **Terraform's state** already has automatic point-in-time recovery
   through S3 versioning. Never keep state files on your computer or in git.

## How to restore things

- **If you lose your computer:** `git clone` the repo, then
  `cd app && docker compose up --build`. That's the whole local setup back,
  in minutes.
- **If a deployment breaks something:** see docs/ROLLBACK.md.
- **If the Terraform state gets corrupted:** restore an earlier version of
  `terraform.tfstate` from the S3 bucket, then run `terraform plan` to check
  everything still matches.
