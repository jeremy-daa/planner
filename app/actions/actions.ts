'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addDays, addWeeks, addMonths, differenceInCalendarDays } from 'date-fns'

export async function getUsers() {
    return await prisma.user.findMany()
}

export async function getLeaderboard() {
    return await prisma.user.findMany({
        orderBy: { points: 'desc' },
        take: 10
    })
}

export async function getDashboardData(userId: string) {
    if (!userId) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // My tasks for today (or overdue)
    const myTasks = await prisma.choreInstance.findMany({
        where: {
            assignedUserId: userId,
            status: { in: ['PENDING', 'MISSED'] },
            dueDate: { lte: tomorrow } // due today or before
        },
        include: { chore: true },
        orderBy: { dueDate: 'asc' }
    })

    // Next Up (future)
    const nextUp = await prisma.choreInstance.findMany({
        where: {
            assignedUserId: userId,
            status: 'PENDING',
            dueDate: { gt: tomorrow }
        },
        include: { chore: true },
        orderBy: { dueDate: 'asc' },
        take: 5
    })

    // Notifications (Transfers)
    const incomingTransfers = await prisma.transferRequest.findMany({
        where: {
            toUserId: userId,
            status: 'PENDING'
        },
        include: { 
            fromUser: true,
            choreInstance: { include: { chore: true } }
        }
    })

    return { myTasks, nextUp, incomingTransfers }
}

export async function toggleTask(instanceId: string, completed: boolean) {
    const instance = await prisma.choreInstance.findUnique({
        where: { id: instanceId },
        include: { chore: true }
    })

    if (!instance) throw new Error('Task not found')

    if (completed) {
        // 1. Mark completed
        await prisma.choreInstance.update({
            where: { id: instanceId },
            data: { 
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })

        // 2. Gamification Logic
        if (instance.assignedUserId) {
            const user = await prisma.user.findUnique({ where: { id: instance.assignedUserId } })
            if (user) {
                const pointsToAdd = instance.chore.difficulty
                const newPoints = user.points + pointsToAdd
                const newLevel = Math.floor(newPoints / 500) + 1 // 500 points per level

                // Streak Logic
                const today = new Date()
                const last = user.lastCompletedAt
                let newStreak = user.streak

                if (!last) {
                    newStreak = 1
                } else {
                    const diff = differenceInCalendarDays(today, last)
                    if (diff === 1) {
                        newStreak += 1
                    } else if (diff > 1) {
                        newStreak = 1
                    }
                    // if diff === 0 (same day), streak remains same
                }

                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        points: newPoints,
                        level: newLevel,
                        streak: newStreak,
                        lastCompletedAt: new Date()
                    }
                })
            }
        }

        // 3. Generate next instance
        let nextDate = new Date(instance.dueDate)
        const freq = instance.chore.frequency
        const baseDate = new Date() // Now

        if (freq === 'DAILY') nextDate = addDays(baseDate, 1)
        else if (freq === 'WEEKLY') nextDate = addWeeks(baseDate, 1)
        else if (freq === 'BIWEEKLY') nextDate = addWeeks(baseDate, 2)
        else if (freq === 'MONTHLY') nextDate = addMonths(baseDate, 1)
        else if (freq === 'QUARTERLY') nextDate = addMonths(baseDate, 3)
        else if (freq === 'YEARLY') nextDate = addMonths(baseDate, 12)
        else if (freq === 'CUSTOM' && instance.chore.customInterval) nextDate = addDays(baseDate, instance.chore.customInterval)

        if (freq !== 'CUSTOM' || (freq === 'CUSTOM' && instance.chore.customInterval)) {
             let nextAssignee = instance.assignedUserId
             
             // Rotation Logic
             const assigneeIds = instance.chore.assigneeIds
             if (assigneeIds && assigneeIds.length > 1) {
                 const currentIdx = instance.assignedUserId ? assigneeIds.indexOf(instance.assignedUserId) : -1
                 let nextIdx = 0
                 if (currentIdx !== -1) {
                     nextIdx = (currentIdx + 1) % assigneeIds.length
                 }
                 nextAssignee = assigneeIds[nextIdx]
             }

             await prisma.choreInstance.create({
                data: {
                    choreId: instance.choreId,
                    assignedUserId: nextAssignee,
                    dueDate: nextDate, 
                    status: 'PENDING'
                }
            })
        }

    } else {
        // Un-complete?
        await prisma.choreInstance.update({
            where: { id: instanceId },
            data: { 
                status: 'PENDING',
                completedAt: null
            }
        })
    }

    revalidatePath('/')
}

export async function requestTransfer(instanceId: string, toUserId: string, fromUserId: string) {
    await prisma.transferRequest.create({
        data: {
            choreInstanceId: instanceId,
            fromUserId,
            toUserId,
            status: 'PENDING'
        }
    })
    revalidatePath('/')
}

export async function respondToTransfer(requestId: string, accept: boolean) {
    const request = await prisma.transferRequest.findUnique({
        where: { id: requestId },
        include: { choreInstance: true }
    })
    
    if (!request) return

    if (accept) {
        await prisma.$transaction([
            prisma.transferRequest.update({
                where: { id: requestId },
                data: { status: 'ACCEPTED' }
            }),
            prisma.choreInstance.update({
                where: { id: request.choreInstanceId },
                data: { assignedUserId: request.toUserId }
            })
        ])
    } else {
        await prisma.transferRequest.update({
            where: { id: requestId },
            data: { status: 'REJECTED' }
        })
    }
    revalidatePath('/')
}
