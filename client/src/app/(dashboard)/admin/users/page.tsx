'use client';
import { useEffect, useState } from 'react';
import { Search, ToggleLeft, ToggleRight, UsersRound, UserCog } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { adminApi } from '@/lib/api';
import { Admin } from '@/types';
import { formatDate } from '@/utils';

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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="mt-3 h-10 w-52" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        </div>
        <div className="surface-card rounded-2xl p-5">
          <Skeleton className="h-11 w-full max-w-md" />
          <Skeleton className="mt-4 h-56 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise space-y-6">
      <section className="mesh-bg rounded-3xl border border-[#2a3d62] p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#8fb2db]">Access control</p>
            <h1 className="mt-2 text-3xl font-bold text-[#eaf1ff] sm:text-4xl">Admin Users</h1>
            <p className="mt-2 text-sm text-[#9ab2d7]">Manage administrator access states and monitor role assignments across operations teams.</p>
          </div>
          <div className="surface-card flex items-center gap-3 px-4 py-3">
            <div className="rounded-xl bg-[#1f83c2]/15 p-2.5">
              <UsersRound className="h-4 w-4 text-[#80d7ff]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8fb2db]">Total admins</p>
              <p className="text-sm font-semibold text-[#eaf1ff]">{admins.length} configured</p>
            </div>
          </div>
        </div>
      </section>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94a7c8]" />
        <input
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-[#2a3d62] bg-[#0a1326] pl-9 pr-4 text-sm text-[#eaf1ff] placeholder:text-[#7e93b8] focus:border-[#26c5b4]/70 focus:outline-none focus:ring-2 focus:ring-[#26c5b4]/25"
        />
      </div>

      <div className="hidden overflow-x-auto rounded-2xl border border-[#2a3d62] bg-[#0d1730] md:block">
        <table className="w-full text-left">
          <thead className="bg-[#142443]">
            <tr>
              {['User', 'Email', 'Role', 'Status', 'Joined', 'Action'].map((h) => (
                <th key={h} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#89a3ce]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#223963]">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-[#9ab2d7]">No admins found.</td></tr>
            ) : filtered.map((a) => (
              <tr key={a.id} className="transition-colors hover:bg-[#16284a]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#1f83c2] to-[#1f9d8f] text-xs font-bold text-white">
                      {a.name[0]?.toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-[#eaf1ff]">{a.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[#9ab2d7]">{a.email}</td>
                <td className="px-4 py-3">
                  <Badge className={a.role === 'superadmin' ? 'border-purple-400/30 bg-purple-500/20 text-purple-200' : 'border-[#1f83c2]/40 bg-[#1f83c2]/20 text-[#8fdcff]'}>
                    {a.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className={a.isActive ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200' : 'border-[#f56565]/40 bg-[#f56565]/15 text-[#ffb3b3]'}>
                    {a.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-[#9ab2d7]">{formatDate(a.createdAt)}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleToggle(a.id, a.isActive)}
                    disabled={toggling === a.id}
                    aria-label={`${a.isActive ? 'Deactivate' : 'Activate'} ${a.name}`}
                    className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${a.isActive ? 'text-[#ffb3b3] hover:text-[#ffd2d2]' : 'text-emerald-200 hover:text-emerald-100'}`}
                  >
                    {a.isActive ? <><ToggleRight className="h-4 w-4" /> Deactivate</> : <><ToggleLeft className="h-4 w-4" /> Activate</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {filtered.length === 0 ? (
          <EmptyState
            title="No admins found"
            description="Try another name or email query to locate administrator accounts."
            icon={UserCog}
          />
        ) : filtered.map((a) => (
          <div key={a.id} className="surface-card space-y-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[#eaf1ff]">{a.name}</p>
              <Badge className={a.isActive ? 'border-emerald-400/30 bg-emerald-500/20 text-emerald-200' : 'border-[#f56565]/40 bg-[#f56565]/15 text-[#ffb3b3]'}>
                {a.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <p className="text-xs text-[#9ab2d7]">{a.email}</p>
            <div className="flex items-center justify-between">
              <Badge className={a.role === 'superadmin' ? 'border-purple-400/30 bg-purple-500/20 text-purple-200' : 'border-[#1f83c2]/40 bg-[#1f83c2]/20 text-[#8fdcff]'}>
                {a.role}
              </Badge>
              <button
                onClick={() => handleToggle(a.id, a.isActive)}
                disabled={toggling === a.id}
                aria-label={`${a.isActive ? 'Deactivate' : 'Activate'} ${a.name}`}
                className={`inline-flex items-center gap-1 text-xs font-medium transition-colors ${a.isActive ? 'text-[#ffb3b3] hover:text-[#ffd2d2]' : 'text-emerald-200 hover:text-emerald-100'}`}
              >
                {a.isActive ? <><ToggleRight className="h-4 w-4" /> Deactivate</> : <><ToggleLeft className="h-4 w-4" /> Activate</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
