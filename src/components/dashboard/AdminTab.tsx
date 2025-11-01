import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUser, deleteUser, getActivityLog, reauthenticate, clearActivityLog } from '../../api/firestoreApi';
import { roleMap } from '../../utils/helpers';
import { useAppContext } from '../../App';
import LogDetailModal from './LogDetailModal';
import UserForm from './UserForm';
import * as XLSX from 'xlsx';
import DeleteConfirmationModal from './DeleteConfirmationModal';

const AdminTab = () => {
            const { showModal, hideModal, user } = useAppContext();
            const [activeSubTab, setActiveSubTab] = useState('users'); // 'users', 'history', 'repairHistory', 'approvalHistory', 'borrowHistory'
            const [users, setUsers] = useState<any[]>([]);
            const [activityLog, setActivityLog] = useState<any[]>([]);
            const [loading, setLoading] = useState(true);
            const [search, setSearch] = useState('');
            const [roleFilter, setRoleFilter] = useState('');
            const [statusFilter, setStatusFilter] = useState('');
            const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
            const [selectedAdminToViewLogs, setSelectedAdminToViewLogs] = useState<string>(''); // Re-implement state for filtering logs
        
        
            const [historyDateFilter, setHistoryDateFilter] = useState('');
        
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [userList, logList] = await Promise.all([
                        getAllUsers(), 
                        getActivityLog(historyDateFilter, user?.isMainAccount, user?.uid, selectedAdminToViewLogs) // Pass selectedAdminToViewLogs again
                    ]);
                    setUsers(userList);
                    setActivityLog(logList);
                } catch (error) {
                    console.error("Error fetching admin data:", error);
                }
                setLoading(false);
            };
        
            useEffect(() => {
                fetchData();
            }, [historyDateFilter, selectedAdminToViewLogs]); // Add selectedAdminToViewLogs to dependencies
        
            const handleRoleChange = async (uid: string, newRole: string) => {
                if (!window.confirm(`เปลี่ยนบทบาทของผู้ใช้เป็น ${roleMap[newRole]} หรือไม่?`)) return;
                try {
                    await updateUser(uid, { role: newRole });
                    fetchData();
                    alert('อัปเดตบทบาทเรียบร้อย');
                } catch (error) {
                    console.error("Failed to update role:", error);
                    alert('เกิดข้อผิดพลาดในการอัปเดตบทบาท');
                }
            };
        
            const handleDeleteUser = (uid: string) => {
                showModal('ยืนยันการลบผู้ใช้', 
                    <DeleteConfirmationModal 
                        onCancel={hideModal} 
                        onConfirm={async (reason) => {
                            try {
                                await deleteUser(uid, reason);
                                fetchData();
                                hideModal();
                                alert('ลบผู้ใช้และบันทึกเหตุผลเรียบร้อย');
                            } catch (error) {
                                console.error("Failed to delete user:", error);
                                alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
                            }
                        }}
                    />
                );
            };
        
            const handleDeleteSelected = () => {
                showModal('ยืนยันการลบผู้ใช้ที่เลือก', 
                    <DeleteConfirmationModal
                        onCancel={hideModal}
                        onConfirm={async (reason) => {
                            try {
                                await Promise.all(selectedUsers.map(uid => deleteUser(uid, reason)));
                                fetchData();
                                setSelectedUsers([]);
                                hideModal();
                                alert('ลบผู้ใช้ที่เลือกและบันทึกเหตุผลเรียบร้อย');
                            } catch (error) {
                                console.error("Failed to delete selected users:", error);
                                alert('เกิดข้อผิดพลาดในการลบผู้ใช้ที่เลือก');
                            }
                        }}
                    />
                );
            };
        
            const handleSelectUser = (uid: string) => {
                setSelectedUsers(prev =>
                    prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
                );
            };
        
            const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.checked) {
                    setSelectedUsers(filteredUsers.map(user => user.id));
                } else {
                    setSelectedUsers([]);
                }
            };
        
            const handleAddUser = () => {
                showModal('เพิ่มผู้ใช้ใหม่', <UserForm users={users} onSuccess={() => { fetchData(); hideModal(); }} />);
            };
        
            const handleEditUser = (user: any) => {
                showModal('แก้ไขข้อมูลผู้ใช้', <UserForm user={user} users={users} onSuccess={() => { fetchData(); hideModal(); }} />);
            };
        
            const showDetailsModal = (logEntry: any) => {
                showModal('รายละเอียดการกระทำ', <LogDetailModal log={logEntry} key={logEntry.id} />);
            };
        
            const filteredUsers = users.filter(user => {
                const searchLower = search.toLowerCase();
                const statusMatch = statusFilter === '' ? user.status !== 'deleted' : user.status === statusFilter;
                return (
                    (roleFilter === '' || user.role === roleFilter) &&
                    statusMatch &&
                    (search === '' || 
                     user.name?.toLowerCase().includes(searchLower) || 
                     user.email?.toLowerCase().includes(searchLower))
                );
            });
        
            const handleExport = () => {
                const worksheet = XLSX.utils.json_to_sheet(activityLog.map(log => ({
                    Timestamp: log.timestamp?.toDate().toLocaleString(),
                    Admin: log.adminName,
                    Action: log.action,
                    Details: JSON.stringify(log.details, null, 2)
                })));
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Activity Log");
                XLSX.writeFile(workbook, "activity_log.xlsx");
            };
        
            const handleClearHistory = async () => {
                const password = prompt("โปรดยืนยันรหัสผ่านของคุณเพื่อล้างประวัติ:");
                if (!password) return;
        
                try {
                    await reauthenticate(password);
                } catch (error) {
                    alert("การยืนยันตัวตนล้มเหลว โปรดตรวจสอบรหัสผ่านของคุณ");
                    return;
                }
        
                if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างประวัติการทำงานทั้งหมด? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
                    try {
                        await clearActivityLog();
                        alert("ล้างประวัติการทำงานทั้งหมดเรียบร้อยแล้ว");
                        fetchData(); // Refresh the data
                    } catch (error) {
                        console.error("Error clearing activity log:", error);
                        alert("เกิดข้อผิดพลาดในการล้างประวัติ");
                    }
                }
            };
        
            const renderUserManagement = () => (
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล" className="px-3 py-2 rounded-lg border border-slate-200 text-sm" />
                            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
                                <option value="">ทุกบทบาท</option>
                                {Object.entries(roleMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
                                <option value="">ทุกสถานะ</option>
                                <option value="active">ใช้งาน</option>
                                <option value="pending_approval">รออนุมัติ</option>
                                <option value="deleted">ถูกลบ</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleAddUser} className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm">เพิ่มผู้ใช้ใหม่</button>
                            <button onClick={handleDeleteSelected} disabled={selectedUsers.length === 0} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm disabled:opacity-50">ลบรายการที่เลือก</button>
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh] pr-2 -mr-2">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                                <tr>
                                    <th scope="col" className="p-4">
                                        <div className="flex items-center">
                                            <input id="checkbox-all-search" type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                            <label htmlFor="checkbox-all-search" className="sr-only">checkbox</label>
                                        </div>
                                    </th>
                                    <th scope="col" className="px-4 py-3">ชื่อ-สกุล</th>
                                    <th scope="col" className="px-4 py-3">บทบาท</th>
                                    <th scope="col" className="px-4 py-3">สถานะ</th>
                                    <th scope="col" className="px-4 py-3">อีเมล</th>
                                    <th scope="col" className="px-4 py-3">จัดการ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(user => (
                                    <tr key={user.id} className="bg-white border-b hover:bg-gray-50">
                                        <td className="w-4 p-4">
                                            <div className="flex items-center">
                                                <input id={`checkbox-table-search-${user.id}`} type="checkbox" onChange={() => handleSelectUser(user.id)} checked={selectedUsers.includes(user.id)} className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500" />
                                                <label htmlFor={`checkbox-table-search-${user.id}`} className="sr-only">checkbox</label>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-medium text-slate-900">{user.name}</td>
                                        <td className="px-4 py-2">
                                            <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)} className="p-1 rounded-md border-slate-300 text-xs">
                                                {Object.entries(roleMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : user.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800' : 'bg-slate-200 text-slate-600'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">{user.email}</td>
                                        <td className="px-4 py-2">
                                           <button onClick={() => handleEditUser(user)} className="text-xs text-indigo-600 hover:underline">แก้ไข</button>
                                           <button onClick={() => handleDeleteUser(user.id)} className="text-xs text-red-600 hover:underline ml-2">ลบ</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        
            const renderHistoryLog = () => (
                <div>
                    <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                        <div className="flex items-center">
                            <label htmlFor="history-date" className="mr-2 text-sm font-medium text-gray-700">เลือกวันที่:</label>
                            <input 
                                type="date" 
                                id="history-date" 
                                value={historyDateFilter} 
                                onChange={e => setHistoryDateFilter(e.target.value)} 
                                className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                            />
                        </div>
                        {user?.isMainAccount && (
                            <div className="flex items-center">
                                <label htmlFor="filter-admin" className="mr-2 text-sm font-medium text-gray-700">กรองตามผู้ดูแล:</label>
                                <select
                                    id="filter-admin"
                                    value={selectedAdminToViewLogs}
                                    onChange={e => setSelectedAdminToViewLogs(e.target.value)}
                                    className="px-3 py-2 rounded-lg border border-slate-200 text-sm"
                                >
                                    <option value="">ทั้งหมด</option>
                                    {users.filter(u => ['admin', 'approver', 'technician'].includes(u.role)).map(adminUser => (
                                        <option key={adminUser.id} value={adminUser.id}>{adminUser.name} ({adminUser.role})</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <button onClick={handleExport} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 text-sm">Export to Excel</button>
                            <button onClick={handleClearHistory} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-sm">Clear History</button>
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[70vh]">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">เวลา</th>
                                    <th scope="col" className="px-4 py-3">ผู้ดำเนินการ</th>
                                    <th scope="col" className="px-4 py-3">การกระทำ</th>
                                    <th scope="col" className="px-4 py-3">รายละเอียด</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityLog.map(logEntry => (
                                    <tr key={logEntry.id} className="bg-white border-b">
                                        <td className="px-4 py-2 text-xs text-slate-500">{logEntry.timestamp?.toDate().toLocaleString() || 'N/A'}</td>
                                        <td className="px-4 py-2 font-medium text-slate-900">{logEntry.adminName}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-100 text-slate-800">{logEntry.action}</span>
                                        </td>
                                        <td className="px-4 py-2">
                                            <button onClick={() => showDetailsModal(logEntry)} className="font-medium text-blue-600 hover:underline">ดูรายละเอียด</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        
            if (loading) return <p>Loading admin data...</p>;
        
            return (
                <div className="tab-content">
                    <div className="card rounded-2xl p-6 text-slate-900">
                        <div className="flex border-b mb-4">
                            {user?.role === 'admin' && (
                                <button onClick={() => setActiveSubTab('users')} className={`px-4 py-2 font-semibold ${activeSubTab === 'users' ? 'border-b-2 border-indigo-500' : 'text-slate-500'}`}>จัดการผู้ใช้</button>
                            )}
                            {user?.role === 'admin' && (
                                <button onClick={() => setActiveSubTab('history')} className={`px-4 py-2 font-semibold ${activeSubTab === 'history' ? 'border-b-2 border-indigo-500' : 'text-slate-500'}`}>ประวัติการทำงาน</button>
                            )}
                            {user?.role === 'technician' && (
                                <button onClick={() => setActiveSubTab('repairHistory')} className={`px-4 py-2 font-semibold ${activeSubTab === 'repairHistory' ? 'border-b-2 border-indigo-500' : 'text-slate-500'}`}>ประวัติการซ่อม</button>
                            )}
                            {user?.role === 'approver' && (
                                <button onClick={() => setActiveSubTab('approvalHistory')} className={`px-4 py-2 font-semibold ${activeSubTab === 'approvalHistory' ? 'border-b-2 border-indigo-500' : 'text-slate-500'}`}>ประวัติการอนุมัติ</button>
                            )}
                            {user?.role === 'user' && (
                                <button onClick={() => setActiveSubTab('borrowHistory')} className={`px-4 py-2 font-semibold ${activeSubTab === 'borrowHistory' ? 'border-b-2 border-indigo-500' : 'text-slate-500'}`}>ประวัติการยืม</button>
                            )}
                        </div>
                        {activeSubTab === 'users' && user?.role === 'admin' && renderUserManagement()}
                        {activeSubTab === 'history' && user?.role === 'admin' && renderHistoryLog()}
                        {activeSubTab === 'repairHistory' && user?.role === 'technician' && <RepairHistoryTab userId={user.uid} />}
                        {activeSubTab === 'approvalHistory' && user?.role === 'approver' && <ApprovalHistoryTab userId={user.uid} />}
                        {activeSubTab === 'borrowHistory' && user?.role === 'user' && <BorrowHistoryTab userId={user.uid} />}
            </div>
        </div>
    );
};

export default AdminTab;
