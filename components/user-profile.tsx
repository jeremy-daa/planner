'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCurrentUser } from '@/app/providers'
import { updateUserProfile } from '@/app/actions/user'
import { toast } from 'sonner'
import { Check } from 'lucide-react'

// Curated list of cool avatar URLs (using multiavatar api or DiceBear for deterministic but cool avatars)
// For "pre available", we can use static paths or a service. 
// Let's use DiceBear 'adventurer' style for "cool" looks.
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

export function UserProfile() {
    const { user, setUser } = useCurrentUser()
    const [selectedAvatar, setSelectedAvatar] = useState(user?.avatar || AVATAR_OPTIONS[0])
    const [selectedColor, setSelectedColor] = useState(user?.color || COLOR_OPTIONS[0])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [notifTime, setNotifTime] = useState((user as any)?.notifTime || '09:00')
    const [loading, setLoading] = useState(false)

    if (!user) return <div className="p-4 text-center text-gray-500">Please select a user first to edit profile.</div>

    async function handleSave() {
        setLoading(true)
        try {
            await updateUserProfile(user!.id, {
                avatar: selectedAvatar,
                color: selectedColor,
                notifTime
            })
            // Update local state
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setUser({ ...user!, avatar: selectedAvatar, color: selectedColor, notifTime } as any)
            toast.success('Profile updated!')
        } catch (e) {
            toast.error('Failed to update profile')
        } finally {
            setLoading(false)
        }
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
                         <span className="text-xs text-gray-500">We'll alert you about pending tasks at this time.</span>
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
