import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Wrench, ClipboardList, Users, IndianRupee, LogOut, Settings, Bell, Search, Forklift, HardHat, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { clsx } from 'clsx';

export function Layout() {
  const { profile, signOut, refreshProfile, loading } = useAuth();
  const navigate = useNavigate();

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
    ...(profile?.role?.toString().toLowerCase().trim() === 'admin' ? [
      { to: '/users', icon: HardHat, label: 'GESTÃO USUÁRIOS' },
      { to: '/finance', icon: IndianRupee, label: 'PAINEL FINANCEIRO' },
    ] : []),
  ];

  return (
    <div className="flex h-screen bg-[#121414] text-[#e2e2e2] font-['IBM_Plex_Sans'] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[#444932] bg-[#1e2020] m-4 mr-0 rounded-2xl overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-[#caf300] tracking-tighter">FLEET CONTROL</h1>
          <p className="text-[10px] font-bold text-[#c5c9ac] tracking-[0.2em]">WAREHOUSE ALPHA</p>
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* TopBar */}
        <header className="h-16 bg-[#121414] border-b-2 border-[#444932] flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="md:hidden flex items-center">
             <h1 className="text-xl font-bold text-[#caf300]">TITAN FLEET</h1>
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
            <button className="text-[#c5c9ac] hover:text-[#caf300]">
              <Settings size={20} />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6 md:p-10">
          <Outlet />
        </main>
        
        {/* Mobile Nav */}
        <nav className="md:hidden h-16 bg-[#1e2020] border-t border-[#444932] flex justify-around items-center">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    "flex flex-col items-center gap-1 text-[8px] font-bold font-['JetBrains_Mono'] transition-all",
                    isActive ? "text-[#caf300]" : "text-[#c5c9ac]"
                  )
                }
              >
                <item.icon size={20} />
                {item.label.split(' ')[0]}
              </NavLink>
            ))}
            <button onClick={handleSignOut} className="flex flex-col items-center gap-1 text-[8px] font-bold text-[#ffb4ab]">
              <LogOut size={20} />
              SAIR
            </button>
        </nav>
      </div>
    </div>
  );
}
