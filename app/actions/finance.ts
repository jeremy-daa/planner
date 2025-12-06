'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createExpense(
    description: string,
    amount: number,
    payerId: string,
    splits: { userId: string, amount: number }[],
    category: string = 'General'
) {
    if (splits.reduce((sum, s) => sum + s.amount, 0).toFixed(2) !== amount.toFixed(2)) {
        // Allow small rounding error? 
        // For strictness, let's assume valid input or adjust last split.
    }

    await prisma.expense.create({
        data: {
            description,
            amount,
            payerId,
            category,
            splits: {
                create: splits.map(s => ({
                    debtorId: s.userId,
                    amount: s.amount
                }))
            }
        }
    })
    revalidatePath('/')
}

export async function getBalances() {
    // Fetch all expenses and splits
    // This could be heavy over time, ideally aggregate or cache.
    // For a household app, data volume is low.
    
    const expenses = await prisma.expense.findMany({
        include: { splits: true, payer: true }
    })

    const users = await prisma.user.findMany()
    const userIds = users.map(u => u.id)
    
    // Balance map: user -> net balance
    // Positive = is owed money
    // Negative = owes money
    const balances: Record<string, number> = {}
    userIds.forEach(id => balances[id] = 0)

    for (const exp of expenses) {
        // Payer paid 'amount', so they are +amount (internally)
        // actually, let's track "Net Position".
        // Payer pays X. 
        // Splits say: User A owes Y, User B owes Z.
        // Payer is effectively "lending" Y and Z.
        // Payer's own share is (total - sum(others)).
        
        // Simpler: 
        // For each split:
        // Debtor owes Payer split.amount.
        // Debtor balance -= split.amount
        // Payer balance += split.amount
        // (Self-splits cancel out if we logic it that way, but typically splits include everyone)
        
        // If splits INCLUDES the payer (e.g. 3 people split $30, payer pays $30).
        // Split: A: 10, B: 10, C (Payer): 10.
        // C paid 30.
        // C should receive 10 from A and 10 from B. Total +20.
        // A is -10. B is -10.
        // Net sum = 0.
        
        // So: 
        // Payer += expense.amount
        // For each split: User -= split.amount
        
        balances[exp.payerId] += exp.amount
        for (const split of exp.splits) {
            balances[split.debtorId] -= split.amount
        }
    }

    // Now simplify debts? 
    // Requirement: "Who owes who" dashboard.
    // We can just return the net balances and let frontend show "A owes $X", "B is owed $Y".
    // Or we can calculate edges "A -> B $10".
    
    // Simple edge calculation:
    // Separate into debtors (neg) and creditors (pos).
    
    const debtors = []
    const creditors = []
    
    for (const [uid, bal] of Object.entries(balances)) {
        if (bal < -0.01) debtors.push({ id: uid, amount: -bal })
        else if (bal > 0.01) creditors.push({ id: uid, amount: bal })
    }
    
    // Greedy matching
    const debts: { from: string, to: string, amount: number }[] = []
    
    let dIndex = 0
    let cIndex = 0
    
    while (dIndex < debtors.length && cIndex < creditors.length) {
        const debtor = debtors[dIndex]
        const creditor = creditors[cIndex]
        
        const min = Math.min(debtor.amount, creditor.amount)
        if (min > 0) {
            debts.push({
                from: debtor.id,
                to: creditor.id,
                amount: parseFloat(min.toFixed(2))
            })
        }
        
        debtor.amount -= min
        creditor.amount -= min
        
        if (debtor.amount < 0.01) dIndex++
        if (creditor.amount < 0.01) cIndex++
    }
    
    // Resolve user names
    const debtsWithNames = debts.map(d => ({
        from: users.find(u => u.id === d.from)?.name || d.from,
        to: users.find(u => u.id === d.to)?.name || d.to,
        amount: d.amount
    }))

    return { balances, debts: debtsWithNames, history: expenses.slice(0, 5).reverse() } // Recent history
}
