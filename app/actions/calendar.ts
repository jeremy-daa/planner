'use server'

import { prisma } from '@/app/lib/prisma'
import { startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns'

export async function getCalendarEvents(month: Date) {
    const start = startOfMonth(month)
    // Fetch a bit more to cover grid padding if needed, but simple month is usually fine for 'Agenda' list.
    // However, the calendar grid might show prev/next month days. 
    // Let's grab -7 days +7 days to be safe for visual indicators if we want precise per-grid-cell data,
    // but usually just querying the broad range is enough.
    const end = endOfMonth(month)

    const instances = await prisma.choreInstance.findMany({
        where: {
            dueDate: {
                gte: start,
                lte: end
            }
        },
        include: {
            chore: {
                select: {
                    title: true,
                    icon: true,
                    difficulty: true
                }
            },
            assignedUser: {
                select: {
                    id: true,
                    name: true,
                    color: true,
                    avatar: true
                }
            }
        },
        orderBy: {
            dueDate: 'asc'
        }
    })

    return instances
}
