import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wrench, ClipboardList, Users, Banknote, LogOut, Settings, Bell, Search, Forklift, HardHat, RefreshCw, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

export function Layout() {
  const { profile, signOut, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isAdmin = profile?.role?.toString().toLowerCase().trim() === 'admin';

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const handleRefresh = async () => {
    await refreshProfile();
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'DASHBOARD' },
    { to: '/os', icon: ClipboardList, label: 'ORDENS DE SERVIÇO' },
    { to: '/customers', icon: Users, label: 'CLIENTES' },
    { to: '/machines', icon: Forklift, label: 'FROTA' },
    ...(isAdmin ? [
      { to: '/finance', icon: Banknote, label: 'PAINEL FINANCEIRO' },
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-[#121414] text-[#e2e2e2] font-['IBM_Plex_Sans'] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#444932] bg-[#1e2020] m-4 mr-0 rounded-2xl overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(202,243,0,0.4)]" />
            <div>
              <h1 className="text-xl font-bold text-[#caf300] tracking-tighter leading-tight">PD EMPILHADEIRAS</h1>
              <p className="text-[9px] font-bold text-[#c5c9ac] tracking-[0.1em]">Locação e Manutenção</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 px-4 py-3 text-xs font-bold font-['JetBrains_Mono'] tracking-widest transition-all",
                  isActive
                    ? "text-[#121414] bg-[#caf300] border-l-4 border-white"
                    : "text-[#c5c9ac] hover:bg-[#333535] hover:text-[#caf300]"
                )
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-6 border-t border-[#444932] flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-[#caf300] flex items-center justify-center text-[#121414] font-bold">
            {profile?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold font-['JetBrains_Mono'] truncate uppercase">{profile?.full_name}</p>
            <p className="text-[10px] text-[#c5c9ac] uppercase flex items-center gap-2">
              {profile?.role}
              <button 
                onClick={handleRefresh}
                className="hover:text-[#caf300] transition-colors p-1"
                title="Sincronizar Perfil"
              >
                <RefreshCw size={10} className={clsx(loading ? "animate-spin" : "")} />
              </button>
            </p>
          </div>
          <button onClick={handleSignOut} className="text-[#c5c9ac] hover:text-[#ffb4ab]">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* TopBar */}
        <header className="h-16 bg-[#121414] border-b-2 border-[#444932] flex items-center justify-between px-4 md:px-6 sticky top-0 z-50">
          <div className="md:hidden flex items-center gap-2">
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-[#caf300] p-1">
               {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
             </button>
             <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
             <h1 className="text-lg font-bold text-[#caf300] tracking-tighter truncate max-w-[150px]">PD EMPILHADEIRAS</h1>
          </div>
          
          <div className="hidden md:flex items-center bg-[#0c0f0f] border border-[#444932] rounded-xl px-4 py-1.5 w-64">
            <Search size={14} className="text-[#c5c9ac] mr-2" />
            <input
              type="text"
              placeholder="BUSCAR REGISTRO..."
              className="bg-transparent border-none focus:ring-0 text-[10px] font-bold font-['JetBrains_Mono'] text-[#e2e2e2] w-full"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="text-[#c5c9ac] hover:text-[#caf300]">
              <Bell size={20} />
            </button>
            {isAdmin && (
              <button 
                onClick={() => navigate('/admin')}
                className="text-[#c5c9ac] hover:text-[#caf300] transition-colors"
                title="Painel Administrativo"
              >
                <Settings size={20} />
              </button>
            )}
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 inset-x-0 bottom-0 bg-[#121414] z-40 overflow-y-auto">
            <nav className="flex flex-col p-4 space-y-2">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      "flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold font-['JetBrains_Mono'] tracking-widest transition-all",
                      isActive
                        ? "text-[#121414] bg-[#caf300]"
                        : "text-[#c5c9ac] hover:bg-[#333535] hover:text-[#caf300]"
                    )
                  }
                >
                  <item.icon size={24} />
                  {item.label}
                </NavLink>
              ))}
              {isAdmin && (
                <button 
                  onClick={() => { navigate('/admin'); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold font-['JetBrains_Mono'] tracking-widest text-[#c5c9ac] hover:bg-[#333535] hover:text-[#caf300] transition-all w-full text-left"
                >
                  <Settings size={24} />
                  ADMINISTRAÇÃO
                </button>
              )}
              <button 
                onClick={handleSignOut} 
                className="flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-bold font-['JetBrains_Mono'] tracking-widest text-[#ffb4ab] hover:bg-[#333535] transition-all w-full text-left"
              >
                <LogOut size={24} />
                SAIR
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-4 md:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
