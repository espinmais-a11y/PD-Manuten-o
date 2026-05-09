import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { ServiceOrder } from '../types';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  MoreVertical, 
  Play, 
  CheckCircle2, 
  MapPin, 
  Clock,
  Camera,
  Signature
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { ServiceOrderModal } from '../components/ServiceOrderModal';

export function ServiceOrders() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [profile, filter]);

  async function fetchOrders() {
    try {
      setLoading(true);
      let query = supabase.from('service_orders').select('*');
      
      if (profile?.role === 'Employee' || profile?.role === 'employee') {
        query = query.eq('employee_id', profile.id);
      }
      
      if (filter !== 'All') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setOrders(data);
    } catch (err) {
      console.error('[ServiceOrders] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleCheckIn = async (orderId: string) => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'Executing',
          check_in_at: new Date().toISOString(),
          check_in_lat: latitude,
          check_in_lng: longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (!error) fetchOrders();
    });
  };

  const handleCheckOut = async (orderId: string) => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      const { error } = await supabase
        .from('service_orders')
        .update({
          status: 'Finished',
          check_out_at: new Date().toISOString(),
          check_out_lat: latitude,
          check_out_lng: longitude,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (!error) fetchOrders();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black italic tracking-tighter text-white">ORDENS DE SERVIÇO</h2>
          <p className="text-[#c5c9ac] font-['JetBrains_Mono'] text-xs uppercase tracking-widest">Execução técnica e monitoramento</p>
        </div>
        
        <div className="flex gap-2">
           <select 
             value={filter}
             onChange={(e) => setFilter(e.target.value)}
             className="bg-[#1e2020] border border-[#444932] text-[10px] font-bold font-['JetBrains_Mono'] text-[#e2e2e2] px-4 py-2 outline-none focus:border-[#caf300] rounded-lg"
           >
              <option value="All">TODOS</option>
              <option value="Pending">PENDENTES</option>
              <option value="Executing">EXECUTANDO</option>
              <option value="Finished">FINALIZADAS</option>
           </select>
           <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-[#caf300] text-[#121414] px-4 py-2 font-bold text-[10px] tracking-widest flex items-center gap-2 rounded-lg hover:brightness-110"
           >
             <ClipboardList size={14} /> NOVA OS
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((os) => (
          <div key={os.id} className="bg-[#1e2020] border border-[#444932] flex flex-col shadow-xl rounded-2xl overflow-hidden group hover:border-[#caf300]/50 transition-all">
             <div className="p-4 border-b border-[#444932] bg-[#282a2b] flex justify-between items-start">
                <span className={clsx(
                  "px-2 py-1 text-[8px] font-black tracking-[0.2em] rounded",
                  os.status === 'Executing' ? 'bg-[#caf300] text-[#121414]' : 
                  os.status === 'Pending' ? 'bg-[#ffbf00] text-[#121414]' : 
                  os.status === 'Finished' ? 'bg-[#333535] text-[#c5c9ac]' : 'bg-[#ffb4ab] text-[#690005]'
                )}>
                  {os.status === 'Executing' ? 'EXECUTANDO' : 
                   os.status === 'Pending' ? 'PENDENTE' : 
                   os.status === 'Finished' ? 'FINALIZADA' : os.status.toUpperCase()}
                </span>
                <span className="text-[10px] font-['JetBrains_Mono'] text-[#c5c9ac]">OS #{os.id.slice(0, 8)}</span>
             </div>

             <div className="p-6 space-y-4 flex-1">
                <div>
                   <h3 className="text-lg font-bold text-white tracking-tight leading-tight mb-1 uppercase">{os.title}</h3>
                   <p className="text-xs text-[#c5c9ac]">{os.description || 'Sem descrição detalhada.'}</p>
                </div>

                <div className="bg-[#0c0f0f] border border-[#444932] p-3 space-y-2 rounded-xl">
                   <div className="flex items-center gap-2 text-[9px] font-bold text-[#c5c9ac] uppercase">
                      <Clock size={12} className="text-[#caf300]" />
                      <span>ABERTA EM: {format(new Date(os.created_at), 'dd/MM HH:mm')}</span>
                   </div>
                   {os.check_in_at && (
                     <div className="flex items-center gap-2 text-[9px] font-bold text-[#caf300] uppercase">
                        <MapPin size={12} />
                        <span>INÍCIO: {format(new Date(os.check_in_at), 'HH:mm')} ({os.check_in_lat?.toFixed(4)}, {os.check_in_lng?.toFixed(4)})</span>
                     </div>
                   )}
                </div>
             </div>

             <div className="p-4 bg-[#121414] border-t border-[#444932]">
                {(profile?.role === 'Employee' || profile?.role === 'employee') && os.status === 'Pending' && (
                  <button 
                    onClick={() => handleCheckIn(os.id)}
                    className="w-full bg-[#caf300] text-[#121414] py-3 text-[10px] font-black tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] rounded-xl shadow-lg"
                  >
                    <Play size={14} fill="currentColor" /> REALIZAR CHECK-IN
                  </button>
                )}

                {(profile?.role === 'Employee' || profile?.role === 'employee') && os.status === 'Executing' && (
                  <button 
                    onClick={() => handleCheckOut(os.id)}
                    className="w-full bg-[#ffbf00] text-[#121414] py-3 text-[10px] font-black tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] rounded-xl shadow-lg"
                  >
                    <CheckCircle2 size={14} /> FINALIZAR SERVIÇO (CHECK-OUT)
                  </button>
                )}

                {os.status === 'Finished' && (
                   <div className="flex items-center justify-center gap-2 py-3 text-[10px] font-bold text-[#c5c9ac] tracking-widest uppercase">
                      <CheckCircle2 size={16} className="text-[#caf300]" /> SERVIÇO CONCLUÍDO
                   </div>
                )}
             </div>
          </div>
        ))}

        {orders.length === 0 && !loading && (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-[#444932] opacity-30">
             <ClipboardList size={48} className="mx-auto mb-4" />
             <p className="text-sm font-bold uppercase tracking-widest">Nenhuma Ordem de Serviço encontrada</p>
          </div>
        )}
      </div>

      <ServiceOrderModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchOrders}
      />
    </div>
  );
}
