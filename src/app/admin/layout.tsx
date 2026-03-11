import { Navbar } from "@/components/Navbar"
import { AdminBreadcrumb } from "@/components/AdminBreadcrumb"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ backgroundColor: "#F4F7FB" }}>
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 pb-10">
        <AdminBreadcrumb />
        {children}
      </div>
    </div>
  )
}
