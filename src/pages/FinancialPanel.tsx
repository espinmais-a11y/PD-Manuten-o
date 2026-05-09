import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ServiceOrder } from '../types';
import { 
  TrendingUp, 
  AlertTriangle, 
  Search, 
  Download, 
  IndianRupee, 
  CheckCircle2, 
  Clock,
  MoreVertical,
  Briefcase
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';

export function FinancialPanel() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    fetchFinancialData();
  }, [statusFilter]);

  async function fetchFinancialData() {
    let query = supabase.from('service_orders').select('*').eq('status', 'Finished');
    
    if (statusFilter !== 'All') {
      const isPaid = statusFilter === 'Paid';
      query = query.eq('is_paid', isPaid);
    }

    const { data } = await query.order('updated_at', { ascending: false });
    if (data) setOrders(data);
    setLoading(false);
  }

  const totalRevenue = orders.reduce((sum, os) => sum + Number(os.total_value), 0);
  const paidTotal = orders.filter(os => os.is_paid).reduce((sum, os) => sum + Number(os.total_value), 0);
  const pendingTotal = totalRevenue - paidTotal;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Painel Financeiro</h2>
          <p className="text-[#c5c9ac] font-['JetBrains_Mono'] text-xs uppercase tracking-widest">Relatório de faturamento e fluxo de caixa industrial</p>
        </div>
        
        <button className="bg-[#caf300] text-[#121414] px-6 py-3 font-bold text-[10px] tracking-widest flex items-center gap-2 hover:brightness-110 shadow-lg rounded-xl">
          <Download size={14} /> EXPORTAR RELATÓRIO CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <FinanceCard 
          label="RECEITA TOTAL (MÊS)" 
          value={`R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Soma de todas as OS concluídas"
          icon={TrendingUp}
          color="text-[#caf300]"
        />
        <FinanceCard 
          label="VALOR RECEBIDO" 
          value={`R$ ${paidTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Transações confirmadas"
          icon={CheckCircle2}
          color="text-[#00ffff]"
        />
        <FinanceCard 
          label="PENDENTE FATURAMENTO" 
          value={`R$ ${pendingTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} 
          sub="Aguardando liquidação"
          icon={Clock}
          color="text-[#ffbf00]"
        />
      </div>

      <div className="bg-[#1e2020] border border-[#444932] rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-[#444932] bg-[#282a2b] flex flex-wrap items-center justify-between gap-4">
           <div className="flex border border-[#444932] overflow-hidden shadow-inner rounded-xl">
              <FilterBtn label="TODOS" active={statusFilter === 'All'} onClick={() => setStatusFilter('All')} />
              <FilterBtn label="PAGOS" active={statusFilter === 'Paid'} onClick={() => setStatusFilter('Paid')} />
              <FilterBtn label="PENDENTES" active={statusFilter === 'Pending'} onClick={() => setStatusFilter('Pending')} />
           </div>
           
           <div className="flex items-center bg-[#0c0f0f] border border-[#444932] rounded-xl px-3 py-1 w-full max-w-xs">
             <Search size={14} className="text-[#c5c9ac] mr-2" />
             <input type="text" placeholder="BUSCAR FATURA..." className="bg-transparent border-none focus:ring-0 text-[10px] text-white w-full uppercase" />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#333535] text-[#c5c9ac] text-[10px] uppercase font-bold tracking-widest border-b border-[#444932]">
                <th className="px-6 py-4">ID FATURA</th>
                <th className="px-6 py-4">CLIENTE / OS</th>
                <th className="px-6 py-4 text-right">VALOR</th>
                <th className="px-6 py-4">DATA</th>
                <th className="px-6 py-4 text-center">STATUS</th>
                <th className="px-6 py-4 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#444932]/30 font-['JetBrains_Mono'] text-xs">
              {orders.map((os) => (
                <tr key={os.id} className="hover:bg-[#333535] transition-colors">
                  <td className="px-6 py-4 text-[#caf300]">#INV-{os.id.slice(0, 6).toUpperCase()}</td>
                  <td className="px-6 py-4">
                     <p className="font-bold text-[#e2e2e2] uppercase">LOGÍSTICA NACIONAL S.A.</p>
                     <p className="text-[10px] text-[#c5c9ac]">{os.title}</p>
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-white">
                     R$ {Number(os.total_value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-[#c5c9ac]">
                     {format(new Date(os.updated_at), 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 text-center">
                     <span className={clsx(
                       "px-3 py-1 font-black text-[10px] tracking-widest",
                       os.is_paid ? "bg-[#caf300]/20 text-[#caf300] border border-[#caf300]" : "bg-[#93000a] text-white"
                     )}>
                        {os.is_paid ? 'LIQUIDADO' : 'PENDENTE'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                     <button className="text-[#c5c9ac] hover:text-[#caf300]">
                        <MoreVertical size={16} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {orders.length === 0 && (
             <div className="py-20 text-center text-[#c5c9ac] opacity-50 space-y-2">
                <Briefcase size={32} className="mx-auto" />
                <p className="text-[10px] font-bold uppercase tracking-widest">Nenhuma fatura encontrada</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FinanceCard({ label, value, sub, icon: Icon, color }: any) {
  return (
    <div className="bg-[#1e2020] border border-[#444932] p-6 group rounded-2xl shadow-lg hover:border-[#caf300]/50 transition-all">
      <div className="flex justify-between items-start mb-6">
        <span className="text-[10px] font-bold text-[#c5c9ac] tracking-widest uppercase font-['JetBrains_Mono']">{label}</span>
        <Icon size={18} className={color} />
      </div>
      <p className={clsx("text-2xl font-black italic tracking-tighter mb-1", color)}>{value}</p>
      <p className="text-[10px] text-[#c5c9ac] font-bold tracking-tight uppercase">{sub}</p>
    </div>
  );
}

function FilterBtn({ label, active, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className={clsx(
        "px-4 py-2 text-[9px] font-bold tracking-widest transition-all",
        active ? "bg-[#caf300] text-[#121414]" : "bg-[#121414] text-[#c5c9ac] hover:bg-[#333535]"
      )}
    >
      {label}
    </button>
  );
}
