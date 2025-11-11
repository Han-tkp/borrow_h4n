import React, { useState } from 'react';
import { createUserByAdmin, updateUser } from '../../api/firestoreApi';
import { roleMap } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';
import ReactivateUserModal from './ReactivateUserModal';

const UserForm = ({ user, users, onSuccess }) => {
    const { showModal, hideModal } = useAppContext();
    const [name, setName] = useState(user ? user.name : '');
    const [email, setEmail] = useState(user ? user.email : '');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState(user ? user.role : 'user');
    const [agency, setAgency] = useState(user ? user.agency : '');
    const [address, setAddress] = useState(user ? user.address : '');
    const [phoneNumber, setPhoneNumber] = useState(user ? user.phone_number : '');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            if (user) {
                // Edit user
                await updateUser(user.id, { name, email, role, agency, address, phone_number: phoneNumber });
                alert('อัปเดตข้อมูลผู้ใช้เรียบร้อย');
            } else {
                // Add user
                const existingUser = users.find(u => u.email === email);
                if (existingUser) {
                    if (existingUser.status === 'deleted') {
                        showModal('เปิดใช้งานบัญชีผู้ใช้', 
                            <ReactivateUserModal
                                onCancel={hideModal}
                                onConfirm={async () => {
                                    try {
                                        await updateUser(existingUser.id, { status: 'active' });
                                        alert('เปิดใช้งานบัญชีผู้ใช้เรียบร้อย');
                                        onSuccess();
                                        hideModal();
                                    } catch (err) {
                                        setError(err.message);
                                        alert('เกิดข้อผิดพลาดในการเปิดใช้งานบัญชี: ' + err.message);
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            />
                        );
                        return;
                    } else {
                        alert('มีผู้ใช้ที่มีอีเมลนี้อยู่แล้ว');
                        setLoading(false);
                        return;
                    }
                } else {
                    await createUserByAdmin(email, password, name, { role, agency, address, phone_number: phoneNumber });
                    alert('เพิ่มผู้ใช้ใหม่เรียบร้อย');
                }
            }
            onSuccess();
        } catch (err) {
            setError(err.message);
            alert('เกิดข้อผิดพลาด: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">ชื่อ-สกุล</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">หน่วยงาน</label>
                <input
                    type="text"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">ที่อยู่หน่วยงาน</label>
                <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                ></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">เบอร์โทรศัพท์</label>
                <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">อีเมล</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    required
                    disabled={!!user}
                />
            </div>
            {!user && (
                <div>
                    <label className="block text-sm font-medium text-gray-700">รหัสผ่าน</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        required
                    />
                </div>
            )}
            <div>
                <label className="block text-sm font-medium text-gray-700">บทบาท</label>
                <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                    {Object.entries(roleMap).map(([key, value]) => (
                        <option key={key} value={key}>{value}</option>
                    ))}
                </select>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end">
                <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={loading}
                >
                    {loading ? 'กำลังบันทึก...' : 'บันทึก'}
                </button>
            </div>
        </form>
    );
};

export default UserForm;