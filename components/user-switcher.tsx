'use client'

import { useCurrentUser } from "@/app/providers"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { User } from "@prisma/client"
import { useEffect, useState } from "react"

export function UserSwitcher({ users }: { users: User[] }) {
    const { user, setUser } = useCurrentUser()

    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!user && mounted) {
        // Force selection if not authenticated
        // This logic is mostly handled in AppShell, but we can ensure here we don't auto-set to first one unless explicit.
    }

    if (!user) return null

    return (
        <div className="flex items-center gap-2">
            <Select value={user.id} onValueChange={(val) => {
                const u = users.find(x => x.id === val)
                if (u) setUser(u)
            }}>
                <SelectTrigger className="w-[180px]">
                    <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                            <AvatarImage src={user.avatar || ''} />
                            <AvatarFallback>{user.name[0]}</AvatarFallback>
                        </Avatar>
                        <span>{user.name}</span>
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {users.map(u => (
                        <SelectItem key={u.id} value={u.id}>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={u.avatar || ''} />
                                    <AvatarFallback>{u.name[0]}</AvatarFallback>
                                </Avatar>
                                <span>{u.name}</span>
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
