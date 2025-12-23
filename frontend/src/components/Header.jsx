import { NavLink } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Shield } from "lucide-react"

export default function Header() {
  return (
    <header className="border-b bg-card">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-semibold">
          <Shield className="h-5 w-5" />
          <span>Smart Water Pump System</span>
        </div>

        <nav className="flex gap-2">
          <NavLink to="/">
            {({ isActive }) => (
              <Button variant={isActive ? "default" : "ghost"}>
                Live Logs
              </Button>
            )}
          </NavLink>

          <NavLink to="/database">
            {({ isActive }) => (
              <Button variant={isActive ? "default" : "ghost"}>
                Database
              </Button>
            )}
          </NavLink>
        </nav>
      </div>
    </header>
  )
}
