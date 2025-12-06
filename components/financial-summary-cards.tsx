'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { ArrowUpRight, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function FinancialSummaryCards({ data }: { data: any }) {
    if (!data) return null;

    const { overview } = data;

    const statusColor = overview.status === 'good' ? 'text-emerald-400' 
        : overview.status === 'warning' ? 'text-yellow-400' 
        : 'text-red-400';

    const statusBg = overview.status === 'good' ? 'bg-emerald-500/10' 
        : overview.status === 'warning' ? 'bg-yellow-500/10' 
        : 'bg-red-500/10';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Monthly Overview */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10 relative overflow-hidden group">
                <div className={`absolute inset-0 bg-gradient-to-br ${overview.status === 'good' ? 'from-emerald-500/10' : 'from-red-500/10'} to-transparent opacity-50`} />
                <CardContent className="p-6 relative">
                    <p className="text-sm font-medium text-gray-400">Monthly Spend</p>
                    <div className="mt-2 flex items-baseline gap-2">
                         <span className="text-3xl font-bold text-white">ETB {overview.totalSpent.toFixed(0)}</span>
                         <span className="text-sm text-gray-400">/ {overview.totalBudget.toFixed(0)}</span>
                    </div>
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className={statusColor}>{overview.percentUsed.toFixed(0)}% Used</span>
                            <span className="text-gray-400">{overview.remaining > 0 ? `ETB ${overview.remaining.toFixed(0)} left` : 'Over budget'}</span>
                        </div>
                        <Progress value={Math.min(overview.percentUsed, 100)} className={`h-2 bg-white/10 ${overview.status === 'critical' ? '[&>div]:bg-red-500' : (overview.status === 'warning' ? '[&>div]:bg-yellow-500' : '[&>div]:bg-emerald-500')}`} />
                    </div>
                </CardContent>
            </Card>

            {/* 2. Pace / Projection */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                         <p className="text-sm font-medium text-gray-400">Projected End</p>
                        <ArrowUpRight size={16} className="text-blue-400" />
                    </div>
                    
                    <div className="mt-2">
                        <span className="text-2xl font-bold text-white">ETB {overview.projectedSpend.toFixed(0)}</span>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-400 flex items-center gap-2">
                         <span className="bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded">Avg {overview.dailyAverage.toFixed(0)} / day</span>
                         <span>based on current pace</span>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Budget Health Status */}
            <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                    <p className="text-sm font-medium text-gray-400">Budget Health</p>
                    <div className="mt-2 flex items-center gap-3">
                        <div className={`p-2 rounded-full ${statusBg}`}>
                            {overview.status === 'good' && <CheckCircle2 className="text-emerald-400" />}
                            {overview.status === 'warning' && <AlertTriangle className="text-yellow-400" />}
                            {overview.status === 'critical' && <TrendingUp className="text-red-400" />}
                        </div>
                        <div>
                             <p className="font-bold text-white capitalize">{overview.status}</p>
                             <p className="text-xs text-gray-500">
                                 {overview.status === 'good' ? 'You are on track' : (overview.status === 'warning' ? 'Slow down spending' : 'Exceeding limits')}
                             </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

             {/* 4. Top Category */}
             {/* This could be derived from insights but let's keep it simple or Placeholder */}
             <Card className="bg-white/5 backdrop-blur-md border-white/10">
                <CardContent className="p-6">
                    <p className="text-sm font-medium text-gray-400">Spending Velocity</p>
                    <div className="mt-2 text-2xl font-bold text-white">
                        {overview.percentUsed < 50 ? 'Low' : (overview.percentUsed < 80 ? 'Normal' : 'High')}
                    </div>
                     <p className="text-xs text-gray-500 mt-4">
                        Compared to typical month
                     </p>
                </CardContent>
            </Card>

        </div>
    )
}
