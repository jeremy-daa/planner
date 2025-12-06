'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d']

interface Props {
    categoryData: Record<string, number>
    trendData: { name: string, total: number }[]
    budgets: { category: string, amount: number }[]
}

export function BudgetCharts({ categoryData, trendData, budgets }: Props) {
    
    const pieData = Object.entries(categoryData).map(([name, value]) => ({ name, value }))
    
    // Merge budget vs actual for Bar Chart
    const comparisonData = budgets.map(b => ({
        name: b.category,
        Budget: b.amount,
        Spent: categoryData[b.category] || 0
    }))

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle>Spending by Category</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend />
                        </PieChart>
                     </ResponsiveContainer>
                </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle>Monthly Trend</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={trendData}>
                            <XAxis dataKey="name" stroke="#888" />
                            <YAxis stroke="#888" />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                            />
                            <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
            
            <Card className="col-span-1 md:col-span-2 bg-white/5 border-white/10">
                 <CardHeader>
                    <CardTitle>Budget vs Actual</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonData} layout="vertical">
                            <XAxis type="number" stroke="#888" />
                            <YAxis dataKey="name" type="category" width={100} stroke="#888" />
                            <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.1)' }}
                                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                            />
                            <Legend />
                            <Bar dataKey="Budget" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="Spent" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

        </div>
    )
}
