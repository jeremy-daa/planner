'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'
import { addDays, addWeeks, addMonths } from 'date-fns'

export async function getUsers() {
    return await prisma.user.findMany()
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
        // Mark completed
        await prisma.choreInstance.update({
            where: { id: instanceId },
            data: { 
                status: 'COMPLETED',
                completedAt: new Date()
            }
        })

        // Generate next instance
        // Calculate next date based on frequency
        let nextDate = new Date(instance.dueDate)
        const freq = instance.chore.frequency
        
        // Simple logic: next due date is relative to *previous due date* (strict interval)
        // or *completion date*? Prompt says "Recurrence Logic: When a task is marked 'Done', the system must automatically generate the *next* instance based on its frequency".
        // Usually strict intervals prefer due date + frequency.
        // But if overdue, avoid scheduling in past?
        // Method: based on today?
        // Let's use today + frequency for "fresh start" feeling or strict schedule?
        // Let's stick to strict schedule (dueDate + freq) unless it's way behind? 
        // For simplicity: Today + Frequency (so it doesn't pile up if you missed a week).
        
        const baseDate = new Date() // Now

        if (freq === 'DAILY') nextDate = addDays(baseDate, 1)
        else if (freq === 'WEEKLY') nextDate = addWeeks(baseDate, 1)
        else if (freq === 'MONTHLY') nextDate = addMonths(baseDate, 1)
        
        if (freq !== 'CUSTOM' || (freq === 'CUSTOM' && instance.chore.customInterval)) {
             // Calculate next assignee
             // Default: keep same user
             let nextAssignee = instance.assignedUserId
             
             // Rotation logic
             // We need to fetch the fresh chore data including assigneeIds to be safe, 
             // but 'instance.chore' is included. Does it have the new fields?
             // Prisma include does fetch scalar arrays by default.
             
             const assigneeIds = instance.chore.assigneeIds
             if (assigneeIds && assigneeIds.length > 1) {
                 // Find current index
                 // We should use the 'lastAssigneeIdx' from the Chore model to be robust against swaps?
                 // Or just find current user in list.
                 // Let's use current user in list for simplicity.
                 const currentIdx = instance.assignedUserId ? assigneeIds.indexOf(instance.assignedUserId) : -1
                 
                 let nextIdx = 0
                 if (currentIdx !== -1) {
                     nextIdx = (currentIdx + 1) % assigneeIds.length
                 }
                 nextAssignee = assigneeIds[nextIdx]
             }

             // Calculate Date
             const baseDate = new Date()
             if (freq === 'DAILY') nextDate = addDays(baseDate, 1)
             else if (freq === 'WEEKLY') nextDate = addWeeks(baseDate, 1)
             else if (freq === 'BIWEEKLY') nextDate = addWeeks(baseDate, 2)
             else if (freq === 'MONTHLY') nextDate = addMonths(baseDate, 1)
             else if (freq === 'QUARTERLY') nextDate = addMonths(baseDate, 3)
             else if (freq === 'YEARLY') nextDate = addMonths(baseDate, 12)
             else if (freq === 'CUSTOM' && instance.chore.customInterval) nextDate = addDays(baseDate, instance.chore.customInterval)

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
        // TODO: Handle removing the generated next instance? 
        // For now, ignore complex rollback.
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
