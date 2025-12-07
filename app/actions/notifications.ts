'use server'

import { prisma } from '@/app/lib/prisma'
import webpush from 'web-push'

if (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(
        'mailto:noreply@planner.com',
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    )
}

export async function subscribeUser(subscription: any, userId: string) {
    if (!userId) return { success: false }

    try {
        await prisma.pushSubscription.create({
            data: {
                userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        })
        return { success: true }
    } catch (e) {
        console.error('Failed to subscribe user:', e)
        return { success: false }
    }
}

export async function sendTestNotification(userId: string) {
    const subs = await prisma.pushSubscription.findMany({ where: { userId } })
    
    if (subs.length === 0) return { success: false, message: 'No subscriptions found' }

    const payload = JSON.stringify({
        title: 'Test Notification',
        body: 'If you see this, notifications are working! 🚀',
        icon: '/icon-192.png'
    })

    for (const sub of subs) {
        try {
            await webpush.sendNotification({
                endpoint: sub.endpoint,
                keys: {
                    p256dh: sub.p256dh,
                    auth: sub.auth
                }
            }, payload)
        } catch (error) {
            console.error('Error sending notification:', error)
            // Ideally remove invalid subscriptions here
            if ((error as any).statusCode === 410) {
                 await prisma.pushSubscription.delete({ where: { id: sub.id } })
            }
        }
    }
    return { success: true }
}

export async function unsubscribeUser(userId: string) {
    if (!userId) return { success: false }
    try {
        await prisma.pushSubscription.deleteMany({
            where: { userId }
        })
        return { success: true }
    } catch (e) {
        console.error('Failed to unsubscribe:', e)
        return { success: false }
    }
}
