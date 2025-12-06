'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function getFinancialInsights() {
     const now = new Date()
     const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
     const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
     
     // 1. Total Budget vs Spend
     const budgets = await prisma.budget.findMany()
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     const totalBudget = budgets.reduce((acc: number, b: any) => acc + b.amount, 0)
     
     const monthlyExpenses = await prisma.expense.aggregate({
         where: {
             date: {
                 gte: startOfMonth,
                 lte: endOfMonth
             }
         },
         _sum: { amount: true }
     })
     const totalSpent = monthlyExpenses._sum.amount || 0

     // 2. Spending Velocity & Projection
     // Get daily spending for this month
     const expenses = await prisma.expense.findMany({
         where: {
             date: {
                 gte: startOfMonth,
                 lte: endOfMonth
             }
         },
         orderBy: { date: 'asc' }
     })

     const daysInMonth = endOfMonth.getDate()
     const currentDay = now.getDate()
     const dailyAverage = currentDay > 0 ? totalSpent / currentDay : 0
     const projectedSpend = dailyAverage * daysInMonth

     // 3. Category Breakdown (Spend vs Budget)
     // Get aggregates by category
     const expensesByCategory: Record<string, number> = {}
     // eslint-disable-next-line @typescript-eslint/no-explicit-any
     expenses.forEach((e: any) => {
         const cat = e.category || 'General'
         expensesByCategory[cat] = (expensesByCategory[cat] || 0) + e.amount
     })

     const categoryInsights = budgets.map((b: { category: string, amount: number }) => ({
         category: b.category,
         budget: b.amount,
         spent: expensesByCategory[b.category] || 0,
         percent: b.amount > 0 ? ((expensesByCategory[b.category] || 0) / b.amount) * 100 : 0
     })).sort((a: any, b: any) => b.percent - a.percent)

     // Add "Unbudgeted" categories?
     // Find keys in expensesByCategory not in budgets
     Object.keys(expensesByCategory).forEach(cat => {
         // eslint-disable-next-line @typescript-eslint/no-explicit-any
         if (!budgets.find((b: any) => b.category === cat)) {
             categoryInsights.push({
                 category: cat,
                 budget: 0,
                 spent: expensesByCategory[cat],
                 percent: 100 // technically infinite, but visually full warning
             })
         }
     })

     return {
         overview: {
             totalBudget,
             totalSpent,
             remaining: totalBudget - totalSpent,
             percentUsed: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
             projectedSpend,
             dailyAverage,
             status: totalSpent > totalBudget ? 'critical' : (totalSpent > totalBudget * 0.85 ? 'warning' : 'good')
         },
         categoryInsights,
         recentBigTransactions: await prisma.expense.findMany({
             take: 5,
             orderBy: { amount: 'desc' },
             where: { date: { gte: startOfMonth } },
             include: { payer: true }
         })
     }
}
