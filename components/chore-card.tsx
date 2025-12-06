'use client'

import { Chore, ChoreInstance, User } from '@prisma/client'
import { Card, CardContent } from '@/components/ui/card'
import * as Icons from 'lucide-react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { useState } from 'react'
import { toggleTask, requestTransfer } from '@/app/actions/actions'
import confetti from 'canvas-confetti'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { LucideIcon } from 'lucide-react'

interface ChoreCardProps {
    instance: ChoreInstance & { chore: Chore }
    users: User[]
    currentUser: User
    isTransferable?: boolean
}

export function ChoreCard({ instance, users, currentUser, isTransferable = true }: ChoreCardProps) {
    // Correctly accessing the icon from the library
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Icon = (Icons as any)[instance.chore.icon] as LucideIcon || Icons.HelpCircle
    
    const [isCompleted, setIsCompleted] = useState(instance.status === 'COMPLETED')
    const [isDragging, setIsDragging] = useState(false)
    
    // Swipe logic
    const x = useMotionValue(0)
    const opacity = useTransform(x, [0, 100], [1, 0])
    const bg = useTransform(x, [0, 100], ["rgba(255,255,255,0.05)", "rgba(16, 185, 129, 0.2)"])
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function handleDragEnd(event: any, info: PanInfo) {
        setIsDragging(false)
        if (info.offset.x > 80) { // Threshold
            handleComplete()
        }
    }

    async function handleComplete() {
         setIsCompleted(true)
         confetti({
             particleCount: 100,
             spread: 70,
             origin: { y: 0.6 }
         })
         try {
             await toggleTask(instance.id, true)
             toast.success('Task completed!')
         } catch (e) {
             setIsCompleted(false)
             toast.error('Failed to complete task')
         }
    }

    // Transfer logic
    const [transferTo, setTransferTo] = useState<string>('')
    const [isTransferOpen, setIsTransferOpen] = useState(false)

    async function handleTransfer() {
        if (!transferTo) return
        try {
            await requestTransfer(instance.id, transferTo, currentUser.id)
            setIsTransferOpen(false)
            toast.success('Transfer requested')
        } catch (e) {
            toast.error('Failed to request transfer')
        }
    }

    const isOverdue = new Date(instance.dueDate) < new Date(new Date().setHours(0,0,0,0)) && !isCompleted

    if (isCompleted) return null

    return (
        <motion.div 
            style={{ x, opacity, background: bg }}
            drag="x"
            dragConstraints={{ left: 0, right: 100 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className="relative rounded-xl cursor-grab active:cursor-grabbing touch-pan-y"
            whileTap={{ scale: 0.98 }}
        >
            <Card className={`bg-white/5 backdrop-blur-md overflow-hidden relative shadow-xl ring-1 ring-white/5 ${isOverdue ? 'border-red-500/50' : 'border-transparent'}`}>
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDragging ? 'bg-green-500' : (isOverdue ? 'bg-red-500' : 'bg-gradient-to-b from-blue-400 to-purple-500')} transition-colors`} />
                <CardContent className="p-4 md:p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full shrink-0 ${isOverdue ? 'bg-red-500/10' : 'bg-white/10'}`}>
                            <Icon size={24} className={isOverdue ? 'text-red-400' : 'text-white'} />
                        </div>
                        <div>
                            <h3 className={`font-bold text-lg leading-tight ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                                {instance.chore.title}
                                {isOverdue && <span className="ml-2 text-xs bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full">LATE</span>}
                            </h3>
                            <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider text-xs font-semibold">
                                {instance.chore.frequency} • <span className="text-purple-300">{instance.chore.difficulty} pts</span>
                            </p>
                        </div>
                    </div>
                    
                    {isTransferable && (
                        <Dialog open={isTransferOpen} onOpenChange={setIsTransferOpen}>
                            <DialogTrigger asChild>
                                {/* Prevent drag propagation on button */}
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="text-gray-400 hover:text-white hover:bg-white/10 z-10"
                                    onPointerDown={(e) => e.stopPropagation()}
                                >
                                    <Icons.ArrowRightLeft size={18} />
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-900 border-white/10 text-white">
                                <DialogHeader>
                                    <DialogTitle>Transfer Chore</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <Select onValueChange={setTransferTo}>
                                        <SelectTrigger className="bg-gray-800 border-white/20">
                                            <SelectValue placeholder="Select user" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-gray-800 border-white/20 text-white">
                                            {users.filter(u => u.id !== currentUser.id).map(u => (
                                                <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleTransfer} disabled={!transferTo} className="w-full bg-blue-600 hover:bg-blue-700">
                                        Send Request
                                    </Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </CardContent>
            </Card>
            
            {/* Swipe hint behind */}
            <div className="absolute inset-y-0 right-4 flex items-center justify-end pointer-events-none -z-10 text-green-500 font-bold opacity-0" style={{ opacity: isDragging ? 1 : 0 }}>
                COMPLETE
            </div>
        </motion.div>
    )
}
