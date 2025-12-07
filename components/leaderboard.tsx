'use client'

import { useQuery } from '@tanstack/react-query'
import { getLeaderboard } from '@/app/actions/actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Flame, Medal, Star } from 'lucide-react'
import { motion } from 'framer-motion'

export function Leaderboard() {
    const { data: users } = useQuery({
        queryKey: ['leaderboard'],
        queryFn: () => getLeaderboard()
    })

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Top 3 Podium */}
                {users && users.length > 0 && (
                    <>
                        <PodiumCard user={users[1]} rank={2} color="text-gray-400" bgColor="bg-gray-500/10" border="border-gray-500/20" />
                        <PodiumCard user={users[0]} rank={1} color="text-yellow-400" bgColor="bg-yellow-500/10" border="border-yellow-500/20" scale={true} />
                        <PodiumCard user={users[2]} rank={3} color="text-amber-700" bgColor="bg-amber-700/10" border="border-amber-700/20" />
                    </>
                )}
            </div>

            <Card className="bg-white/5 border-white/10">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Trophy className="text-yellow-500" /> Leaderboard
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {users?.map((user, index) => (
                            <motion.div 
                                key={user.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`flex items-center justify-between p-3 rounded-xl border ${index < 3 ? 'bg-white/10 border-white/10' : 'bg-transparent border-transparent hover:bg-white/5'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <span className={`font-bold w-6 text-center ${index === 0 ? 'text-yellow-400 text-xl' : index === 1 ? 'text-gray-400 text-lg' : index === 2 ? 'text-amber-700 text-lg' : 'text-gray-500'}`}>
                                        {index + 1}
                                    </span>
                                    <div className="relative">
                                        {user.avatar ? (
                                            <div className="w-10 h-10 rounded-full bg-cover border-2 border-white/10" style={{ backgroundImage: `url(${user.avatar})` }} />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full border-2 border-white/10 flex items-center justify-center" style={{ backgroundColor: user.color || 'gray' }}>
                                                {user.name[0]}
                                            </div>
                                        )}
                                        <div className="absolute -bottom-1 -right-1 bg-black/80 text-xs px-1 rounded border border-white/20">
                                            Lvl {user.level}
                                        </div>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-white">{user.name}</p>
                                        <p className="text-xs text-gray-400">Rank {index + 1}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className="text-center">
                                        <div className="flex items-center gap-1 text-orange-500 font-bold">
                                            <Flame size={16} fill="currentColor" />
                                            {user.streak}
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase">Streak</p>
                                    </div>
                                    <div className="text-right min-w-[80px]">
                                        <div className="flex items-center justify-end gap-1 text-blue-400 font-bold">
                                            <Star size={16} fill="currentColor" />
                                            {user.points.toLocaleString()}
                                        </div>
                                        <p className="text-[10px] text-gray-500 uppercase">Points</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PodiumCard({ user, rank, color, bgColor, border, scale }: { user: any, rank: number, color: string, bgColor: string, border: string, scale?: boolean }) {
    if (!user) return <div className={`h-full opacity-0`}></div>
    
    return (
        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`relative flex flex-col items-center p-6 rounded-2xl border ${bgColor} ${border} ${scale ? 'transform -translate-y-4 z-10 shadow-2xl shadow-yellow-500/10' : ''}`}
        >
            <div className={`absolute -top-3 ${scale ? 'w-10 h-10 text-xl' : 'w-8 h-8 text-lg'} ${bgColor} border ${border} rounded-full flex items-center justify-center font-bold text-white shadow-lg`}>
                {rank}
            </div>
            
            <div className={`relative mb-3 ${scale ? 'w-24 h-24' : 'w-20 h-20'} rounded-full p-1 border-4 ${color.replace('text-', 'border-')}`}>
                {user.avatar ? (
                    <div className="w-full h-full rounded-full bg-cover" style={{ backgroundImage: `url(${user.avatar})` }} />
                ) : (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-2xl font-bold" style={{ backgroundColor: user.color || 'gray' }}>
                        {user.name[0]}
                    </div>
                )}
                {scale && <Medal className="absolute -bottom-2 -right-2 text-yellow-500 drop-shadow-lg" size={32} fill="currentColor" />}
            </div>

            <h3 className={`font-bold ${scale ? 'text-xl' : 'text-lg'} text-white`}>{user.name}</h3>
            <p className={`${color} font-bold mt-1 text-sm`}>{user.points} PTS</p>
            
            <div className="flex items-center gap-1 mt-2 px-2 py-1 bg-black/30 rounded text-xs text-gray-300">
                Lvl {user.level} • {user.streak} Day Streak
            </div>
        </motion.div>
    )
}
