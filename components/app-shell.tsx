'use client'

import { motion, AnimatePresence } from 'framer-motion'

import { useState } from 'react'
import { Dashboard } from '@/components/dashboard'
import { Finances } from '@/components/finances'
import { User } from '@prisma/client'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { UserSwitcher } from '@/components/user-switcher'
import { useCurrentUser } from '@/app/providers'
import { CalendarView } from '@/components/calendar-view'
import { SettingsDashboard } from '@/components/settings-dashboard'
import { Home, Calendar as CalendarIcon, DollarSign, Settings } from 'lucide-react'


export function AppShell({ initialUsers }: { initialUsers: User[] }) {
    const { user, setUser, isLoaded } = useCurrentUser()
    
    // Prevent flash of content
    if (!isLoaded) {
        return <div className="min-h-screen bg-black" />
    }

    if (!user) {
         return (
             <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-white p-4 space-y-12">
                <div className="text-center space-y-4">
                    <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-emerald-400 animate-in fade-in zoom-in duration-1000">
                        Welcome Home
                    </h1>
                    <p className="text-gray-400 text-lg">Select your profile to begin</p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {initialUsers.map((u, i) => (
                        <div key={u.id}>
                             <motion.button
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                onClick={() => setUser(u)}
                                className="relative flex flex-col items-center gap-6 p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-blue-500/50 hover:scale-105 transition-all w-56 group backdrop-blur-sm"
                             >
                                <div className="relative">
                                    <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl group-hover:bg-blue-500/40 transition-all" />
                                    <div className="relative p-1 rounded-full bg-gradient-to-br from-white/10 to-white/5 border border-white/10">
                                         {u.avatar ? (
                                            <div className="h-20 w-20 rounded-full bg-black overflow-hidden relative">
                                                <img src={u.avatar} alt={u.name} className="object-cover w-full h-full" />
                                            </div>
                                         ) : (
                                            <div className="h-20 w-20 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold" style={{ color: u.color || 'white' }}>
                                                {u.name[0]}
                                            </div>
                                         )}
                                    </div>
                                </div>
                                <span className="font-medium text-xl text-gray-200 group-hover:text-white transition-colors">{u.name}</span>
                             </motion.button>
                        </div>
                    ))}
                </div>
             </div>
         )
    }

    // Apply user's preferred color theme to global CSS variables or just use inline styles for accents
    // We can use a context provider or just applying a class if we had them. 
    // For now, we stick to the premium dark theme.

    return (
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black text-white font-sans pb-32">
            <header className="sticky top-0 z-50 px-6 py-4 bg-black/20 backdrop-blur-xl border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
                        <Home size={16} className="text-white" />
                    </div>
                     <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                        Household
                    </span>
                </div>
                <UserSwitcher users={initialUsers} />
            </header>

            <main className="p-4 md:p-8 max-w-7xl mx-auto">
                <Tabs defaultValue="tasks" className="w-full">
                     <TabsContent value="tasks" className="mt-0 focus-visible:ring-0">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <Dashboard initialUsers={initialUsers} />
                        </motion.div>
                     </TabsContent>
                     <TabsContent value="calendar" className="mt-0 focus-visible:ring-0">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <CalendarView />
                        </motion.div>
                     </TabsContent>
                     <TabsContent value="finance" className="mt-0 focus-visible:ring-0">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <Finances users={initialUsers} />
                        </motion.div>
                     </TabsContent>
                     <TabsContent value="settings" className="mt-0 focus-visible:ring-0">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <SettingsDashboard />
                        </motion.div>
                     </TabsContent>
                     
                     {/* Floating Dock Navigation */}
                     <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
                        <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex items-center gap-2 shadow-2xl shadow-black/50 ring-1 ring-white/5">
                            <TabsList className="bg-transparent border-0 p-0 h-auto gap-2">
                                 {['tasks', 'calendar', 'finance', 'settings'].map((tab) => {
                                     const iconMap: any = { tasks: Home, calendar: CalendarIcon, finance: DollarSign, settings: Settings }
                                     const Icon = iconMap[tab]
                                     const colorMap: any = { 
                                         tasks: 'data-[state=active]:bg-blue-600', 
                                         calendar: 'data-[state=active]:bg-purple-600', 
                                         finance: 'data-[state=active]:bg-emerald-600', 
                                         settings: 'data-[state=active]:bg-zinc-700' 
                                     }
                                     return (
                                         <TabsTrigger 
                                            key={tab}
                                            value={tab} 
                                            className={`rounded-xl ${colorMap[tab]} data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:scale-110 active:scale-95 transition-all duration-300 w-12 h-12 p-0 flex items-center justify-center hover:bg-white/5`}
                                         >
                                            <Icon size={20} />
                                         </TabsTrigger>
                                     )
                                 })}
                            </TabsList>
                        </div>
                     </div>
                </Tabs>
            </main>
        </div>
    )
}
