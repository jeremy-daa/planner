'use client'

import { useCurrentUser } from "@/app/providers"
import { useQuery } from "@tanstack/react-query"
import { getDashboardData, respondToTransfer } from "@/app/actions/actions"
import { ChoreCard } from "./chore-card"
import { UserSwitcher } from "./user-switcher"
import { User } from "@prisma/client"
import { motion, AnimatePresence } from "framer-motion"
import { Check, X, Bell, Calendar as CalendarIcon } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Skeleton } from "@/components/ui/skeleton"

export function Dashboard({ initialUsers }: { initialUsers: User[] }) {
    const { user } = useCurrentUser()
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, isLoading, refetch } = useQuery({
        queryKey: ['dashboard', user?.id],
        queryFn: () => user ? getDashboardData(user.id) : null,
        enabled: !!user,
        refetchInterval: 5000 
    })

    async function handleTransferResponse(requestId: string, accept: boolean) {
        await respondToTransfer(requestId, accept)
        toast.info(accept ? 'Transfer accepted' : 'Transfer rejected')
        refetch()
    }

    if (!user) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
                <h1 className="text-4xl font-bold mb-8 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                    Welcome Home
                </h1>
                <p className="text-gray-400 mb-8">Please select your profile to continue</p>
                <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                   <UserSwitcher users={initialUsers} />
                </div>
            </div>
        )
    }

    return (
        <div className="font-sans">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 {/* Main Column */}
                 <div className="lg:col-span-2 space-y-8">
                    
                    {/* Notifications */}
                    <AnimatePresence>
                        {data?.incomingTransfers && data.incomingTransfers.length > 0 && (
                             <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-2"
                             >
                                <h2 className="text-sm font-bold uppercase tracking-wider text-blue-400 flex items-center gap-2">
                                    <Bell size={14} /> Requests
                                </h2>
                                {data.incomingTransfers.map((t: any) => (
                                    <motion.div key={t.id} layout>
                                        <Card className="bg-blue-500/10 border-blue-500/20">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-blue-500/20 rounded-full">
                                                        <Bell size={16} className="text-blue-400" />
                                                    </div>
                                                    <span className="text-sm">
                                                        <span className="font-bold text-white">{t.fromUser.name}</span> requested you take <span className="font-bold text-blue-300">{t.choreInstance.chore.title}</span>
                                                    </span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Button size="sm" variant="outline" className="h-8 text-green-400 border-green-500/30 hover:bg-green-500/10 hover:text-green-300 transition-colors" onClick={() => handleTransferResponse(t.id, true)}>
                                                        <Check size={14} className="mr-1" /> Accept
                                                    </Button>
                                                    <Button size="sm" variant="outline" className="h-8 text-red-400 border-red-500/30 hover:bg-red-500/10 hover:text-red-300 transition-colors" onClick={() => handleTransferResponse(t.id, false)}>
                                                        <X size={14} className="mr-1" /> Reject
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </motion.div>
                                ))}
                             </motion.div>
                        )}
                    </AnimatePresence>

                    {/* My Tasks */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-6 bg-purple-500 rounded-full"/>
                                Today's Tasks
                            </h2>
                            <span className="text-xs font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                                {new Date().toLocaleDateString()}
                            </span>
                        </div>

                        {isLoading ? (
                            <div className="space-y-3">
                                <Skeleton className="h-24 w-full bg-white/5 rounded-xl" />
                                <Skeleton className="h-24 w-full bg-white/5 rounded-xl" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {data?.myTasks.length === 0 && (
                                    <Card className="bg-white/5 border-dashed border-white/10 py-8">
                                        <div className="flex flex-col items-center justify-center text-center text-gray-500">
                                            <Check size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg font-medium">All caught up!</p>
                                            <p className="text-sm opacity-60">Enjoy your free time.</p>
                                        </div>
                                    </Card>
                                )}
                                <AnimatePresence>
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {data?.myTasks.map((task: any) => (
                                        <ChoreCard 
                                            key={task.id} 
                                            instance={task} 
                                            users={initialUsers} 
                                            currentUser={user} 
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                 </div>

                 {/* Side Column: Next Up */}
                 <div className="space-y-8">
                    <div>
                        <h2 className="text-lg font-bold text-gray-300 mb-4 flex items-center gap-2">
                             <CalendarIcon size={18} className="text-pink-400" /> Next Up
                        </h2>
                        <div className="space-y-3">
                            {isLoading ? <Skeleton className="h-16 w-full bg-white/5" /> : (
                                <>
                                    {data?.nextUp.length === 0 && <p className="text-sm text-gray-500">No upcoming tasks scheduled.</p>}
                                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                    {data?.nextUp.map((task: any) => (
                                         <Card key={task.id} className="bg-white/5 border-white/5 hover:bg-white/10 transition-colors group">
                                            <CardContent className="p-4 flex items-center justify-between">
                                                 <div>
                                                     <h4 className="font-bold text-gray-300 group-hover:text-white transition-colors">{task.chore.title}</h4>
                                                     <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-gray-600"/>
                                                        {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                                     </p>
                                                 </div>
                                                 <div className="text-xs font-mono text-gray-600 bg-black/20 px-2 py-1 rounded">
                                                    {task.chore.frequency.slice(0,3)}
                                                 </div>
                                            </CardContent>
                                         </Card>
                                    ))}
                                </>
                            )}
                        </div>
                    </div>

                    <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-white/10">
                        <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-white mb-2">Household Balance</h3>
                            <p className="text-sm text-gray-300 mb-4">You are all settled up!</p>
                            <Button variant="outline" className="w-full border-white/20 hover:bg-white/10 text-white">
                                View Finances
                            </Button>
                        </CardContent>
                    </Card>
                 </div>
            </div>
        </div>
    )
}
