'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Frequency } from '@prisma/client'

export async function createChore(data: { 
    title: string, 
    description: string,
    icon: string, 
    frequency: Frequency, 
    customInterval?: number,
    difficulty: number,
    assigneeIds: string[],
    nextDueDate?: Date
}) {
    const chore = await prisma.chore.create({
        data: {
            title: data.title,
            description: data.description,
            icon: data.icon,
            frequency: data.frequency,
            customInterval: data.customInterval,
            difficulty: data.difficulty,
            assigneeIds: data.assigneeIds
        }
    })

    // Create first instance immediately
    const firstAssignee = data.assigneeIds.length > 0 ? data.assigneeIds[0] : null
    
    await prisma.choreInstance.create({
        data: {
            choreId: chore.id,
            assignedUserId: firstAssignee,
            dueDate: data.nextDueDate || new Date(),
            status: 'PENDING'
        }
    })

    revalidatePath('/')
}

export async function updateChore(id: string, data: {
    title: string,
    description: string,
    icon: string,
    frequency: Frequency,
    customInterval?: number,
    difficulty: number,
    assigneeIds: string[],
    nextDueDate?: Date
}) {
    await prisma.chore.update({
        where: { id },
        data: {
            title: data.title,
            description: data.description,
            icon: data.icon,
            frequency: data.frequency,
            customInterval: data.customInterval,
            difficulty: data.difficulty,
            assigneeIds: data.assigneeIds
        }
    })

    if (data.nextDueDate) {
        const pending = await prisma.choreInstance.findFirst({
            where: { choreId: id, status: 'PENDING' }
        })
        if (pending) {
            await prisma.choreInstance.update({
                where: { id: pending.id },
                data: { dueDate: data.nextDueDate }
            })
        }
    }

    revalidatePath('/')
}

export async function deleteChore(id: string) {
    await prisma.choreInstance.deleteMany({ where: { choreId: id } })
    await prisma.chore.delete({ where: { id } })
    revalidatePath('/')
}

export async function getChores() {
    return await prisma.chore.findMany({
        include: {
            instances: {
                where: { status: 'PENDING' },
                take: 1,
                orderBy: { dueDate: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    })
}
