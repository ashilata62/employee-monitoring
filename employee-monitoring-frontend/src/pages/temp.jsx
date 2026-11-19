                                                        <div className="h-9 w-9 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center">
                                                            {emp.avatar ? (
                                                                <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover"
                                                                    onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                                                />
                                                            ) : null}
                                                            <span className={`text-[10px] font-black text-primary-700 dark:text-primary-300 ${emp.avatar ? 'hidden' : 'flex'}`}>
                                                                {emp.initials || (emp.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                                                            </span>
                                                        </div>
                                                        <span className="font-bold text-slate-800 dark:text-white">{emp.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">{formatHours(emp.totalWorkHours || 0)}</td>
                                                <td className="px-6 py-4">{formatHours(emp.manualHours || 0)}</td>
                                                <td className="px-6 py-4">{formatHours(emp.computerActivityHours || 0)}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate max-w-[150px]" title={emp.status === 'offline' ? 'Offline' : emp.activeWindow}>
                                                            {emp.status === 'offline' ? 'Offline' : (emp.activeApp || 'Active')}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 truncate max-w-[150px]">
                                                            {emp.status === 'offline' ? 'No recent activity' : (emp.activeWindow || 'In progress...')}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                                        <MapPin size={12} className="text-rose-400" />
                                                        <span className="font-medium">{emp.location || 'Remote'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">{emp.team || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                                        emp.status === 'online' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                                        emp.status === 'idle' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                                        emp.status === 'break' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                                        'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                                    }`}>
                                                        <span className={`h-1.5 w-1.5 rounded-full ${statusColors[emp.status] || statusColors.offline}`} />
                                                        {emp.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${emp.productivityScore || 0}%` }} />
                                                        </div>
                                                        <span className="font-black text-slate-700 dark:text-slate-300 min-w-[32px]">{emp.productivityScore || 0}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex-1 max-w-[80px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                            <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${emp.utilizationScore || 0}%` }} />
                                                        </div>
                                                        <span className="font-black text-slate-700 dark:text-slate-300 min-w-[32px]">{emp.utilizationScore || 0}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                     <div className="flex justify-center gap-2">
                                                        <button 
                                                            onClick={() => navigate(`${rolePath}/screenshots?employee=${emp.id}`)}
                                                            className="p-2 bg-emerald-500 text-white rounded-lg hover:scale-110 transition-transform shadow-md"
                                                            title="View Screenshots"
                                                        >
                                                            <Video size={14} />
                                                        </button>
                                                     </div>
                                                 </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filtered.length === 0 && (
                                    <div className="py-16 text-center text-slate-400 font-bold text-sm">No employees match your search.</div>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* Grid View */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {filtered.length === 0 ? (
                                <div className="col-span-full py-16 text-center text-slate-400 font-bold text-sm">No employees match your search.</div>
                            ) : filtered.map((emp) => (
                                <div key={emp.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 flex flex-col gap-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-primary-100 dark:bg-primary-950/40 flex items-center justify-center">
                                                {emp.avatar ? (
                                                    <img src={emp.avatar} alt={emp.name} className="w-full h-full object-cover"
                                                        onError={e => { e.target.style.display='none'; e.target.nextSibling.style.display='flex'; }}
                                                    />
                                                ) : null}
                                                <span className={`text-[10px] font-black text-primary-700 dark:text-primary-300 ${emp.avatar ? 'hidden' : 'flex'}`}>
                                                    {emp.initials || (emp.name || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                                                </span>
                                            </div>
                                            <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${statusColors[emp.status] || statusColors.offline}`} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-sm text-slate-900 dark:text-white truncate">{emp.name}</p>
                                            <p className="text-[11px] font-semibold text-slate-400 truncate">{emp.team || '—'}</p>
                                        </div>
                                        <span className={`ml-auto shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                            emp.status === 'online' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' :
                                            emp.status === 'idle' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' :
                                            emp.status === 'break' ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400' :
                                            'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                        }`}>
                                            <span className={`h-1.5 w-1.5 rounded-full ${statusColors[emp.status] || statusColors.offline}`} />
                                            {emp.status}
                                        </span>
                                    </div>

                                    {/* Activity and Location */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 flex flex-col gap-1.5 border border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-tight">
                                            <Activity size={10} className="text-primary-600" />
                                            <span className="truncate max-w-[100px]">{emp.status === 'offline' ? 'Offline' : (emp.activeApp || 'Idle')}</span>
                                            <span className="text-slate-300 dark:text-slate-700">|</span>
                                            <MapPin size={10} className="text-rose-400" />
                                            <span className="truncate max-w-[70px]">{emp.location || 'Remote'}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 truncate italic px-1">
                                            {emp.status === 'offline' ? 'No recent activity' : (emp.activeWindow || 'Waiting for activity...')}
                                        </p>
                                    </div>


                                    <div className="space-y-2">
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                                <span>Productivity</span><span className="text-primary-600">{emp.productivityScore || 0}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${emp.productivityScore || 0}%` }} />
                                            </div>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-500 mb-1">
                                                <span>Utilization</span><span className="text-indigo-500">{emp.utilizationScore || 0}%</span>
                                            </div>
                                            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-400 rounded-full transition-all" style={{ width: `${emp.utilizationScore || 0}%` }} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-auto pt-2">
                                        <button 
                                            onClick={() => navigate(`${rolePath}/screenshots?employee=${emp.id}`)}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-lg text-xs font-black shadow-md hover:bg-emerald-600 transition-colors"
                                        >
                                            <Video size={14} /> VIEW SCREENSHOTS
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            ) : (
                <LiveMapView />
            )}

            <AddEmployeeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddEmployee} />
        </div>
    );
}
