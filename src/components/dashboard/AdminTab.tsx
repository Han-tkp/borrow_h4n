import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUser, deleteUser, getActivityLog } from '../../api/firestoreApi';
import { roleMap } from '../../utils/helpers';
import { useAppContext } from '../../App';
import LogDetailModal from './LogDetailModal';

const AdminTab = () => {
    const { showModal } = useAppContext();
    const [activeSubTab, setActiveSubTab] = useState('users'); // 'users' or 'history'
    const [users, setUsers] = useState<any[]>([]);
    const [activityLog, setActivityLog] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [userList, logList] = await Promise.all([getAllUsers(), getActivityLog()]);
            setUsers(userList);
            setActivityLog(logList);
        } catch (error) {
            console.error("Error fetching admin data:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

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

    const handleDeleteUser = async (uid: string) => {
        const reason = window.prompt('โปรดระบุเหตุผลในการลบผู้ใช้ (สถานะจะเปลี่ยนเป็น deleted):');
        if (reason) {
            try {
                await deleteUser(uid, reason);
                fetchData();
                alert('ลบผู้ใช้และบันทึกเหตุผลเรียบร้อย');
            } catch (error) {
                console.error("Failed to delete user:", error);
                alert('เกิดข้อผิดพลาดในการลบผู้ใช้');
            }
        }
    };

    const showDetailsModal = (logEntry: any) => {
        showModal('รายละเอียดการกระทำ', <LogDetailModal log={logEntry} key={logEntry.id} />);
    };

    const filteredUsers = users.filter(user => {
        const searchLower = search.toLowerCase();
        return (
            (roleFilter === '' || user.role === roleFilter) &&
            (statusFilter === '' || user.status === statusFilter) &&
            (search === '' || 
             user.name?.toLowerCase().includes(searchLower) || 
             user.email?.toLowerCase().includes(searchLower))
        );
    });

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
                <button className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm">เพิ่มผู้ใช้ใหม่</button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] pr-2 -mr-2">
                <table className="w-full text-sm text-left text-slate-500">
                    <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                        <tr>
                            <th scope="col" className="px-4 py-3">ชื่อ-สกุล</th>
                            <th scope="col" className="px-4 py-3">บทบาท</th>
                            <th scope="col" className="px-4 py-3">สถานะ</th>
                            <th scope="col" className="px-4 py-3">อีเมล</th>
                            <th scope="col" className="px-4 py-3">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(user => (
                            <tr key={user.id} className="bg-white border-b">
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
    );

    if (loading) return <p>Loading admin data...</p>;

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <div className="flex border-b mb-4">
                    <button onClick={() => setActiveSubTab('users')} className={`px-4 py-2 font-semibold ${activeSubTab === 'users' ? 'border-b-2 border-indigo-500' : 'text-slate-500'}`}>จัดการผู้ใช้</button>
                    <button onClick={() => setActiveSubTab('history')} className={`px-4 py-2 font-semibold ${activeSubTab === 'history' ? 'border-b-2 border-indigo-500' : 'text-slate-500'}`}>ประวัติการทำงาน</button>
                </div>
                {activeSubTab === 'users' ? renderUserManagement() : renderHistoryLog()}
            </div>
        </div>
    );
};

export default AdminTab;
