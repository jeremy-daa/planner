'use client'

import { useState } from 'react'
import { createChore, deleteChore, getChores, updateChore } from '@/app/actions/chores'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { getUsers } from '@/app/actions/actions'
import { Checkbox } from '@/components/ui/checkbox'
import { Reorder } from 'framer-motion'
import { Plus } from 'lucide-react'

const ICON_OPTIONS = [
    'Utensils', 'Home', 'Trash', 'ChefHat', 'Moon', 'Users', 'Droplet', 'GlassWater',
    'Tv', 'Wifi', 'Zap', 'ShoppingBag', 'Dog', 'Cat', 'Car', 'Bike', 'Shovel', 'Hammer',
    'Bed', 'Bath', 'Shirt', 'Armchair', 'Flower', 'Gamepad'
]

export function ChoreManager() {
    const { data: chores, refetch } = useQuery({
        queryKey: ['chores'],
        queryFn: () => getChores()
    })
    
    // Fetch users for rotation
    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => getUsers()
    })

    const [editingId, setEditingId] = useState<string | null>(null)
    const [title, setTitle] = useState('')
    const [desc, setDesc] = useState('')
    const [icon, setIcon] = useState('Home')
    const [freq, setFreq] = useState('WEEKLY')
    const [customInterval, setCustomInterval] = useState('1')
    const [diff, setDiff] = useState('10')
    const [assignees, setAssignees] = useState<string[]>([])
    const [nextDate, setNextDate] = useState('')

    async function handleSubmit() {
        if (!title) return
        try {
            const cint = freq === 'CUSTOM' ? parseInt(customInterval) : undefined
            
            if (editingId) {
                await updateChore(editingId, {
                    title,
                    description: desc,
                    icon,
                    frequency: freq as any,
                    customInterval: cint,
                    difficulty: parseInt(diff),
                    assigneeIds: assignees,
                    nextDueDate: nextDate ? new Date(nextDate) : undefined
                })
                toast.success('Chore updated')
                setEditingId(null)
            } else {
                await createChore({
                    title,
                    description: desc,
                    icon,
                    frequency: freq as any,
                    customInterval: cint,
                    difficulty: parseInt(diff),
                    assigneeIds: assignees,
                    nextDueDate: nextDate ? new Date(nextDate) : undefined
                })
                toast.success('Chore created')
            }
            setTitle('')
            setDesc('')
            setAssignees([])
            // Keep previous frequency settings as convenience? Or reset?
            // Reset for safety
            setFreq('WEEKLY')
            setCustomInterval('1')
            setNextDate('')
            
            refetch()
        } catch (e) {
            toast.error(editingId ? 'Failed to update chore' : 'Failed to create chore')
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleStartEdit(chore: any) {
        setEditingId(chore.id)
        setTitle(chore.title)
        setDesc(chore.description || '')
        setIcon(chore.icon)
        setFreq(chore.frequency)
        setDiff(chore.difficulty.toString())
        setAssignees(chore.assigneeIds || [])
        
        if (chore.instances && chore.instances.length > 0) {
            const d = new Date(chore.instances[0].dueDate)
            setNextDate(d.toISOString().split('T')[0])
        } else {
            setNextDate('')
        }
    }

    function handleCancelEdit() {
        setEditingId(null)
        setTitle('')
        setDesc('')
        setAssignees([])
        setNextDate('')
    }

    async function handleDelete(id: string) {
        try {
            await deleteChore(id)
            refetch()
            toast.success('Chore deleted')
        } catch (e) {
            toast.error('Failed to delete chore')
        }
    }

    return (
        <Card className="bg-white/5 border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{editingId ? 'Edit Chore' : 'Manage Chores'}</CardTitle>
                {editingId && <Button variant="ghost" onClick={handleCancelEdit} size="sm">Cancel Edit</Button>}
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                         <Label>Title</Label>
                         <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="New Chore" className="bg-white/5 border-white/20" />
                    </div>
                    <div className="space-y-2">
                         <Label>Description</Label>
                         <Input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Optional details..." className="bg-white/5 border-white/20" />
                    </div>
                </div>

                <div className="grid grid-cols-10 gap-2 items-end">
                    <div className="space-y-2 col-span-4">
                         <Label>Icon</Label>
                         <Select value={icon} onValueChange={setIcon}>
                             <SelectTrigger className="bg-white/5 border-white/20">
                                 <SelectValue />
                             </SelectTrigger>
                             <SelectContent className="h-60 bg-zinc-900 border-white/10 text-white">
                                 {ICON_OPTIONS.map(i => {
                                     // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                     const IconComp = (Icons as any)[i] || Icons.HelpCircle
                                     return (
                                        <SelectItem key={i} value={i}>
                                            <div className="flex items-center gap-2">
                                                <IconComp size={16} />
                                                <span>{i}</span>
                                            </div>
                                        </SelectItem>
                                     )
                                 })}
                             </SelectContent>
                         </Select>
                    </div>
                    <div className="space-y-2 col-span-4">
                        <Label>Frequency</Label>
                         <Select value={freq} onValueChange={setFreq}>
                            <SelectTrigger className="bg-white/5 border-white/20">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="DAILY">Daily</SelectItem>
                                <SelectItem value="WEEKLY">Weekly</SelectItem>
                                <SelectItem value="BIWEEKLY">Bi-Weekly</SelectItem>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                                <SelectItem value="YEARLY">Yearly</SelectItem>
                                <SelectItem value="CUSTOM">Custom</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {freq === 'CUSTOM' && (
                        <div className="space-y-2 col-span-4">
                             <Label>Every X Days</Label>
                             <Input 
                                type="number" 
                                value={customInterval} 
                                onChange={e => setCustomInterval(e.target.value)} 
                                className="bg-white/5 border-white/20"
                                placeholder="e.g. 3"
                            />
                        </div>
                    )}
                    <div className="space-y-2 col-span-2">
                        <Label>Pts</Label>
                        <Input type="number" value={diff} onChange={e => setDiff(e.target.value)} className="bg-white/5 border-white/20" />
                    </div>
                </div>

                <div className="space-y-4">
                    <Label>Assignee Rotation (Drag to reorder sequence)</Label>
                    
                    {/* Active Rotation List (Draggable) */}
                    <Reorder.Group axis="y" values={assignees} onReorder={setAssignees} className="space-y-2">
                        {assignees.map(userId => {
                            const u = users?.find(user => user.id === userId)
                            if (!u) return null
                            return (
                                <Reorder.Item key={u.id} value={u.id} className="cursor-grab active:cursor-grabbing">
                                    <div className={`flex items-center justify-between p-3 border rounded-lg bg-white/5 ${editingId ? 'border-yellow-500/30' : 'border-white/10'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="p-1 px-2 bg-white/10 rounded text-xs text-gray-400">
                                                ::
                                            </div>
                                            {u.avatar ? (
                                                <div className="w-6 h-6 rounded-full bg-cover" style={{ backgroundImage: `url(${u.avatar})` }} />
                                            ) : (
                                                <div className="w-6 h-6 rounded-full" style={{ backgroundColor: u.color || 'gray' }} />
                                            )}
                                            <span>{u.name}</span>
                                        </div>
                                        <Checkbox 
                                            checked={true}
                                            onCheckedChange={() => {
                                                setAssignees(assignees.filter(id => id !== u.id))
                                            }}
                                            className="border-white/50 data-[state=checked]:bg-blue-500"
                                        />
                                    </div>
                                </Reorder.Item>
                            )
                        })}
                    </Reorder.Group>

                    {/* Available Users (Click to add) */}
                    <div className="pt-2">
                         <Label className="text-xs text-gray-400 mb-2 block">Available Users (Click to add to rotation)</Label>
                         <div className="flex flex-wrap gap-2">
                             {users?.filter(u => !assignees.includes(u.id)).map(u => (
                                 <div key={u.id} 
                                      className="flex items-center gap-2 p-2 px-3 border border-white/10 rounded-full bg-white/5 hover:bg-white/10 cursor-pointer transition-colors"
                                      onClick={() => setAssignees([...assignees, u.id])}
                                 >
                                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: u.color || 'gray' }} />
                                      <span className="text-sm">{u.name}</span>
                                      <Plus size={14} className="text-gray-400" />
                                 </div>
                             ))}
                             {users?.filter(u => !assignees.includes(u.id)).length === 0 && (
                                 <span className="text-xs text-gray-500 italic">All users in rotation</span>
                             )}
                         </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>{editingId ? 'Update Current Next Due Date' : 'First Due Date'}</Label>
                    <Input 
                        type="date" 
                        value={nextDate} 
                        onChange={e => setNextDate(e.target.value)} 
                        className="bg-white/5 border-white/20" 
                    />
                </div>

                <Button onClick={handleSubmit} className={`w-full ${editingId ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
                    {editingId ? 'Update Chore' : 'Create Chore'}
                </Button>

                <div className="space-y-2 pt-4 border-t border-white/10">
                    <h3 className="font-semibold text-gray-400">Existing Chores</h3>
                    {chores?.map((chore: any) => {
                         // eslint-disable-next-line @typescript-eslint/no-explicit-any
                         const Icon = (Icons as any)[chore.icon] as LucideIcon || Icons.HelpCircle
                         return (
                             <div key={chore.id} className={`flex items-center justify-between p-3 bg-white/5 rounded-lg border ${editingId === chore.id ? 'border-yellow-500' : 'border-white/10'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-white/10 rounded">
                                        <Icon size={18} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">{chore.title}</p>
                                        <p className="text-xs text-gray-400">{chore.frequency} • {chore.difficulty}pts</p>
                                        {chore.assigneeIds && chore.assigneeIds.length > 0 && <p className="text-xs text-blue-400">Rotation: {chore.assigneeIds.length} users</p>}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="secondary" size="sm" onClick={() => handleStartEdit(chore)}>Edit</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDelete(chore.id)}>Delete</Button>
                                </div>
                             </div>
                         )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
