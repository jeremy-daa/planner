'use client'

import { useQuery } from '@tanstack/react-query'
import { createExpense, getBalances } from '@/app/actions/finance'
import { getFinancialInsights } from '@/app/actions/insights'
import { User } from '@prisma/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useState } from 'react'
import { useCurrentUser } from '@/app/providers'
import { toast } from 'sonner'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, DollarSign, RefreshCw, Layers, PieChart as PieIcon } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getBudgets, getExpensesByCategory, getMonthlyTrend, getRecentTransactions } from '@/app/actions/budget'
import { Progress } from '@/components/ui/progress'
import { BudgetCharts } from './budget-charts'
import { FinancialSummaryCards } from './financial-summary-cards'

export function Finances({ users }: { users: User[] }) {
    const { user } = useCurrentUser()
    const { data: insights, isLoading, refetch } = useQuery({
        queryKey: ['financial-insights'],
        queryFn: async () => {
             // Parallel fetch of base data + insights
             const [bal, budgets, catExpenses, trend, transactions, insightData] = await Promise.all([
                 getBalances(),
                 getBudgets(),
                 getExpensesByCategory(new Date().getMonth(), new Date().getFullYear()),
                 getMonthlyTrend(),
                 getRecentTransactions(),
                 getFinancialInsights()
             ])
             return { ...bal, budgets, catExpenses, trend, transactions, insightData }
        },
        refetchInterval: 10000
    })

    const [isOpen, setIsOpen] = useState(false)
    const [desc, setDesc] = useState('')
    const [amount, setAmount] = useState('')
    const [category, setCategory] = useState('General')
    const [isRecurring, setIsRecurring] = useState(false)
    
    // For custom/selection
    const [selectedUsers, setSelectedUsers] = useState<string[]>(users.map(u => u.id))
    
    async function handleSubmit() {
        if (!user || !amount || !desc) return
        
        const val = parseFloat(amount)
        if (isNaN(val) || val <= 0) return

        const splits: any[] = []
        splits.push({ userId: user.id, amount: val })
        
        try {
            await createExpense(desc, val, user.id, splits, category)
            setIsOpen(false)
            setDesc('')
            setAmount('')
            setCategory('General')
            setIsRecurring(false)
            refetch()
            toast.success('Expense added')
        } catch (e) {
            toast.error('Failed to add expense')
        }
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-teal-300 to-blue-500">
                        Financial Overview
                    </h2>
                    <p className="text-gray-400 text-sm mt-1">Track your spending, manage budgets, and achieve goals.</p>
                </div>
                
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/40 transition-all active:scale-95">
                            <Plus size={18} className="mr-2" /> Log Expense
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-zinc-950/95 backdrop-blur-xl border-white/10 text-white sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Add New Expense</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-6 pt-4">
                            <div className="space-y-2">
                                <Label className="text-xs font-medium uppercase tracking-wider text-gray-400">Description</Label>
                                <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What was this for?" className="bg-white/5 border-white/10 focus:border-emerald-500/50 transition-colors h-11" />
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-gray-400">Amount (ETB)</Label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">ETB</span>
                                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="bg-white/5 border-white/10 focus:border-emerald-500/50 pl-10 h-11" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-xs font-medium uppercase tracking-wider text-gray-400">Category</Label>
                                    <Select value={category} onValueChange={setCategory}>
                                        <SelectTrigger className="bg-white/5 border-white/10 h-11">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-white shadow-xl">
                                            <SelectItem value="General">General</SelectItem>
                                            {insights?.budgets.map((b: any) => (
                                                <SelectItem key={b.id} value={b.category}>{b.category}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                 <Checkbox id="recurring" checked={isRecurring} onCheckedChange={(c) => setIsRecurring(!!c)} className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500" />
                                 <Label htmlFor="recurring" className="text-sm font-normal text-gray-300">This is a recurring subscription</Label>
                            </div>
                            
                            <Button onClick={handleSubmit} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-900/20 h-12 text-base">
                                Save Expense
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
            
            {/* 1. Impact Cards */}
            {insights && <FinancialSummaryCards data={insights.insightData} />}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 2. Main Charts Area */}
                <div className="lg:col-span-2 space-y-8">
                    {insights && <BudgetCharts categoryData={insights.catExpenses} trendData={insights.trend} budgets={insights.budgets} />}
                </div>

                {/* 3. Detailed Lists Side Panel */}
                <div className="space-y-6">
                    {/* Category Breakdown List */}
                    <Card className="bg-white/5 backdrop-blur-md border-white/5 shadow-xl">
                         <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-gray-400">
                                 <Layers size={16} /> Budget Usage
                             </CardTitle>
                         </CardHeader>
                         <CardContent className="space-y-4">
                             {insights?.insightData.categoryInsights.map((cat: any) => (
                                 <div key={cat.category} className="space-y-1">
                                     <div className="flex justify-between text-sm">
                                         <span className="font-medium text-white">{cat.category}</span>
                                         <span className={`${cat.percent > 100 ? 'text-red-400' : 'text-gray-400'}`}>
                                             {cat.percent.toFixed(0)}%
                                         </span>
                                     </div>
                                     <Progress 
                                        value={Math.min(cat.percent, 100)} 
                                        className={`h-1.5 bg-white/5 ${cat.percent > 100 ? '[&>div]:bg-red-500' : (cat.percent > 85 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-blue-500')}`} 
                                     />
                                     <div className="text-xs text-right text-gray-500">
                                         ETB {cat.spent.toFixed(0)} / {cat.budget}
                                     </div>
                                 </div>
                             ))}
                             {insights?.insightData.categoryInsights.length === 0 && (
                                 <div className="text-center text-gray-500 text-sm py-4">No budgets set yet.</div>
                             )}
                         </CardContent>
                    </Card>

                    {/* Recent Transactions List */}
                    <Card className="bg-white/5 backdrop-blur-md border-white/5 shadow-xl hover:shadow-2xl transition-all duration-300">
                        <CardHeader className="pb-3 border-b border-white/5">
                            <CardTitle className="flex items-center justify-between text-gray-200">
                                <span className="flex items-center gap-2 text-base">
                                    <RefreshCw size={16} className="text-emerald-400 animate-in spin-in-3 duration-1000" /> Recent
                                </span>
                                <Button variant="ghost" size="sm" className="h-6 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">View All</Button>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                            <div className="divide-y divide-white/5">
                                 {insights?.transactions?.map((t: any) => (
                                     <div key={t.id} className="grid grid-cols-4 text-sm py-3 hover:bg-white/5 transition-colors px-2 -mx-2 first:mt-2 rounded group cursor-pointer">
                                         <div className="col-span-2">
                                             <p className="font-medium text-gray-300 group-hover:text-white transition-colors truncate pr-2">{t.description}</p>
                                             <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">{new Date(t.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                             </div>
                                         </div>
                                         <div className="flex items-center justify-center">
                                              <div className="w-2 h-2 rounded-full bg-emerald-500/50" title={t.category} />
                                         </div>
                                         <div className="text-right font-mono text-emerald-400 group-hover:text-emerald-300">
                                             {t.amount.toFixed(0)}
                                         </div>
                                     </div>
                                 ))}
                                 {insights?.transactions?.length === 0 && (
                                     <p className="text-center text-gray-500 py-6">No recent transactions</p>
                                 )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
