import { Link, useLocation } from 'react-router-dom'
import { Home, Search, Bell, Bookmark, Settings } from 'lucide-react'

const NAV = [
  { path: '/dashboard', label: 'Dashboard', icon: Home },
  { path: '/buscar', label: 'Buscador', icon: Search },
  { path: '/alertas', label: 'Alertas', icon: Bell },
  { path: '/guardadas', label: 'Guardadas', icon: Bookmark },
  { path: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const { pathname } = useLocation()
  return (
    <aside className="w-64 h-screen bg-white border-r border-gray-200 p-4 flex flex-col">
      <div className="text-xl font-bold mb-8 px-2">📋 LicitaApp</div>
      <nav className="space-y-1">
        {NAV.map(item => (
          <Link key={item.path} to={item.path}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
              pathname === item.path
                ? 'bg-blue-50 text-blue-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}>
            <item.icon size={18} />
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}