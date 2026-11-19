# Stage 3 customer tracking release

This release is additive. It does not backfill existing orders or send historical messages.

## Required production configuration

- `TRACKING_TOKEN_SECRET`: a separate random secret of at least 32 characters.
- `TRACKING_PUBLIC_BASE_URL=https://forever-beaded-api.onrender.com`
- Keep `FULFILLMENT_NOTIFICATIONS_ENABLED=true`.
- Keep `PAYMENT_REMINDERS_ENABLED=false`.

## Backup before migration

1. Confirm the Render service and persistent disk are healthy.
2. From a Render shell, create a verified backup outside the live database filename:
   `node scripts/backup-orders-db.js "$DATABASE_PATH" "${DATABASE_PATH}.pre-stage-3"`
3. Confirm the command reports a successful SQLite integrity check.
4. Record the backup path and deployment ID before deploying.

## Publication

1. Set `TRACKING_TOKEN_SECRET` and `TRACKING_PUBLIC_BASE_URL` without changing other settings.
2. Deploy the approved Stage 3 commit to the existing service.
3. Confirm `/health`, the owner dashboard, and a new isolated order.
4. Confirm the new order has one tracking-link row and its email contains a `/track#...` link.
5. Do not alter a genuine customer order for testing and do not send historical emails.

## Rollback

1. Disable new traffic or stop the service before replacing the database.
2. Roll back the service to the previously approved commit.
3. If data restoration is required, preserve the current database as a forensic copy, then restore the verified pre-release backup to `DATABASE_PATH`.
4. Restart and verify `/health`, order counts, payment statuses, fulfilment history, and notification history.

The schema changes are additive, so rolling back application code normally does not require removing the new tables or columns. Never delete tracking or notification history during rollback.
