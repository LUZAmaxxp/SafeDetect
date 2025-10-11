# CI/CD Pipeline Implementation

## Steps to Complete:

- [x] Create `.github/workflows/ci-cd.yml` with:
  - Trigger on push to main branch.
  - Job to build and push Docker images for root, Authentication_service, backend_Python, and Dashboard_Service to GitHub Container Registry (ghcr.io).
  - Job to deploy Authentication_service and Dashboard_Service to Vercel using Vercel CLI with provided secrets.

- [x] After creation, verify the workflow file syntax and structure.

- [ ] User to test by pushing changes to main branch and monitor GitHub Actions.

- [ ] If issues arise, troubleshoot based on workflow logs (e.g., adjust build contexts or Vercel configs if needed).
