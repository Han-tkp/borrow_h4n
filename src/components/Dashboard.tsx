import React, { useState, useEffect } from 'react';
import { useAppContext } from '../App';
import EquipmentTab from './dashboard/EquipmentTab';
import BorrowTab from './dashboard/BorrowTab';
import BorrowHistoryTab from './dashboard/BorrowHistoryTab';
import TechTab from './dashboard/TechTab';
import DeliveryTab from './dashboard/DeliveryTab';
import RepairHistoryTab from './dashboard/RepairHistoryTab';
import ApprovalTab from './dashboard/ApprovalTab';
import ApprovalHistoryTab from './dashboard/ApprovalHistoryTab';
import AssessmentTab from './dashboard/AssessmentTab';
import ReportTab from './dashboard/ReportTab';
import AdminTab from './dashboard/AdminTab';
import ProfileTab from './dashboard/ProfileTab';
import StandardAssessmentHistoryTab from './dashboard/StandardAssessmentHistoryTab';


// Placeholder for all tab definitions
const allTabs = [
    { id: 'profileTab', label: 'ข้อมูลส่วนตัว', roles: ['admin', 'user', 'technician', 'approver'] },
    { id: 'equipmentTab', label: 'ภาพรวมอุปกรณ์', roles: ['admin', 'user', 'technician', 'approver'] },
    { id: 'borrowTab', label: 'ยืมอุปกรณ์', roles: ['user'] },
    { id: 'borrowHistoryTab', label: 'ประวัติการยืม', roles: ['user', 'admin'] },
    { id: 'approvalTab', label: 'จัดการคำขอ', roles: ['approver'] },
    { id: 'techTab', label: 'งานของช่าง', roles: ['technician'] }, // Renamed from 'รายการซ่อมบำรุง'
    { id: 'repairHistoryTab', label: 'ประวัติการซ่อม', roles: ['technician', 'admin'] }, // Renamed from 'ประวัติการซ่อม'
    { id: 'approvalHistoryTab', label: 'ประวัติการอนุมัติ', roles: ['approver', 'admin'] },
    { id: 'assessmentTab', label: 'ประเมินมาตรฐาน', roles: ['technician'] },
    { id: 'standardAssessmentHistoryTab', label: 'ประวัติการประเมินมาตรฐาน', roles: ['technician', 'admin'] },
    { id: 'reportTab', label: 'รายงาน', roles: ['admin', 'approver', 'technician'] },
    { id: 'adminTab', label: 'ส่วนผู้ดูแลระบบ', roles: ['admin'] }
];

const Dashboard = () => {
    const { user } = useAppContext(); // Get user from context
    const [activeTab, setActiveTab] = useState('equipmentTab');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State for mobile dropdown

    // Filter tabs based on user role
    const visibleTabs = allTabs.filter(tab => user && tab.roles.includes(user.role));

    // Set active tab to the first visible tab if the current active tab is no longer visible
    useEffect(() => {
        if (!visibleTabs.some(tab => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0]?.id || 'equipmentTab');
        }
    }, [user?.role, visibleTabs, activeTab]); // Add user?.role to dependencies

    const renderActiveTab = () => {
        if (!user) return null; // Render nothing if user is not available

        switch (activeTab) {
            case 'profileTab': return <ProfileTab />;
            case 'equipmentTab': return <EquipmentTab />;
            case 'borrowTab': return <BorrowTab />;
            case 'borrowHistoryTab': return <BorrowHistoryTab userId={user.role === 'admin' ? null : user.uid} />;
            case 'techTab': return <TechTab />;
            case 'repairHistoryTab': return <RepairHistoryTab userId={user.role === 'admin' ? null : user.uid} />;
            case 'approvalTab': return <ApprovalTab />;
            case 'approvalHistoryTab': return <ApprovalHistoryTab userId={user.role === 'admin' ? null : user.uid} />;
            case 'assessmentTab': return <AssessmentTab />;
            case 'standardAssessmentHistoryTab': return <StandardAssessmentHistoryTab />;
            case 'reportTab': return <ReportTab />;
            case 'adminTab': return <AdminTab />;
            default: return <EquipmentTab />;
        }
    };

    if (!user) {
        return <p>Loading user data...</p>; // Or a loading spinner
    }

    const activeTabLabel = visibleTabs.find(tab => tab.id === activeTab)?.label || 'Menu';

    return (
        <section id="dashboard" className="fade-in">
            {/* Mobile Menu */}
            <div className="relative md:hidden">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="w-full bg-white/80 backdrop-blur-sm p-3 rounded-xl text-left text-gray-800 font-semibold flex justify-between items-center shadow"
                >
                    {activeTabLabel}
                    <svg className={`w-5 h-5 transition-transform ${isMobileMenuOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {isMobileMenuOpen && (
                    <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-100">
                        <ul className="py-2">
                            {visibleTabs.map(tab => (
                                <li key={tab.id}>
                                    <button
                                        onClick={() => {
                                            setActiveTab(tab.id);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-2 text-sm ${activeTab === tab.id ? 'bg-indigo-500 text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {tab.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Desktop Tabs */}
            <div className="mt-4 hidden md:block">
                <div id="desktopTabs" className="max-w-7xl mx-auto">
                    <div className="bg-white/50 backdrop-blur-sm p-2 rounded-xl flex items-center">
                        {visibleTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                data-tab={tab.id}
                                className={`py-2 px-6 rounded-md transition-colors duration-300 text-sm font-medium ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200/50 hover:text-gray-900'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-6">
                {renderActiveTab()}
            </div>
        </section>
    );
};

export default Dashboard;