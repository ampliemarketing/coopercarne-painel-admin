import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { SIDEBAR_ITEMS } from '../../constants';

export function BottomNav() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveKey = () => {
    const currentPath = location.pathname;
    const found = SIDEBAR_ITEMS.find(item => item.path === currentPath);
    return found?.key || 'dashboard';
  };

  const activeKey = getActiveKey();

  return (
    <nav className="fixed bottom-3 left-0 right-0 z-50 px-2 sm:px-4 pointer-events-none">
      <div className="max-w-6xl mx-auto relative pointer-events-auto">
        <div className="bg-[#c51d1f] text-white rounded-full shadow-2xl h-16 px-2 sm:px-4 flex items-center justify-between relative border border-red-800/40 backdrop-blur-md">
          {SIDEBAR_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            const hasPermission = item.roles.includes(role);

            if (!hasPermission) return null;

            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-200 px-0.5 ${
                  isActive ? "text-[#c51d1f]" : "text-white/70 hover:text-white"
                }`}
              >
                {/* Botão Circular Flutuante em Destaque no Item Ativo com Animação Fluida Mola */}
                {isActive && (
                  <motion.div
                    layoutId="adminActiveTabIndicator"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute -top-7 flex flex-col items-center pointer-events-none z-10"
                  >
                    <div className="w-13 h-13 rounded-full bg-[#c51d1f] p-1 shadow-2xl flex items-center justify-center">
                      <div className="w-full h-full rounded-full bg-white flex items-center justify-center shadow-md">
                        <Icon className="w-6 h-6 text-[#c51d1f]" />
                      </div>
                    </div>
                    <span className="text-[11px] font-[900] text-white tracking-wider uppercase mt-1 drop-shadow-sm whitespace-nowrap">
                      {item.shortLabel}
                    </span>
                  </motion.div>
                )}

                {/* Estado Inativo */}
                {!isActive && (
                  <div className="flex flex-col items-center py-1">
                    <Icon className="w-4 h-4 mb-0.5" />
                    <span className="text-[9px] font-medium tracking-tight text-white/80 whitespace-nowrap">
                      {item.shortLabel}
                    </span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
