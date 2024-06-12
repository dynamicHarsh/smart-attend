import { Separator } from "@/components/ui/separator"
import { AccountForm } from "@/components/admin_dashboard/account-form"
import SignUpForm from "@/components/SignUpForm/SignUp"

export default function SettingsAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Account</h3>
        <p className="text-sm text-muted-foreground">
         Fill the information of Student or Teacher to make a new account.
        </p>
      </div>
      <Separator />
      <SignUpForm/>
    </div>
  )
}