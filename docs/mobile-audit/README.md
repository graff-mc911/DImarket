# Mobile audit artifacts

- **Report:** [MOBILE_UX_AUDIT_REPORT.md](./MOBILE_UX_AUDIT_REPORT.md)
- **Remediation plan:** [REMEDIATION_PLAN.md](./REMEDIATION_PLAN.md)
- **Harness:** `e2e/mobile-audit.spec.ts`

```bash
PLAYWRIGHT_BASE_URL=https://dimarket.app npx playwright test e2e/mobile-audit.spec.ts --project=chromium
```
