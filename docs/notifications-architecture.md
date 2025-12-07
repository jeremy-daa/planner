# Web Push Notification Architecture

Implementing push notifications involves three main actors: the **Client** (Browser), the **Push Service** (Browser Vendor like Google/Mozilla), and our **Server**.

## 1. Prerequisites
- **VAPID Keys**: A pair of public/private keys to securely identify our server to the Push Services.
- **Service Worker**: A script that runs in the background of the browser to listen for "push" events even when the tab is closed.

## 2. Subscription Flow (Client-Side)
1.  **Request Permission**: The app asks the user for permission to send notifications (`Notification.requestPermission()`).
2.  **Service Worker Registration**: The app registers a `service-worker.js` file.
3.  **Subscribe**: The Service Worker contacts the Browser's Push Service to get a unique **Subscription Object** (contains an endpoint URL and encryption keys).
4.  **Save to Server**: The app sends this Subscription Object to our backend, which we save in the database, linked to the `User`.

**Database Schema Addition needed:**
```prisma
model PushSubscription {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  endpoint  String
  p256dh    String   // Encryption key
  auth      String   // Auth key
  createdAt DateTime @default(now())
}
```

## 3. Sending Notifications (Server-Side)
1.  **Trigger**: Determining *when* to send. Since we let users pick a time (`notifTime`), we need a scheduler (like **Vercel Cron** or a temporal job).
2.  **Query**: Every hour (or 15 mins), the job runs:
    *   "Find all users whose `notifTime` matches the current hour."
    *   "Get their active Push Subscriptions."
3.  **Dispatch**: The server uses the `web-push` library (signed with VAPID keys) to send the notification payload to the stored `endpoint`.

## 4. Receiving (Browser)
1.  The Browser's Push Service validates the request and wakes up the Service Worker.
2.  The Service Worker receives the `push` event.
3.  The Service Worker calls `self.registration.showNotification()` to display the system toast.

## Implementation Roadmap
1.  Install `web-push` and generate VAPID keys.
2.  Update Prisma schema with `PushSubscription`.
3.  Create `public/sw.js` (Service Worker).
4.  Build the "Enable Notifications" button in `UserProfile` component.
5.  Create a standard API route `/api/cron/reminders` to be triggered by a scheduler.
