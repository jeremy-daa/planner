import { getUsers } from "./actions/actions"
import { AppShell } from "@/components/app-shell"

export const dynamic = 'force-dynamic'

export default async function Page() {
  const users = await getUsers()
  return <AppShell initialUsers={users} />
}
