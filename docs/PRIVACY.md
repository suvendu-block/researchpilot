# PRIVACY.md — Privacy Policies

## Data We Collect

### User Data
- **Account:** Email, name (if provided)
- **Searches:** Topics searched, results returned, timestamps
- **Saved papers:** Paper IDs, tags, notes

### Usage Data
- **API calls:** Request/response metadata, timing
- **Errors:** Error messages, stack traces (no PII)
- **Costs:** Token usage, estimated costs

### We Do NOT Collect
- Paper content (abstracts are fetched, not stored permanently)
- Personal research details
- Browsing history outside the app
- Location data

## How We Use Data

| Data | Purpose | Retention |
|------|---------|-----------|
| Search history | Improve recommendations | 90 days |
| Saved papers | User's library | Until deleted |
| API logs | Debugging, monitoring | 30 days |
| Cost data | Billing, optimization | 1 year |

## Data Sharing

We do **not** share personal data with third parties.

### Service Providers
- **OpenAI:** LLM processing (anonymized queries only)
- **Semantic Scholar:** Paper search (no user data sent)
- **PostgreSQL:** Data storage (self-hosted or encrypted cloud)
- **Redis:** Caching (no sensitive data)

## Data Security

- All data encrypted in transit (HTTPS)
- Database encryption at rest
- API keys never logged
- PII redacted from logs
- Regular security audits

## Your Rights

- **Access:** Request a copy of your data
- **Delete:** Request deletion of your account and data
- **Export:** Export your saved papers and search history
- **Opt-out:** Disable analytics tracking

## Contact

For privacy concerns: privacy@researchpilot.dev

## Changes

We will notify users of material changes to this policy via email.
