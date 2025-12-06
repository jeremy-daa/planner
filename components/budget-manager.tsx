'use client'

import { useState } from 'react'
import { setBudget, getBudgets, updateBudget } from '@/app/actions/budget'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ShoppingCart, Zap, Home, Film, Car, Heart, ShoppingBag, GraduationCap, Utensils, Smartphone, Wifi, Plane, Edit2 } from 'lucide-react'

const ICONS = [
    { name: 'Shopping', icon: ShoppingCart },
    { name: 'Utilities', icon: Zap },
    { name: 'Housing', icon: Home },
    { name: 'Entertainment', icon: Film },
    { name: 'Transport', icon: Car },
    { name: 'Health', icon: Heart },
    { name: 'Retail', icon: ShoppingBag },
    { name: 'Education', icon: GraduationCap },
    { name: 'Food', icon: Utensils },
    { name: 'Mobile', icon: Smartphone },
    { name: 'Internet', icon: Wifi },
    { name: 'Travel', icon: Plane }
]

const COLORS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#a855f7', // purple
    '#ec4899', // pink
]

export function BudgetManager() {
    const { data: budgets, refetch } = useQuery({
        queryKey: ['budgets'],
        queryFn: () => getBudgets()
    })

    const [editingId, setEditingId] = useState<string | null>(null)
    const [category, setCategory] = useState('')
    const [amount, setAmount] = useState('')
    const [icon, setIcon] = useState('Shopping')
    const [color, setColor] = useState(COLORS[5])

    async function handleSave() {
        if (!category || !amount) return
        try {
            if (editingId) {
                await updateBudget(editingId, { category, amount: parseFloat(amount), icon, color })
                toast.success('Budget updated')
                setEditingId(null)
            } else {
                await setBudget(category, parseFloat(amount), icon, color)
                toast.success('Budget created')
            }
            setCategory('')
            setAmount('')
            refetch()
        } catch (e) {
            toast.error('Failed to save budget')
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleEdit(b: any) {
        setEditingId(b.id)
        setCategory(b.category)
        setAmount(b.amount.toString())
        setIcon(b.icon || 'Shopping')
        setColor(b.color || COLORS[5])
    }

    function cancelEdit() {
        setEditingId(null)
        setCategory('')
        setAmount('')
        setIcon('Shopping')
        setColor(COLORS[5])
    }

    return (
        <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{editingId ? 'Edit Budget' : 'Add New Budget'}</CardTitle>
                {editingId && (
                    <Button variant="ghost" size="sm" onClick={cancelEdit} className="text-gray-400 hover:text-white">
                        Cancel Edit
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-2">
                        <Label>Category Name</Label>
                        <Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Groceries" className="bg-white/5 border-white/20" />
                    </div>
                    <div className="space-y-2">
                        <Label>Monthly Limit (ETB)</Label>
                        <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="500" className="bg-white/5 border-white/20" />
                    </div>
                    
                    <div className="space-y-2">
                         <Label>Icon</Label>
                         <Select value={icon} onValueChange={setIcon}>
                             <SelectTrigger className="bg-white/5 border-white/20">
                                 <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                 {ICONS.map(i => (
                                     <SelectItem key={i.name} value={i.name}>
                                         <div className="flex items-center gap-2">
                                             <i.icon size={14} /> {i.name}
                                         </div>
                                     </SelectItem>
                                 ))}
                             </SelectContent>
                         </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Color Tag</Label>
                        <div className="flex gap-2">
                            {COLORS.slice(0, 5).map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={`w-8 h-8 rounded-full border-2 ${color === c ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'} transition-all`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    <Button onClick={handleSave} className={`${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-emerald-600 hover:bg-emerald-700'} md:col-span-2 lg:col-span-4 mt-4 transition-colors`}>
                        {editingId ? 'Update Budget' : 'Save Budget Category'}
                    </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {budgets?.map((b: any) => {
                        const IconComponent = ICONS.find(i => i.name === b.icon)?.icon || ShoppingCart
                        return (
                            <div key={b.id} onClick={() => handleEdit(b)} className={`relative group overflow-hidden p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-white/10 cursor-pointer ${editingId === b.id ? 'ring-2 ring-yellow-500/50' : ''}`}>
                                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: b.color || '#3b82f6' }} />
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-black/20 text-gray-300">
                                            <IconComponent size={18} style={{ color: b.color || '#3b82f6' }} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-white">{b.category}</p>
                                            <p className="text-xs text-gray-400">Limit: ETB {b.amount.toFixed(0)}</p>
                                        </div>
                                    </div>
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 size={14} className="text-gray-400" />
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
