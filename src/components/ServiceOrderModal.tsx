import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Customer, Machine, Profile, OSStatus } from '../types';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ServiceOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ServiceOrderModal({ isOpen, onClose, onSuccess }: ServiceOrderModalProps) {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [employees, setEmployees] = useState<Profile[]>([]);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    machine_id: '',
    employee_id: '',
    title: '',
    description: '',
    status: 'Pending' as OSStatus
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setError(null);
      fetchInitialData();
    }
  }, [isOpen]);

  async function fetchInitialData() {
    try {
      setLoading(true);
      const [customersRes, employeesRes] = await Promise.all([
        supabase.from('customers').select('id, name').order('name'),
        supabase.from('profiles').select('id, full_name, role').in('role', ['Admin', 'Employee']).eq('is_approved', true).order('full_name')
      ]);

      if (customersRes.error) throw customersRes.error;
      if (employeesRes.error) throw employeesRes.error;

      setCustomers(customersRes.data || []);
      setEmployees(employeesRes.data || []);
    } catch (err: any) {
      console.error('[ServiceOrderModal] Error fetching initial data:', err);
      let userFriendyMessage = 'Erro ao carregar dados. Por favor, verifique sua conexão.';
      
      const errorMessage = err.message || '';
      if (errorMessage.includes('Failed to fetch')) {
        userFriendyMessage = 'Erro de conexão com o servidor. Verifique sua internet.';
      }
      
      setError(userFriendyMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (formData.customer_id) {
      fetchMachines(formData.customer_id);
    } else {
      setMachines([]);
      setFormData(prev => ({ ...prev, machine_id: '' }));
    }
  }, [formData.customer_id]);

  async function fetchMachines(customerId: string) {
    try {
      const { data, error: mError } = await supabase
        .from('machines')
        .select('id, brand, model, serial_number')
        .eq('customer_id', customerId)
        .order('brand');
      
      if (mError) throw mError;
      if (data) setMachines(data);
    } catch (err) {
      console.error('[ServiceOrderModal] Error fetching machines:', err);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    setError(null);

    try {
      if (!formData.customer_id || !formData.machine_id || !formData.title) {
        throw new Error('Preencha os campos obrigatórios (Cliente, Máquina e Título).');
      }

      const { error: insertError } = await supabase
        .from('service_orders')
        .insert([{
          customer_id: formData.customer_id,
          machine_id: formData.machine_id,
          employee_id: formData.employee_id || null,
          title: formData.title.toUpperCase(),
          description: formData.description?.toUpperCase() || '',
          status: formData.status,
          updated_at: new Date().toISOString()
        }]);

      if (insertError) throw insertError;

      onSuccess();
      onClose();
      setFormData({
        customer_id: '',
        machine_id: '',
        employee_id: '',
        title: '',
        description: '',
        status: 'Pending'
      });
    } catch (err: any) {
      console.error('[ServiceOrderModal] Submission error:', err);
      let userFriendyMessage = 'Erro ao criar ordem de serviço. Por favor, tente novamente.';
      
      const errorMessage = err.message || '';
      if (errorMessage.includes('duplicate key value')) {
        userFriendyMessage = 'Já existe um registro com estas informações.';
      } else if (errorMessage.includes('Preencha os campos')) {
        userFriendyMessage = errorMessage;
      }
      
      setError(userFriendyMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-[#1e2020] border border-[#444932] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
          >
            <div className="p-6 border-b border-[#444932] flex justify-between items-center bg-[#282a2b]">
              <div>
                <h3 className="text-xl font-black italic tracking-tighter text-white uppercase">Nova Ordem de Serviço</h3>
                <p className="text-[10px] text-[#c5c9ac] font-['JetBrains_Mono'] tracking-widest uppercase mt-1">Abertura de chamado técnico</p>
              </div>
              <button 
                onClick={onClose}
                className="text-[#c5c9ac] hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-500 text-sm font-bold uppercase tracking-widest">
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#c5c9ac] tracking-widest uppercase">Cliente *</label>
                  <select
                    required
                    value={formData.customer_id}
                    onChange={(e) => setFormData({...formData, customer_id: e.target.value})}
                    className="w-full bg-[#0c0f0f] border border-[#444932] text-sm text-white px-4 py-3 rounded-xl focus:border-[#caf300] outline-none transition-all"
                  >
                    <option value="">SELECIONE O CLIENTE</option>
                    {customers?.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#c5c9ac] tracking-widest uppercase">Equipamento *</label>
                  <select
                    required
                    value={formData.machine_id}
                    onChange={(e) => setFormData({...formData, machine_id: e.target.value})}
                    disabled={!formData.customer_id}
                    className="w-full bg-[#0c0f0f] border border-[#444932] text-sm text-white px-4 py-3 rounded-xl focus:border-[#caf300] outline-none transition-all disabled:opacity-50"
                  >
                    <option value="">{formData.customer_id ? 'SELECIONE O EQUIPAMENTO' : 'SELECIONE UM CLIENTE PRIMEIRO'}</option>
                    {machines?.map(m => (
                      <option key={m.id} value={m.id}>{m.brand} {m.model} - {m.serial_number}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#c5c9ac] tracking-widest uppercase">Técnico Responsável</label>
                <select
                  value={formData.employee_id}
                  onChange={(e) => setFormData({...formData, employee_id: e.target.value})}
                  className="w-full bg-[#0c0f0f] border border-[#444932] text-sm text-white px-4 py-3 rounded-xl focus:border-[#caf300] outline-none transition-all"
                >
                  <option value="">NÃO ATRIBUÍDO</option>
                  {employees?.map(e => (
                    <option key={e.id} value={e.id}>{e.full_name || 'TÉCNICO'}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#c5c9ac] tracking-widest uppercase">Título do Serviço *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value.toUpperCase()})}
                  placeholder="Ex: Manutenção Preventiva - 500h"
                  className="w-full bg-[#0c0f0f] border border-[#444932] text-sm text-white px-4 py-3 rounded-xl focus:border-[#caf300] outline-none transition-all placeholder:text-[#444932] uppercase"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#c5c9ac] tracking-widest uppercase">Descrição do Problema / Observações</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                  rows={4}
                  placeholder="Descreva detalhadamente o serviço a ser realizado..."
                  className="w-full bg-[#0c0f0f] border border-[#444932] text-sm text-white px-4 py-3 rounded-xl focus:border-[#caf300] outline-none transition-all placeholder:text-[#444932] resize-none uppercase"
                />
              </div>

              <div className="p-6 bg-[#282a2b] border-t border-[#444932] flex gap-4 -mx-8 -mb-8 mt-auto sticky bottom-0">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-4 text-xs font-bold text-[#c5c9ac] hover:text-white transition-colors uppercase tracking-widest"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#caf300] text-[#121414] px-6 py-4 rounded-xl font-black text-xs tracking-widest uppercase flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : 'CRIAR ORDEM DE SERVIÇO'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
