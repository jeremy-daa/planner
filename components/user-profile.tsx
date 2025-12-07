'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/app/providers'
import { updateUserProfile } from '@/app/actions/user'
import { subscribeUser, sendTestNotification, unsubscribeUser } from '@/app/actions/notifications'
import { toast } from 'sonner'
import { Check, Bell, BellOff } from 'lucide-react'

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
if (typeof window !== 'undefined') console.log('Client VAPID Public Key starts with:', VAPID_PUBLIC_KEY?.substring(0, 5))

// Curated list of cool avatar URLs 
const AVATAR_OPTIONS = [
    // Local Avatars
    '/avatars/andy-warhol.svg',
    '/avatars/barack-obama.svg',
    '/avatars/batman.svg',
    '/avatars/charlie-chaplin.svg',
    '/avatars/cristiano-ronaldo.svg',
    '/avatars/dalai-lama.svg',
    '/avatars/dave-grohl.svg',
    '/avatars/donald-trump.svg',
    '/avatars/girl-in-ballcap.svg',
    '/avatars/indian-woman.svg',
    '/avatars/joseph-stalin.svg',
    '/avatars/luis-suarez.svg',
    '/avatars/mahatma-gandhi.svg',
    '/avatars/malcolm-x.svg',
    '/avatars/mick-jagger.svg',
    '/avatars/muslim-man.svg',
    '/avatars/muslim-woman.svg',
    '/avatars/native-man.svg',
    '/avatars/nikola-tesla.svg',
    '/avatars/robot-01.svg',
    '/avatars/robot-02.svg',
    '/avatars/robot-03.svg',
    '/avatars/traditiona-japanese-man.svg',
    '/avatars/traditional-african-man.svg',
    '/avatars/traditional-african-woman.svg',
    '/avatars/traditional-japanese-woman.svg',
    '/avatars/trinity.svg',
    '/avatars/vladimir-lenin.svg',

    // API Fallbacks
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Felix',
    'https://api.dicebear.com/9.x/adventurer/svg?seed=Aneka',
]

const COLOR_OPTIONS = [
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#22c55e', // green
    '#06b6d4', // cyan
    '#3b82f6', // blue
    '#a855f7', // purple
    '#ec4899', // pink
]

// Helper to Convert UTC "HH:MM" to Local "HH:MM"
function utcToLocal(utcTime: string) {
    if (!utcTime) return '09:00'
    const [h, m] = utcTime.split(':').map(Number)
    const date = new Date()
    date.setUTCHours(h, m, 0, 0)
    const localH = date.getHours().toString().padStart(2, '0')
    const localM = date.getMinutes().toString().padStart(2, '0')
    return `${localH}:${localM}`
}

// Helper to Convert Local "HH:MM" to UTC "HH:MM"
function localToUtc(localTime: string) {
    if (!localTime) return '09:00'
    const [h, m] = localTime.split(':').map(Number)
    const date = new Date()
    date.setHours(h, m, 0, 0)
    const utcH = date.getUTCHours().toString().padStart(2, '0')
    const utcM = date.getUTCMinutes().toString().padStart(2, '0')
    return `${utcH}:${utcM}`
}

