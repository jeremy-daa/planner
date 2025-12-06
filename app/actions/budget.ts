'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'

// Set budget by category name (Create or Update if name matches)
export async function setBudget(category: string, amount: number, icon?: string, color?: string) {
    await prisma.budget.upsert({
        where: { category },
        update: { amount, icon, color },
        create: { category, amount, icon, color }
    })
    revalidatePath('/')
}

// Explicit update by ID (Allows renaming)
export async function updateBudget(id: string, data: { category: string, amount: number, icon?: string, color?: string }) {
    await prisma.budget.update({
        where: { id },
        data: {
            category: data.category,
            amount: data.amount,
            icon: data.icon,
            color: data.color
        }
    })
    revalidatePath('/')
}

export async function getBudgets() {
    return await prisma.budget.findMany()
}

export async function getExpensesByCategory(month: number, year: number) {
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0)

    const expenses = await prisma.expense.findMany({
        where: {
            date: {
                gte: startDate,
                lte: endDate
            }
        }
    })

    // Group by category
    const byCategory: Record<string, number> = {}
    expenses.forEach(e => {
        const cat = e.category || 'General'
        byCategory[cat] = (byCategory[cat] || 0) + e.amount
    })

    return byCategory
}

export async function getMonthlyTrend() {
    // Get last 6 months
    const today = new Date()
    const data = []
    
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1)
        const month = d.getMonth()
        const year = d.getFullYear()
        const startDate = new Date(year, month, 1)
        const endDate = new Date(year, month + 1, 0)
        
        const sum = await prisma.expense.aggregate({
            where: {
                date: { gte: startDate, lte: endDate }
            },
            _sum: { amount: true }
        })
        
        data.push({
            name: d.toLocaleString('default', { month: 'short' }),
            total: sum._sum.amount || 0
        })
    }
    return data
}

export async function getRecentTransactions() {
    return await prisma.expense.findMany({
        take: 20,
        orderBy: { date: 'desc' },
        include: { payer: true }
    })
}
