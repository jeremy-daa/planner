'use server'

import { prisma } from '@/app/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateUserProfile(id: string, data: {
    avatar?: string,
    color?: string
}) {
    await prisma.user.update({
        where: { id },
        data: {
            avatar: data.avatar,
            color: data.color
        }
    })
    revalidatePath('/')
}