export function UserProfile() {
    const { user, setUser } = useCurrentUser()
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || AVATAR_OPTIONS[0])
    const [selectedColor, setSelectedColor] = useState(user?.color || COLOR_OPTIONS[0])
    // Initialize with Local Time derived from Stored UTC Time
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifTime, setNotifTime] = useState(utcToLocal((user as any)?.notifTime || '09:00'))
    const [loading, setLoading] = useState(false)
    const [isSubscribed, setIsSubscribed] = useState(false)

    useEffect(() => {
        if ('serviceWorker' in navigator && user) {
            navigator.serviceWorker.ready.then(reg => {
                reg.pushManager.getSubscription().then(sub => {
                    if (sub) setIsSubscribed(true)
                })
            })
        }
    }, [user])

    if (!user) return <div className="p-4 text-center text-gray-500">Please select a user first to edit profile.</div>

    async function handleSave() {
        setLoading(true)
        try {
            // Convert to UTC before saving
            const utcTime = localToUtc(notifTime)
            
            await updateUserProfile(user!.id, {
                avatar: selectedAvatar,
                color: selectedColor,
                notifTime: utcTime
            })
            // Update local state - keep 'notifTime' as local in UI state
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setUser({ ...user!, avatar: selectedAvatar, color: selectedColor, notifTime: utcTime } as any)
            toast.success('Profile updated!')
        } catch (e) {
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
    }

    async function toggleNotifications() {
        if (!('serviceWorker' in navigator)) {
            toast.error('Service Workers not supported')
            return
        }

        if (isSubscribed) {
            // Unsubscribe
            setLoading(true)
            try {
                const reg = await navigator.serviceWorker.ready
                const sub = await reg.pushManager.getSubscription()
                if (sub) {
                    await sub.unsubscribe()
                    await unsubscribeUser(user!.id)
                    setIsSubscribed(false)
                    toast.success('Notifications Disabled')
                }
            } catch (e) {
                console.error(e)
                toast.error('Failed to disable notifications')
            } finally {
                setLoading(false)
            }
        } else {
            // Subscribe
            try {
                if (!VAPID_PUBLIC_KEY) {
                    toast.error('VAPID Public Key is missing. Check .env and restart server.')
                    return
                }

                const perm = await Notification.requestPermission()
                if (perm !== 'granted') {
                    toast.error('Notifications permission denied. Please enable in browser settings.')
                    return
                }

                setLoading(true)
                const register = await navigator.serviceWorker.register('/sw.js')
                const registration = await navigator.serviceWorker.ready
                
                const sub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                })

                const res = await subscribeUser(sub.toJSON(), user!.id)
                if (res.success) {
                    setIsSubscribed(true)
                    toast.success('Notifications Enabled!')
                    await sendTestNotification(user!.id)
                } else {
                    toast.error('Failed to save subscription')
                }
            } catch (e) {
                console.error(e)
                toast.error('Failed to subscribe to push notifications')
            } finally {
                setLoading(false)
            }
        }
    }

    function urlBase64ToUint8Array(base64String: string) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/')
        
        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)
        
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    return (
        <Card className="bg-white/5 border-white/10">
            <CardHeader>
                <CardTitle>Customize Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex flex-col items-center gap-4 mb-6">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-full border-4 shadow-xl overflow-hidden bg-black" style={{ borderColor: selectedColor }}>
                            <img src={selectedAvatar} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                    </div>
                    <p className="text-lg font-bold">{user.name}</p>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-400">Choose Avatar</label>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                        {AVATAR_OPTIONS.map((url, i) => (
                            <div 
                                key={i}
                                className={`cursor-pointer rounded-full p-1 border-2 transition-all hover:scale-105 ${selectedAvatar === url ? 'border-blue-500 bg-white/10' : 'border-transparent hover:bg-white/5'}`}
                                onClick={() => setSelectedAvatar(url)}
                            >
                                <img src={url} alt={`Option ${i}`} className="w-full h-full rounded-full" />
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-400">Theme Color</label>
                    <div className="flex flex-wrap gap-3">
                        {COLOR_OPTIONS.map(c => (
                            <div
                                key={c}
                                className="w-10 h-10 rounded-full cursor-pointer flex items-center justify-center transition-transform hover:scale-110"
                                style={{ backgroundColor: c }}
                                onClick={() => setSelectedColor(c)}
                            >
                                {selectedColor === c && <Check className="text-white drop-shadow-md" size={18} />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-400">Daily Reminder Time</label>
                    <div className="flex items-center gap-4">
                         <input 
                            type="time" 
                            className="bg-zinc-900 border border-white/10 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={notifTime}
                            onChange={(e) => setNotifTime(e.target.value)}
                         />
                         <span className="text-xs text-gray-500">We'll alert you about pending tasks at this Local Time.</span>
                    </div>

                    <div className="mt-2">
                         <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={toggleNotifications} 
                            className={`flex items-center gap-2 ${isSubscribed ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-blue-500/30 text-blue-400 hover:bg-blue-500/10'}`}
                        >
                            {isSubscribed ? <BellOff size={16}/> : <Bell size={16}/>}
                            {isSubscribed ? 'Disable Push Notifications' : 'Enable Push Notifications'}
                         </Button>
                    </div>
                </div>

                <div className="pt-4">
                    <Button onClick={handleSave} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
                        {loading ? 'Saving...' : 'Save & Apply'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
