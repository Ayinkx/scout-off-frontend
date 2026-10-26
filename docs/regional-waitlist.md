# Regional waitlist configuration

The player onboarding wizard offers an “Other / region not listed” option. Selecting it displays a waitlist form and blocks registration from treating that placeholder as a supported on-chain region.

The `POST /api/region-waitlist` endpoint validates email and region, rate-limits by client IP, and stores the entry in Upstash Redis. It hashes the email for the Redis key, stores the submitted email/region and timestamp as the value, and does not reveal whether an email already exists.

## Required deployment configuration

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the deployment environment. If either is missing, the endpoint returns HTTP 503 and the form shows an error instead of falsely confirming that data was saved. The same Redis credentials are already used by the application's shared rate limiter.

The waitlist collects email and country/region only. Use the address only for regional-availability updates and apply the project's privacy/retention policy before production launch.
