'use client';
import { useEffect, useState } from 'react';
import { Shield, ToggleLeft, ToggleRight, Search } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { adminApi } from '@/lib/api';
import { Admin } from '@/types';
import { formatDate } from '@/utils';
import { Button } from '@/components/ui/Button';

export default function AdminUsersPage() {
  const [admins, setAdmins]     = useState<Admin[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    adminApi.getUsers().then((r) => setAdmins(r.data.admins ?? [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleToggle = async (id: string, isActive: boolean) => {
    setToggling(id);
    try {
      const res = await adminApi.updateUserStatus(id, { isActive: !isActive });
      setAdmins((prev) => prev.map((a) => a.id === id ? res.data.admin : a));
    } catch {/* ignore */}
    setToggling(null);
  };

  const filtered = admins.filter((a) =>
    search === '' || a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Spinner text="Loading users…" />;

  return (
    <div className="animate-fadein">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#e8eaf0]">Admin Users</h1>
          <p className="text-sm text-[#8892a4] mt-1">{admins.length} total admins</p>
        </div>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8892a4]" />
        <input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-10 w-full pl-9 pr-4 bg-[#0f1629] border border-[#1e2d4a] rounded-xl text-[#e8eaf0] text-sm placeholder:text-[#8892a4] focus:outline-none focus:border-blue-500/60"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#1e2d4a] bg-[#0f1629]">
        <table className="w-full text-left">
          <thead className="bg-[#141d35]">
            <tr>
              {['User', 'Email', 'Role', 'Status', 'Joined', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold text-[#8892a4] uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e2d4a]">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-[#8892a4] text-sm">No admins found</td></tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="hover:bg-[#141d35] transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {a.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#e8eaf0]">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#8892a4]">{a.email}</td>
                <td className="px-4 py-3">
                  <Badge className={a.role === 'superadmin' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-blue-500/20 text-blue-400 border-blue-500/30'}>
                    {a.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={a.isActive ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}>
                    {a.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-[#8892a4]">{formatDate(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(a.id, a.isActive)}
                    disabled={toggling === a.id}
                    className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${a.isActive ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                  >
                    {a.isActive ? <><ToggleRight className="w-4 h-4" /> Deactivate</> : <><ToggleLeft className="w-4 h-4" /> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
