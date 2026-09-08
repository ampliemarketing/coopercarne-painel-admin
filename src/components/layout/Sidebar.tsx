import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useAuth } from '../../store/AuthContext';
import { SIDEBAR_ITEMS } from '../../constants';

const COLLAPSE_STORAGE_KEY = 'coopercarne-sidebar-collapsed';

export function Sidebar() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
      } catch {
        // ignora falha de storage (modo privado, etc.)
      }
      return next;
    });
  };

  const currentPath = location.pathname;

  return (
    <aside
      className={`flex-shrink-0 bg-white border-r border-slate-200 overflow-y-auto transition-all duration-200 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      <nav className="py-5 px-3 space-y-2.5">
        {SIDEBAR_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;
          const hasPermission = item.roles.includes(role);
          if (!hasPermission) return null;

          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-lg text-sm font-semibold transition-colors ${
                collapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-3'
              } ${
                isActive
                  ? 'bg-[#c51d1f] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-[18px] h-[18px] flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}

        {/* Reduzir/Expandir menu — logo abaixo do último item (Auditoria) */}
        <button
          onClick={toggleCollapsed}
          title={collapsed ? 'Expandir' : 'Reduzir'}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-bold border-2 border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:border-slate-400 transition-colors ${
            collapsed ? 'justify-center px-2 py-3' : 'px-3.5 py-3'
          }`}
        >
          {collapsed ? <ChevronsRight className="w-[18px] h-[18px]" /> : <ChevronsLeft className="w-[18px] h-[18px]" />}
          {!collapsed && <span>Reduzir</span>}
        </button>
      </nav>
    </aside>
  );
}
