'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChoreManager } from './chore-manager'
import { BudgetManager } from './budget-manager'
import { UserProfile } from './user-profile'

export function SettingsDashboard() {
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-200 to-gray-500">
                Customization & Settings
            </h2>
            
            <Tabs defaultValue="chores" className="w-full">
                <TabsList className="bg-white/5 border border-white/10 p-1">
                    <TabsTrigger value="chores" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Chores</TabsTrigger>
                    <TabsTrigger value="budget" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Budgets</TabsTrigger>
                    <TabsTrigger value="profile" className="data-[state=active]:bg-white/10 data-[state=active]:text-white">Profile</TabsTrigger>
                </TabsList>
                <TabsContent value="chores" className="pt-4">
                    <ChoreManager />
                </TabsContent>
                <TabsContent value="budget" className="pt-4">
                    <BudgetManager />
                </TabsContent>
                <TabsContent value="profile" className="pt-4">
                    <UserProfile />
                </TabsContent>
            </Tabs>
        </div>
    )
}
