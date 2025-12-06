import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getCalendarEvents } from '@/app/actions/calendar'
import { useCurrentUser } from '@/app/providers'
import { Badge } from '@/components/ui/badge'
import { getUsers } from '@/app/actions/actions'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import * as Icons from 'lucide-react'
import { LucideIcon } from 'lucide-react'
import { format, isSameDay } from 'date-fns'

export function CalendarView() {
    const { user: currentUser } = useCurrentUser()
    const [date, setDate] = useState<Date | undefined>(new Date())
    const [month, setMonth] = useState<Date>(new Date())
    const [filterUser, setFilterUser] = useState<string>('all')

    const { data: events } = useQuery({
        queryKey: ['calendar', month],
        queryFn: () => getCalendarEvents(month)
    })

    const { data: users } = useQuery({
        queryKey: ['users'],
        queryFn: () => getUsers()
    })

    const dailyEvents = useMemo(() => {
        if (!events || !date) return []
        return events.filter(e => isSameDay(new Date(e.dueDate), date))
                     .filter(e => filterUser === 'all' || e.assignedUserId === filterUser)
    }, [events, date, filterUser])

    const dayHasEvents = (day: Date) => {
        if (!events) return false
        return events.some(e => isSameDay(new Date(e.dueDate), day) && (filterUser === 'all' || e.assignedUserId === filterUser))
    }

    const CustomDayContent = (props: any) => {
        const { date: dayDate } = props
        const hasEvents = dayHasEvents(dayDate)
        
        // Find top 3 user colors for dots
        const dayEvents = events?.filter(e => isSameDay(new Date(e.dueDate), dayDate)) || []
        const filteredDayEvents = dayEvents.filter(e => filterUser === 'all' || e.assignedUserId === filterUser)

        return (
            <div className="flex flex-col items-center justify-center relative w-full h-full">
                <span>{dayDate.getDate()}</span>
                {filteredDayEvents.length > 0 && (
                    <div className="flex gap-0.5 absolute bottom-1">
                        {filteredDayEvents.slice(0, 3).map((e, i) => (
                            <div 
                                key={i} 
                                className="w-1 h-1 rounded-full" 
                                style={{ backgroundColor: e.assignedUser?.color || 'white' }} 
                            />
                        ))}
                        {filteredDayEvents.length > 3 && <div className="w-1 h-1 rounded-full bg-gray-400" />}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="flex flex-col md:flex-row gap-8">
            <div className="space-y-4">
                <Card className="bg-white/5 border-white/10 w-fit h-fit">
                    <CardContent className="p-4">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            onMonthChange={setMonth}
                            className="rounded-md border border-white/10 text-white"
                            components={{
                                // @ts-ignore
                                DayContent: CustomDayContent
                            }}
                        />
                    </CardContent>
                </Card>
                
                <Card className="bg-white/5 border-white/10 w-full max-w-[300px]">
                    <CardContent className="p-4 space-y-2">
                        <label className="text-sm font-medium text-gray-400">Filter by Assignee</label>
                        <Select value={filterUser} onValueChange={setFilterUser}>
                            <SelectTrigger className="bg-white/5 border-white/20">
                                <SelectValue placeholder="All Users" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                {users?.map(u => (
                                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            </div>

            <div className="flex-1 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white">
                            {date ? format(date, 'EEEE, MMMM do') : 'Select a date'}
                        </h2>
                        <p className="text-gray-400">
                            {dailyEvents.length} tasks scheduled
                        </p>
                    </div>
                    {/* Add Agenda/Calendar view toggle if needed */}
                </div>

                <div className="space-y-3">
                    {dailyEvents.length === 0 ? (
                        <div className="p-8 flex flex-col items-center justify-center text-gray-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                            <Icons.CalendarX className="mb-2 opacity-50" size={32} />
                            <p>No tasks for this day</p>
                        </div>
                    ) : (
                        dailyEvents.map((instance: any) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const Icon = (Icons as any)[instance.chore.icon] as LucideIcon || Icons.HelpCircle
                            const isMyTask = currentUser?.id === instance.assignedUserId
                            
                            return (
                                <div key={instance.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isMyTask ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
                                    <div className={`p-3 rounded-full ${isMyTask ? 'bg-blue-500/20 text-blue-300' : 'bg-white/10 text-gray-300'}`}>
                                        <Icon size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg">{instance.chore.title}</h3>
                                        <div className="flex items-center gap-2 text-sm text-gray-400">
                                            <span>{instance.chore.difficulty} pts</span>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                {instance.assignedUser?.avatar ? (
                                                    <div className="w-4 h-4 rounded-full bg-cover" style={{ backgroundImage: `url(${instance.assignedUser.avatar})` }} />
                                                ) : (
                                                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: instance.assignedUser?.color || 'gray' }} />
                                                )}
                                                <span style={{ color: instance.assignedUser?.color || 'gray' }}>{instance.assignedUser?.name || 'Unassigned'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        {instance.status === 'COMPLETED' ? (
                                            <Badge className="bg-green-500/20 text-green-300 hover:bg-green-500/30">Done</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-gray-400">Pending</Badge>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
