import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { ServiceOrder, Profile } from '../types';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  AlertTriangle, 
  Forklift, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock, 
  MapPin,
  Plus,
  Users
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ServiceOrderModal } from '../components/ServiceOrderModal';

export function Dashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [osCount, setOsCount] = useState(0);
  const [recentOs, setRecentOs] = useState<ServiceOrder[]>([]);
  const [totalReceivable, setTotalReceivable] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  async function fetchDashboardData() {
    if (!profile) return;

    let query = supabase.from('service_orders').select('*');

    const role = (profile?.role || '').toString().toLowerCase().trim();

    if (role === 'customer') {
      // In a real app we'd filter by customer_id associated with profile
      // For now we'll simulate context
    } else if (role === 'employee') {
      query = query.eq('employee_id', profile?.id);
    }

    const { data: osData } = await query.order('created_at', { ascending: false });
    
    if (osData) {
      setOsCount(osData.length);
      setRecentOs(osData.slice(0, 5));
      
      const receivable = osData
        .filter(os => os.status === 'Finished' && !os.is_paid)
        .reduce((sum, os) => sum + Number(os.total_value), 0);
      setTotalReceivable(receivable);
    }
    if (role === 'admin') {
      const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_approved', false);
      setPendingApprovals(count || 0);
    }
    setLoading(false);
  }

  const [pendingApprovals, setPendingApprovals] = useState(0);

  const renderAdminStats = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
      <StatCard 
        label="USUÁRIOS PENDENTES" 
        value={`${pendingApprovals} SOLICIT.`} 
        subtext="Aguardando liberação de acesso"
        icon={Users}
        color={pendingApprovals > 0 ? "text-[#ffbf00]" : "text-[#caf300]"}
        onClick={() => navigate('/users')}
      />
      <StatCard 
        label="FINANCEIRO GLOBAL" 
        value={`R$ ${totalReceivable.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
        subtext="OS Finalizadas (A receber)"
        icon={TrendingUp}
        color="text-[#caf300]"
      />
      <StatCard 
        label="DISPONIBILIDADE" 
        value="84%" 
        subtext="Frota em Operação"
        icon={Forklift}
        color="text-[#e2e2e2]"
        progress={84}
      />
      <StatCard 
        label="CRONOGRAMA" 
        value="12 MANUT." 
        subtext="Previsão Próximas 24h"
        icon={Calendar}
        color="text-[#e2e2e2]"
      />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <header className="flex justify-between items-end gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-white">DASHBOARD</h2>
          <p className="text-[#c5c9ac] font-['JetBrains_Mono'] text-xs uppercase tracking-widest">Controle operacional de frota</p>
        </div>
        {profile?.role?.toString().toLowerCase().trim() !== 'employee' && (
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-[#caf300] text-[#121414] px-6 py-3 font-black text-xs tracking-widest flex items-center gap-2 hover:brightness-110 shadow-lg rounded-xl"
          >
            <Plus size={16} /> ABRIR NOVO CHAMADO
          </button>
        )}
      </header>

      {profile?.role?.toString().toLowerCase().trim() === 'admin' && renderAdminStats()}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Section */}
        <section className="lg:col-span-8 space-y-8">
          <div className="bg-[#1e2020] border border-[#444932] overflow-hidden rounded-2xl shadow-xl">
            <div className="p-6 border-b border-[#444932] bg-[#282a2b] flex justify-between items-center">
              <h3 className="font-bold text-sm tracking-widest uppercase font-['JetBrains_Mono']">FROTA ATIVA & TELEMETRIA</h3>
               <span className="text-[10px] text-[#c5c9ac] animate-pulse">● LIVE UPDATE</span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#333535] text-[#c5c9ac] text-[10px] uppercase font-bold tracking-widest border-b border-[#444932]">
                    <th className="px-6 py-4">Equipamento</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Operador</th>
                    <th className="px-6 py-4">Bateria</th>
                    <th className="px-6 py-4">Posição</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#444932]/30 font-['JetBrains_Mono'] text-xs">
                  <TableRow 
                    machine="TOYOTA 8FGU25" 
                    status="EM EXECUÇÃO" 
                    operator="Roberto Alencar" 
                    battery={72} 
                    lat="-23.55" 
                    long="-46.63" 
                  />
                  <TableRow 
                    machine="HYSTER H50XT" 
                    status="ATRASADA" 
                    operator="Oficina Setor C" 
                    battery={12} 
                    lat="OFFLINE" 
                    long="BAY-042" 
                    error
                  />
                  <TableRow 
                    machine="STILL RX60-80" 
                    status="EM ROTA" 
                    operator="Carla Mendes" 
                    battery={95} 
                    lat="-23.56" 
                    long="-46.64" 
                  />
                  <TableRow 
                    machine="CATERPILLAR DP20N" 
                    status="PENDENTE" 
                    operator="João Santos" 
                    battery={45} 
                    lat="-23.58" 
                    long="-46.61" 
                  />
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Sidebar Section */}
        <section className="lg:col-span-4 space-y-6">
           <div className="bg-[#1e2020] border border-[#444932] flex flex-col h-full rounded-2xl overflow-hidden shadow-xl">
              <div className="p-6 border-b border-[#444932]">
                <h3 className="font-bold text-xs tracking-widest uppercase font-['JetBrains_Mono'] text-[#c5c9ac]">
                   REGISTROS RECENTES
                </h3>
              </div>
              <div className="flex-1 divide-y divide-[#444932]/30">
                 {recentOs.length > 0 ? recentOs.map((os) => (
                    <div key={os.id} className="p-4 hover:bg-[#333535] transition-all cursor-pointer group">
                       <div className="flex justify-between items-start mb-1">
                          <span className="text-[#caf300] font-bold text-[10px]">#{os.id.slice(0, 8)}</span>
                          <span className="text-[9px] text-[#c5c9ac]">{format(new Date(os.created_at), 'HH:mm')}</span>
                       </div>
                       <h4 className="text-sm font-bold text-white mb-2">{os.title}</h4>
                       <div className="flex items-center justify-between">
          <span className={clsx(
            "px-2 py-0.5 text-[8px] font-bold tracking-widest uppercase",
            os.status === 'Executing' ? 'bg-[#caf300] text-[#121414]' : 
            os.status === 'Pending' ? 'bg-[#ffbf00] text-[#121414]' : 'bg-[#333535] text-[#c5c9ac]'
          )}>
            {os.status === 'Executing' ? 'EM EXECUÇÃO' : 
             os.status === 'Pending' ? 'PENDENTE' : 
             os.status === 'Finished' ? 'FINALIZADA' : os.status}
          </span>
                          <ArrowUpRight size={14} className="text-[#c5c9ac] group-hover:text-[#caf300] transition-colors" />
                       </div>
                    </div>
                 )) : (
                   <div className="p-10 text-center space-y-3 opacity-50">
                      <Clock size={32} className="mx-auto" />
                      <p className="text-[10px] font-bold uppercase tracking-widest">Sem atividades recentes</p>
                   </div>
                 )}
              </div>
              <button className="p-4 text-[10px] font-bold text-[#caf300] border-t border-[#444932] hover:bg-[#333535] transition-all tracking-widest uppercase">
                VER TODO O LOG
              </button>
           </div>
        </section>
      </div>

      <ServiceOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}

function StatCard({ label, value, subtext, icon: Icon, color, progress, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={clsx(
        "bg-[#1e2020] border border-[#444932] p-6 relative overflow-hidden group rounded-2xl shadow-lg transition-all",
        onClick ? "cursor-pointer hover:border-[#caf300]/50 active:scale-[0.98]" : "hover:border-[#caf300]/30"
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#caf300]/5 -mr-8 -mt-8 rounded-full blur-2xl group-hover:bg-[#caf300]/10 transition-all"></div>
      <div className="flex justify-between items-start z-10 relative">
        <span className={clsx("text-[10px] font-bold tracking-widest font-['JetBrains_Mono']", color)}>{label}</span>
        <Icon className={color} size={16} />
      </div>
      <div className="mt-8 z-10 relative">
        <p className={clsx("text-2xl font-black italic tracking-tighter", color)}>{value}</p>
        <p className="text-[10px] text-[#c5c9ac] font-bold tracking-tight mt-1">{subtext}</p>
      </div>
      {progress !== undefined && (
        <div className="mt-4 h-1 bg-[#333535] relative">
          <div className="absolute h-full bg-[#caf300]" style={{ width: `${progress}%` }}></div>
        </div>
      )}
    </div>
  );
}

function TableRow({ machine, status, operator, battery, lat, long, error }: any) {
  return (
    <tr className={clsx("hover:bg-[#333535] transition-colors", error && "bg-[#93000a]/5")}>
      <td className="px-6 py-4 font-bold text-[#e2e2e2]">{machine}</td>
      <td className="px-6 py-4">
        <span className={clsx(
          "px-2 py-1 text-[9px] font-bold tracking-widest",
          status === 'EM EXECUÇÃO' ? 'bg-[#caf300] text-[#121414]' : 
          status === 'ATRASADA' ? 'bg-[#ffb4ab] text-[#690005]' : 'bg-[#00ffff] text-[#121414]'
        )}>
          {status}
        </span>
      </td>
      <td className="px-6 py-4 text-[#c5c9ac]">{operator}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-1.5 bg-[#333535] overflow-hidden">
            <div 
              className={clsx("h-full", battery > 20 ? "bg-[#caf300]" : "bg-[#ffb4ab]")} 
              style={{ width: `${battery}%` }}
            ></div>
          </div>
          <span className="text-[10px]">{battery}%</span>
        </div>
      </td>
      <td className="px-6 py-4 text-[#c5c9ac] flex items-center gap-1 uppercase">
        <MapPin size={10} className={error ? 'text-[#ffb4ab]' : 'text-[#caf300]'} />
        {lat} | {long}
      </td>
    </tr>
  );
}
