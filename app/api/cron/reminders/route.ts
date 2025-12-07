import { prisma } from '@/app/lib/prisma'
import webpush from 'web-push'
import { NextResponse } from 'next/server'

// Configure VAPID for this route handler context
if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:noreply@planner.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

// Vercel Cron will hit this endpoint
export async function GET(req: Request) {
    if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
        // Optional: Secure this endpoint so random people can't trigger it
        // return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const now = new Date()
        // Format current time as HH:MM to match user preference
        // Note: Server time is usually UTC. Adjust logic if users expect local time.
        // For simplicity, we assume users set times in UTC or we handle offset.
        // A better approach is storing timezone or normalizing everything to UTC.
        
        const currentHour = now.getUTCHours()
        const currentMinute = now.getUTCMinutes()
        
        // Find users who want reminders roughly now
        // We run every 30 mins, so we check a window or exact match?
        // Exact match of HH:MM is hard if cron is slightly off.
        // Let's just find users with 'notifTime'
        
        // Simple simplified logic: Check all users, parse their time, if it's "close" to now, send.
        
        const users = await prisma.user.findMany({
            where: {
                notifTime: { not: null },
                pushSubscriptions: { some: {} } // Only users with subs
            },
            include: {
                pushSubscriptions: true,
                assignedChoreInstances: {
                    where: { status: 'PENDING', dueDate: { lte: now } }
                }
            }
        })

        let sentCount = 0

        for (const user of users) {
             console.log(`Checking User: ${user.name} | Subscriptions: ${user.pushSubscriptions.length} | Pending Chores: ${user.assignedChoreInstances.length}`)
             if (!user.notifTime) continue

             const [h, m] = user.notifTime.split(':').map(Number)
             
             // Strict Time Check: Verify if user's preferred UTC time matches current Server UTC time
             // We allow a small window (e.g. +/- 30 mins) to account for cron jitter
             const isTime = Math.abs(h - currentHour) === 0 && Math.abs(m - currentMinute) < 30
             
             // For testing: bypass time check if needed, OR uncomment line below to enforce
             // if (!isTime) continue

             if (user.assignedChoreInstances.length > 0) {
                 const payload = JSON.stringify({
                     title: `Hey ${user.name}!`,
                     body: `You have ${user.assignedChoreInstances.length} pending chores properly due. Time to keep the streak!`,
                     icon: '/icon-192.png'
                 })

                 for (const sub of user.pushSubscriptions) {
                     try {
                         await webpush.sendNotification({
                             endpoint: sub.endpoint,
                             keys: { p256dh: sub.p256dh, auth: sub.auth }
                         }, payload)
                         sentCount++
                     } catch (e) {
                         console.error('Push failed', e)
                         if ((e as any).statusCode === 410) {
                             await prisma.pushSubscription.delete({ where: { id: sub.id } })
                         }
                     }
                 }
             }
        }

        return NextResponse.json({ success: true, sent: sentCount })
    } catch (e) {
        console.error('Cron failed', e)
        return NextResponse.json({ success: false, error: (e as any).message }, { status: 500 })
    }
}
