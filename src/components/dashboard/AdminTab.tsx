import React, { useState, useEffect } from 'react';
import { getAllUsers, updateUser, deleteUser, recoverUser, getActivityLog, reauthenticate, clearActivityLog, clearAssessmentHistory, clearBorrowHistory, clearRepairHistory, deleteAllUsersExceptAdmin, clearEquipmentData, clearEquipmentTypes, clearStandardAssessments, clearAllStorage } from '../../api/firestoreApi';
import { roleMap } from '../../utils/helpers';
import { useAppContext } from '../../App';
import LogDetailModal from './LogDetailModal';
import UserForm from './UserForm';
import * as XLSX from 'xlsx';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import UserDetailModal from './UserDetailModal';

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
                        getActivityLog(historyDateFilter, user?.isMainAccount, selectedAdminToViewLogs) // Pass selectedAdminToViewLogs as adminIdToFilter
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
                                alert('ปิดใช้งานผู้ใช้และบันทึกเหตุผลเรียบร้อย');
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
                                alert('ปิดใช้งานผู้ใช้ที่เลือกและบันทึกเหตุผลเรียบร้อย');
                            } catch (error) {
                                console.error("Failed to delete selected users:", error);
                                alert('เกิดข้อผิดพลาดในการลบผู้ใช้ที่เลือก');
                            }
                        }}
                    />
                );
            };
        
            const handleRecoverUser = async (uid: string) => {
                if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการกู้คืนบัญชีผู้ใช้นี้?')) return;
                try {
                    await recoverUser(uid);
                    fetchData();
                    alert('กู้คืนบัญชีผู้ใช้เรียบร้อย');
                } catch (error) {
                    console.error("Failed to recover user:", error);
                    alert('เกิดข้อผิดพลาดในการกู้คืนบัญชีผู้ใช้');
                }
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

            const handleViewUser = (user: any) => {
                showModal('รายละเอียดผู้ใช้', <UserDetailModal userId={user.id} onClose={hideModal} />);
            };
        
            const showDetailsModal = (logEntry: any) => {
                showModal('รายละเอียดการกระทำ', <LogDetailModal log={logEntry} key={logEntry.id} />);
            };
        
            const filteredUsers = users.filter(user => {
                const searchLower = search.toLowerCase();
                const statusMatch = statusFilter === '' ? user.status !== 'deleted' && user.status !== 'pending_approval' : user.status === statusFilter;
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
        


            const handleClearAllData = async () => {
                const password = prompt("โปรดยืนยันรหัสผ่านของคุณเพื่อล้างข้อมูลทั้งหมด:");
                if (!password) return;
        
                try {
                    await reauthenticate(password);
                } catch (error) {
                    alert("การยืนยันตัวตนล้มเหลว โปรดตรวจสอบรหัสผ่านของคุณ");
                    return;
                }
        
                if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการล้างข้อมูลทั้งหมดในระบบ (ประวัติทั้งหมดและผู้ใช้ทั้งหมด ยกเว้นบัญชี Admin ปัจจุบัน)? การกระทำนี้ไม่สามารถย้อนกลับได้")) {
                    try {
                        await Promise.all([
                            clearActivityLog(),
                            clearAssessmentHistory(),
                            clearBorrowHistory(),
                            clearRepairHistory(),
                            clearEquipmentData(),
                            clearEquipmentTypes(),
                            clearStandardAssessments(),
                            clearAllStorage(), // Clear Firebase Storage
                            deleteAllUsersExceptAdmin(user.uid) // Delete all users except the current admin
                        ]);
                        alert("ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว (ยกเว้นบัญชี Admin)");
                        fetchData(); // Refresh the data
                    } catch (error) {
                        console.error("Error clearing all data:", error);
                        alert("เกิดข้อผิดพลาดในการล้างข้อมูลทั้งหมด");
                    }
                }
            };
        
            const renderUserManagement = () => (
                <div>
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 flex-wrap">
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อหรืออีเมล" className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm" />
                            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm">
                                <option value="">ทุกบทบาท</option>
                                {Object.entries(roleMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm">
                                <option value="">ทุกสถานะ</option>
                                <option value="active">ใช้งาน</option>
                                <option value="deleted">ถูกลบ</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handleAddUser} className="px-4 py-2 rounded-lg bg-[var(--primary-color)] text-white hover:opacity-90 text-sm">เพิ่มผู้ใช้ใหม่</button>
                            <button onClick={handleDeleteSelected} disabled={selectedUsers.length === 0} className="px-4 py-2 rounded-lg bg-[var(--danger-color)] text-white hover:opacity-80 text-sm disabled:opacity-50">ปิดใช้งานรายการที่เลือก</button>
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[60vh] pr-2 -mr-2">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-600 uppercase bg-gray-50">
                                <tr>
                                    <th scope="col" className="p-4">
                                        <div className="flex items-center">
                                            <input id="checkbox-all-search" type="checkbox" onChange={handleSelectAll} checked={selectedUsers.length > 0 && selectedUsers.length === filteredUsers.length} className="w-4 h-4 text-[var(--primary-color)] bg-gray-100 border-[var(--border-color)] rounded focus:ring-[var(--primary-color)]" />
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
                                                <input id={`checkbox-table-search-${user.id}`} type="checkbox" onChange={() => handleSelectUser(user.id)} checked={selectedUsers.includes(user.id)} className="w-4 h-4 text-[var(--primary-color)] bg-gray-100 border-[var(--border-color)] rounded focus:ring-[var(--primary-color)]" />
                                                <label htmlFor={`checkbox-table-search-${user.id}`} className="sr-only">checkbox</label>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 font-medium text-[var(--text-color-dark)]">{user.name}</td>
                                        <td className="px-4 py-2">
                                            <select value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)} className="p-1 rounded-md border-[var(--border-color)] text-xs">
                                                {Object.entries(roleMap).map(([key, value]) => <option key={key} value={key}>{value}</option>)}
                                            </select>
                                        </td>
                                        <td className="px-4 py-2">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.status === 'active' ? 'bg-green-100 text-green-800' : user.status === 'deleted' ? 'bg-gray-200 text-gray-600' : ''}`}>
                                                {user.status === 'deleted' ? 'ถูกลบ' : user.status === 'active' ? 'ใช้งาน' : ''}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">{user.email}</td>
                                        <td className="px-4 py-2">
                                           <button onClick={() => handleViewUser(user)} className="text-xs text-blue-600 hover:underline">ดูรายละเอียด</button>
                                           <button onClick={() => handleEditUser(user)} className="text-xs text-[var(--primary-color)] hover:underline ml-2">แก้ไข</button>
                                           {user.status !== 'deleted' ? (
                                                <button onClick={() => handleDeleteUser(user.id)} className="text-xs text-[var(--danger-color)] hover:underline ml-2">ปิดใช้งาน</button>
                                           ) : (
                                                <button onClick={() => handleRecoverUser(user.id)} className="text-xs text-[var(--success-color)] hover:underline ml-2">กู้คืน</button>
                                           )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        
            const actionMap = {
                'DELETE_EQUIPMENT': 'ลบอุปกรณ์',
                'BATCH_DELETE_EQUIPMENT': 'ลบอุปกรณ์หลายรายการ',
                'ADD_EQUIPMENT': 'เพิ่มอุปกรณ์',
                'BATCH_UPDATE_STATUS': 'อัปเดตสถานะหลายรายการ',
                'IMPORT_EQUIPMENT': 'นำเข้าข้อมูลอุปกรณ์',
                'CREATE_USER': 'เพิ่มผู้ใช้',
                'DELETE_USER': 'ลบผู้ใช้',
                'UPDATE_USER': 'แก้ไขข้อมูลผู้ใช้',
                'CREATE_BORROW_REQUEST': 'สร้างคำขอยืม',
                'APPROVE_BORROW': 'อนุมัติคำขอยืม',
                'REJECT_BORROW': 'ปฏิเสธคำขอยืม',
                'APPROVE_REPAIR': 'อนุมัติการซ่อม',
                'REJECT_REPAIR': 'ปฏิเสธการซ่อม',
                'APPROVE_AND_AUTO_ASSIGN_BORROW': 'อนุมัติและจ่ายเครื่อง',
                'PROCESS_RETURN': 'รับคืนเครื่อง',
                'CONFIRM_DELIVERY': 'ยืนยันการส่งมอบ',
                'COMPLETE_REPAIR': 'ซ่อมเสร็จสิ้น',
                'CHANGE_EQUIPMENT_AND_DELIVER': 'เปลี่ยนเครื่องและส่งมอบ',
                'POST_ASSESSMENT': 'ตรวจสภาพหลังคืน',
                'CREATE_REPAIR_REQUEST_FROM_ASSESSMENT': 'สร้างคำขอซ่อม (หลังตรวจ)',
                'CLEAR_ACTIVITY_LOG': 'ล้างประวัติการทำงาน',
                'CLEAR_ASSESSMENT_HISTORY': 'ล้างประวัติการประเมิน',
                'CLEAR_BORROW_HISTORY': 'ล้างประวัติการยืม',
                'CLEAR_REPAIR_HISTORY': 'ล้างประวัติการซ่อม',
                'CLEAR_EQUIPMENT_DATA': 'ล้างข้อมูลอุปกรณ์',
                'CLEAR_EQUIPMENT_TYPES': 'ล้างข้อมูลประเภทอุปกรณ์',
                'CLEAR_STANDARD_ASSESSMENTS': 'ล้างประวัติการประเมินมาตรฐาน',
                'DELETE_ALL_USERS_EXCEPT_ADMIN': 'ล้างข้อมูลผู้ใช้ทั้งหมด',
                'RECOVER_USER': 'กู้คืนบัญชีผู้ใช้',
                'STANDARD_ASSESSMENT': 'ตรวจเช็คมาตรฐาน'
            };

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
                                className="px-3 py-2 rounded-lg border border-[var(--border-color)] text-sm"                            />
                        </div>
                        {user?.role === 'admin' && (
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
                            <button onClick={handleClearAllData} className="px-4 py-2 rounded-lg bg-red-700 text-white hover:opacity-90 text-sm">ล้างทั้งระบบ (ลบข้อมูลทั้งหมด ยกเว้นบัญชี Admin)</button>
                        </div>
                    </div>
                    <div className="overflow-y-auto max-h-[70vh]">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-gray-600 uppercase bg-gray-50 sticky top-0">
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
                                        <td className="px-4 py-2 text-xs text-gray-500">{logEntry.timestamp?.toDate().toLocaleString() || 'N/A'}</td>
                                        <td className="px-4 py-2 font-medium text-[var(--text-color-dark)]">{logEntry.adminName}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                                                {actionMap[logEntry.action] || logEntry.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2">
                                            {['CREATE_USER', 'DELETE_USER', 'UPDATE_USER', 'ADD_EQUIPMENT', 'DELETE_EQUIPMENT', 'BATCH_DELETE_EQUIPMENT', 'IMPORT_EQUIPMENT', 'BATCH_UPDATE_STATUS', 'CREATE_BORROW_REQUEST', 'APPROVE_BORROW', 'REJECT_BORROW', 'APPROVE_REPAIR', 'REJECT_REPAIR', 'APPROVE_AND_AUTO_ASSIGN_BORROW', 'PROCESS_RETURN', 'CONFIRM_DELIVERY', 'COMPLETE_REPAIR', 'CHANGE_EQUIPMENT_AND_DELIVER', 'POST_ASSESSMENT', 'CREATE_REPAIR_REQUEST_FROM_ASSESSMENT'].includes(logEntry.action) && (
                                                <button onClick={() => showDetailsModal(logEntry)} className="font-medium text-[var(--primary-color)] hover:underline">ดูรายละเอียด</button>
                                            )}
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
                    <div className="bg-white rounded-2xl p-6 text-[var(--text-color-dark)]">
                        <div className="flex border-b mb-4">
                            {user?.role === 'admin' && (
                                <button onClick={() => setActiveSubTab('users')} className={`px-4 py-2 font-semibold ${activeSubTab === 'users' ? 'bg-[var(--primary-color)] text-white rounded-t-lg' : 'text-gray-600 hover:bg-gray-100 rounded-t-lg'}`}>จัดการผู้ใช้</button>
                            )}
                            {user?.role === 'admin' && (
                                <button onClick={() => setActiveSubTab('history')} className={`px-4 py-2 font-semibold ${activeSubTab === 'history' ? 'bg-[var(--primary-color)] text-white rounded-t-lg' : 'text-gray-600 hover:bg-gray-100 rounded-t-lg'}`}>ประวัติการทำงาน</button>
                            )}
                            {user?.role === 'technician' && (
                                <button onClick={() => setActiveSubTab('repairHistory')} className={`px-4 py-2 font-semibold ${activeSubTab === 'repairHistory' ? 'bg-[var(--primary-color)] text-white rounded-t-lg' : 'text-gray-600 hover:bg-gray-100 rounded-t-lg'}`}>ประวัติการซ่อม</button>
                            )}
                            {user?.role === 'approver' && (
                                <button onClick={() => setActiveSubTab('approvalHistory')} className={`px-4 py-2 font-semibold ${activeSubTab === 'approvalHistory' ? 'bg-[var(--primary-color)] text-white rounded-t-lg' : 'text-gray-600 hover:bg-gray-100 rounded-t-lg'}`}>ประวัติการอนุมัติ</button>
                            )}
                            {user?.role === 'user' && (
                                <button onClick={() => setActiveSubTab('borrowHistory')} className={`px-4 py-2 font-semibold ${activeSubTab === 'borrowHistory' ? 'bg-[var(--primary-color)] text-white rounded-t-lg' : 'text-gray-600 hover:bg-gray-100 rounded-t-lg'}`}>ประวัติการยืม</button>
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
