import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { Users, UserCheck, ShieldAlert, MoreVertical, Search, Loader2, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';

export function UserManagement() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('is_approved', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (data) setUsers(data as Profile[]);
    setLoading(false);
  }

  async function toggleApproval(userId: string, currentStatus: boolean) {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', userId);

    if (!error) {
      setUsers(users.map(u => u.id === userId ? { ...u, is_approved: !currentStatus } : u));
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm('Tem certeza que deseja excluir permanentemente este usuário? Esta ação não removerá o acesso do Auth, apenas os dados do perfil.')) return;
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (error) {
      alert('Erro ao excluir usuário: ' + error.message);
    } else {
      setUsers(users.filter(u => u.id !== userId));
    }
  }

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
      <div>
        <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">Gestão de Usuários</h2>
        <p className="text-[#c5c9ac] font-['JetBrains_Mono'] text-xs uppercase tracking-widest">Controle de acesso e aprovação de novos cadastros</p>
      </div>

      <div className="bg-[#1e2020] border border-[#444932] overflow-hidden rounded-2xl shadow-xl">
        <div className="p-4 border-b border-[#444932] bg-[#282a2b] flex items-center justify-between">
           <div className="flex items-center bg-[#0c0f0f] border border-[#444932] rounded-xl px-3 py-1 w-full max-w-sm">
             <Search size={14} className="text-[#c5c9ac] mr-2" />
             <input type="text" placeholder="BUSCAR USUÁRIO..." className="bg-transparent border-none focus:ring-0 text-xs text-white w-full uppercase" />
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#333535] text-[#c5c9ac] text-[10px] uppercase font-bold tracking-widest border-b border-[#444932]">
                <th className="px-6 py-4">Usuário</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4">Data Cadastro</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#444932]/30 font-['JetBrains_Mono'] text-xs">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#333535] transition-colors">
                  <td className="px-6 py-4">
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-[#444932] flex items-center justify-center font-bold text-[#caf300]">
                           {user.full_name?.charAt(0)}
                        </div>
                        <div>
                           <p className="font-bold text-[#e2e2e2] uppercase">{user.full_name}</p>
                           <p className="text-[10px] text-[#c5c9ac] truncate">{user.email}</p>
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                     <span className="text-[#c5c9ac] border border-[#444932] px-2 py-0.5 text-[10px] tracking-widest font-bold uppercase transition-all">
                        {user.role === 'Admin' ? 'Administrador' : user.role === 'Employee' ? 'Técnico' : 'Cliente'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-[#c5c9ac]">
                     {new Date(user.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                     {user.is_approved ? (
                        <div className="flex items-center gap-2 text-[#caf300]">
                           <UserCheck size={14} />
                           <span className="text-[9px] font-bold tracking-widest">APROVADO</span>
                        </div>
                     ) : (
                        <div className="flex items-center gap-2 text-[#ffbf00]">
                           <Loader2 size={14} className="animate-spin" />
                           <span className="text-[9px] font-bold tracking-widest">AGUARDANDO</span>
                        </div>
                     )}
                  </td>
                  <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                     <button 
                       onClick={() => toggleApproval(user.id, user.is_approved)}
                       className={clsx(
                         "px-4 py-2 text-[10px] font-bold tracking-widest uppercase transition-all shadow-md active:scale-95 rounded-lg",
                         user.is_approved 
                          ? "bg-[#93000a] text-white hover:bg-[#690005]" 
                          : "bg-[#caf300] text-[#121414] hover:brightness-110"
                       )}
                     >
                        {user.is_approved ? 'REVOGAR' : 'APROVAR'}
                     </button>

                     <button 
                       onClick={() => deleteUser(user.id)}
                       className="p-2 text-[#ffb4ab] hover:bg-[#93000a]/20 hover:text-white transition-all rounded-lg"
                       title="Excluir Usuário"
                     >
                        <Trash2 size={16} />
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {loading && (
             <div className="py-20 flex justify-center">
                <Loader2 className="animate-spin text-[#caf300]" size={32} />
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
