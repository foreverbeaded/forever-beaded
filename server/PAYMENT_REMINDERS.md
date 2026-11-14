# Payment reminder operations

The reminder system is disabled by default. Deploying the code or running the
schema migration does not enroll historical orders and does not send email.

## Architecture

- New orders are enrolled only when `PAYMENT_REMINDERS_ENABLED=true` at the
  moment the server saves the order.
- Reminder state is stored in the same SQLite database as the order.
- The owner dashboard is `/admin/orders` and uses the existing `ADMIN_SECRET`.
- A scheduler calls `POST /api/internal/payment-reminders/run` with a separate
  bearer secret in `PAYMENT_REMINDER_SCHEDULER_SECRET`.
- The web service performs the database work and email send. A Render Cron Job
  must not open the SQLite file because Render cron services cannot access the
  web service's persistent disk.

## Activation checklist

1. Deploy the reviewed backend commit without enabling reminders.
2. Confirm the migration created `payment_reminders` and added
   `orders.payment_confirmed_at` without changing existing rows.
3. Open `/admin/orders`, authenticate, and verify historical orders show
   `Not enrolled`.
4. Set a unique, long `PAYMENT_REMINDER_SCHEDULER_SECRET` on the web service.
5. Add any owner-controlled test addresses to
   `PAYMENT_REMINDER_EXCLUDED_EMAILS` as a comma-separated list.
6. After explicit owner approval, set `PAYMENT_REMINDERS_ENABLED=true` and
   redeploy the web service.
7. Configure an hourly Render Cron Job to send an authenticated POST request to
   the scheduler endpoint. Store the same scheduler secret only in Render.
8. Create a controlled test order, confirm its due time, and verify the mocked
   or controlled recipient before allowing genuine customer reminders.

Example cron command, with the secret stored in the cron service environment:

```sh
curl --fail --silent --show-error --request POST \
  --header "Authorization: Bearer $PAYMENT_REMINDER_SCHEDULER_SECRET" \
  https://forever-beaded-api.onrender.com/api/internal/payment-reminders/run
```

An hourly schedule is sufficient. The database uses the exact server-created
due timestamp, so an hourly trigger sends only after 48 full hours.

Render currently charges a minimum of US$1 per month for each cron job. Cron
jobs cannot mount the web service's persistent disk, which is why this cron
only makes an authenticated HTTPS request and the web service performs all
database and email work.

## Failure behavior

Provider rejection is retried up to three automatic attempts, at least six
hours apart. A process crash while provider acceptance is uncertain moves the
reminder to `ATTENTION` instead of automatically risking a duplicate. The owner
can check the provider and use the dashboard's manual retry control.

`SENT` means the SMTP provider accepted the message. It does not prove inbox
delivery or that the customer read it.

## Fulfilment progress notifications

The owner dashboard also supports New, In Progress, Made / Completed, Shipped,
Ready for Pickup, and Delivered as a payment-independent fulfilment state. The
schema and controls are safe to deploy with customer messages disabled.

- Keep `FULFILLMENT_NOTIFICATIONS_ENABLED=false` until the owner approves the
  email copy and live activation.
- Add controlled test addresses to
  `FULFILLMENT_NOTIFICATION_EXCLUDED_EMAILS` when they must never receive a
  progress email.
- Repeatedly saving the same milestone does not send another message. Each
  notification milestone is unique per order and records provider acceptance,
  attempts, errors, and timestamps in SQLite.
- The owner can suppress future customer progress messages per order. Resuming
  does not retroactively send a message that was suppressed.
- Shipped messages include tracking only when the owner enters valid tracking
  information. Delivered messages are sent only after an explicit owner status
  change.
