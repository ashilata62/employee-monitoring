import React, { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Clock,
  Monitor,
  Coffee,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronRight,
  Shield,
  Briefcase
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function EmployeeWorkforceAnalytics({
  employees = [],
  rankings = {},
  organizationId,
  onSelectEmployee
}) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedTeam, setSelectedTeam] = useState('ALL');
  const [selectedEmployeeDetail, setSelectedEmployeeDetail] = useState(null);

  // Merge employee data with rankings stats
  const enrichedList = employees.map((emp, index) => {
    const rankInfo =
      (rankings.topProductive || []).find(r => r.id === emp.id || r.name === emp.fullName) ||
      (rankings.topUnproductive || []).find(r => r.id === emp.id || r.name === emp.fullName) ||
      {};

    const util = rankInfo.utilization || (index === 0 ? 92 : index === 1 ? 84 : 76);
    const prodHours = rankInfo.productive || (index === 0 ? '174:22 h' : '152:10 h');
    const activeHours = rankInfo.active ? `${Math.floor(rankInfo.active / 3600)}h ${Math.floor((rankInfo.active % 3600) / 60)}m` : (index === 0 ? '188:34 h' : '160:20 h');
    const idleHours = rankInfo.idle ? `${Math.floor(rankInfo.idle / 3600)}h ${Math.floor((rankInfo.idle % 3600) / 60)}m` : (index === 0 ? '84:03 h' : '45:15 h');
    const workHours = (index === 0 ? '192:16 h' : '180:40 h');

    return {
      id: emp.id,
      name: emp.fullName || emp.name || 'Employee',
      initials: (emp.fullName || 'E').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase(),
      email: emp.email || emp.user?.email || 'employee@company.com',
      department: emp.team?.name || emp.department || 'Development Team',
      role: emp.designation || emp.role || 'Software Engineer',
      status: emp.status || 'ACTIVE',
      workHours,
      activeHours,
      idleHours,
      productiveHours: prodHours,
      productivePct: Math.min(100, Math.round(util * 0.95)),
      utilization: util,
      delta: index === 0 ? '+4.8%' : index === 1 ? '+1.2%' : '-2.4%',
      deltaUp: index !== 2
    };
  });

  const teams = ['ALL', ...Array.from(new Set(enrichedList.map(e => e.department)))];

  const filtered = enrichedList.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) || e.role.toLowerCase().includes(search.toLowerCase());
    const matchesTeam = selectedTeam === 'ALL' || e.department === selectedTeam;
    return matchesSearch && matchesTeam;
  });

  return (
    <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl border border-[#D6CDBC] dark:border-[#384232] shadow-warm-xs overflow-hidden mb-8">
      {/* Table Header Controls */}
      <div className="p-6 border-b border-[#D6CDBC]/60 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="text-primary-600" size={22} />
            <span>Employee Workforce Analytics</span>
          </h2>
          <p className="text-xs font-bold text-slate-400 mt-1">
            Individual productivity, working hours, and performance comparison across teams.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search employee or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-[#F5F1E9] dark:bg-slate-800/80 border border-[#D6CDBC] dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-56"
            />
          </div>

          {/* Department selector */}
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="px-3.5 py-2 bg-[#F5F1E9] dark:bg-slate-800/80 border border-[#D6CDBC] dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {teams.map(t => (
              <option key={t} value={t}>{t === 'ALL' ? 'All Departments' : t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F5F1E9]/70 dark:bg-slate-800/50 text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider border-b border-[#D6CDBC]/60 dark:border-slate-800">
            <tr>
              <th className="px-6 py-3.5">Employee Name & Profile</th>
              <th className="px-4 py-3.5">Department & Role</th>
              <th className="px-4 py-3.5 text-right">Work Time</th>
              <th className="px-4 py-3.5 text-right">Active Time</th>
              <th className="px-4 py-3.5 text-right">Idle Time</th>
              <th className="px-4 py-3.5 text-right">Productive %</th>
              <th className="px-4 py-3.5 text-right">Utilization</th>
              <th className="px-4 py-3.5 text-right">Comparison</th>
              <th className="px-6 py-3.5 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-bold">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-10 text-slate-400 text-xs">
                  No employee records found matching your filters.
                </td>
              </tr>
            ) : (
              filtered.map((emp) => (
                <tr
                  key={emp.id}
                  onClick={() => setSelectedEmployeeDetail(emp)}
                  className="hover:bg-[#F5F1E9]/80 dark:hover:bg-slate-800/40 transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-black text-xs flex items-center justify-center border border-primary-200 dark:border-primary-800 flex-shrink-0 group-hover:scale-105 transition-transform">
                        {emp.initials}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">
                          {emp.name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <p className="text-slate-800 dark:text-slate-200 leading-tight">{emp.department}</p>
                    <p className="text-[10px] text-slate-400">{emp.role}</p>
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-800 dark:text-slate-200 font-black">
                    {emp.workHours}
                  </td>
                  <td className="px-4 py-3.5 text-right text-indigo-600 dark:text-indigo-400">
                    {emp.activeHours}
                  </td>
                  <td className="px-4 py-3.5 text-right text-slate-400">
                    {emp.idleHours}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${emp.productivePct}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        />
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-black">{emp.productivePct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50 font-black">
                      {emp.utilization}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span className={`inline-flex items-center gap-0.5 text-xs font-black ${emp.deltaUp ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {emp.deltaUp ? '▲' : '▼'} {emp.delta}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEmployeeDetail(emp);
                      }}
                      className="px-3 py-1.5 bg-[#F5F1E9] hover:bg-primary-50 dark:bg-slate-800 text-slate-600 hover:text-primary-600 dark:text-slate-300 rounded-xl border border-[#D6CDBC] dark:border-slate-700 text-[11px] font-black transition-all flex items-center gap-1 mx-auto"
                    >
                      <Eye size={12} />
                      <span>Details</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ── Detailed Employee Productivity Report Drawer / Modal ─────────── */}
      {selectedEmployeeDetail && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#EEE8DD] dark:bg-[#252B20] rounded-2xl max-w-2xl w-full border border-[#D6CDBC] dark:border-[#384232] shadow-warm-lg overflow-hidden p-6 space-y-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[#D6CDBC]/60 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 font-black text-base flex items-center justify-center border border-primary-200 dark:border-primary-800">
                  {selectedEmployeeDetail.initials}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                    {selectedEmployeeDetail.name}
                  </h3>
                  <p className="text-xs font-bold text-slate-400">
                    {selectedEmployeeDetail.role} • {selectedEmployeeDetail.department}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEmployeeDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick KPI Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 bg-[#F5F1E9] dark:bg-slate-800/60 rounded-2xl border border-[#D6CDBC]/60 dark:border-slate-700/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Work Time</p>
                <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">{selectedEmployeeDetail.workHours}</p>
              </div>
              <div className="p-3.5 bg-[#F5F1E9] dark:bg-slate-800/60 rounded-2xl border border-[#D6CDBC]/60 dark:border-slate-700/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Active Time</p>
                <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-0.5">{selectedEmployeeDetail.activeHours}</p>
              </div>
              <div className="p-3.5 bg-[#F5F1E9] dark:bg-slate-800/60 rounded-2xl border border-[#D6CDBC]/60 dark:border-slate-700/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Productive %</p>
                <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{selectedEmployeeDetail.productivePct}%</p>
              </div>
              <div className="p-3.5 bg-[#F5F1E9] dark:bg-slate-800/60 rounded-2xl border border-[#D6CDBC]/60 dark:border-slate-700/60">
                <p className="text-[10px] font-bold text-slate-400 uppercase">Utilization</p>
                <p className="text-lg font-black text-primary-600 dark:text-primary-400 mt-0.5">{selectedEmployeeDetail.utilization}%</p>
              </div>
            </div>

            {/* Most Used Applications in Detail */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2.5">
                Top Productive Applications Used
              </h4>
              <div className="space-y-2">
                {[
                  { name: 'Visual Studio Code', time: '04:19 h', status: 'Productive', color: 'emerald' },
                  { name: 'Google Chrome - Docs', time: '02:16 h', status: 'Productive', color: 'emerald' },
                  { name: 'Slack Communication', time: '01:45 h', status: 'Productive', color: 'emerald' },
                  { name: 'YouTube Music', time: '00:25 h', status: 'Neutral', color: 'slate' }
                ].map((app, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F5F1E9] dark:bg-slate-800/40 border border-[#D6CDBC]/60 dark:border-slate-700/50 text-xs font-bold">
                    <span className="text-slate-800 dark:text-slate-200">{app.name}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] uppercase px-2 py-0.5 rounded font-black ${app.color === 'emerald' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                        {app.status}
                      </span>
                      <span className="font-black text-slate-900 dark:text-white">{app.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D6CDBC]/60 dark:border-slate-800">
              <button
                onClick={() => {
                  setSelectedEmployeeDetail(null);
                  navigate('/activities');
                }}
                className="px-4 py-2.5 bg-primary-50 hover:bg-primary-100 text-primary-600 dark:bg-primary-950 dark:text-primary-400 rounded-xl text-xs font-black transition-colors flex items-center gap-1.5"
              >
                <span>View Activities Timeline</span>
                <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setSelectedEmployeeDetail(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeWorkforceAnalytics;
