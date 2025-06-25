import ClientTable from "@/components/ClientTable"
import ClientForm from "@/components/forms/ClientForm"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { getAllClients } from "@/lib/actions/client.actions"
import { getAllUsers } from "@/lib/actions/user.actions"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

const ClientPage = async () => {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const [clients, users] = await Promise.all([getAllClients(), getAllUsers()])

  return (
    <section className="w-full">
      <div className="mb-8 flex justify-between">
        <h1 className="h1-bold text-heading3 dark:text-white">Clients</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Client</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Client</DialogTitle>
              <DialogDescription>Create a new client to the database.</DialogDescription>
            </DialogHeader>
            <ClientForm users={users} />
          </DialogContent>
        </Dialog>
      </div>

      <Separator />

      <ClientTable clients={clients} />
    </section>
  )
}

export default ClientPage
