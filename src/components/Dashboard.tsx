import React, { useState, useEffect } from 'react';
import EquipmentTab from './dashboard/EquipmentTab';
import BorrowTab from './dashboard/BorrowTab';
import BorrowHistoryTab from './dashboard/BorrowHistoryTab';
import TechTab from './dashboard/TechTab';
import DeliveryTab from './dashboard/DeliveryTab';
import RepairHistoryTab from './dashboard/RepairHistoryTab';
import ApprovalTab from './dashboard/ApprovalTab';
import ApprovalHistoryTab from './dashboard/ApprovalHistoryTab';
import AssessmentTab from './dashboard/AssessmentTab';
import AssessmentHistoryTab from './dashboard/AssessmentHistoryTab';
import ReportTab from './dashboard/ReportTab';
import AdminTab from './dashboard/AdminTab';


// Placeholder for all tab definitions
const allTabs = [
    { id: 'equipmentTab', label: 'ภาพรวมอุปกรณ์', roles: ['admin', 'user', 'technician', 'approver'] },
    { id: 'borrowTab', label: 'ยืมอุปกรณ์', roles: ['user'] },
    { id: 'borrowHistoryTab', label: 'ประวัติการยืม', roles: ['user'] },
    { id: 'approvalTab', label: 'จัดการคำขอ', roles: ['approver'] }, // Removed 'admin'
    { id: 'deliveryTab', label: 'คิวงานตรวจสภาพ', roles: ['technician'] }, // Removed 'admin'
    { id: 'techTab', label: 'รายการซ่อมบำรุง', roles: ['technician'] }, // Removed 'admin'
    { id: 'repairHistoryTab', label: 'ประวัติการซ่อม', roles: ['technician'] }, // Removed 'admin'
    { id: 'approvalHistoryTab', label: 'ประวัติการอนุมัติ', roles: ['approver'] }, // Removed 'admin'
    { id: 'assessmentTab', label: 'ประเมินมาตรฐาน', roles: ['technician'] }, // Removed 'admin'
    { id: 'assessmentHistoryTab', label: 'ประวัติการประเมิน', roles: ['technician'] }, // Removed 'admin'
    { id: 'reportTab', label: 'รายงาน', roles: ['admin', 'approver', 'technician'] },
    { id: 'adminTab', label: 'ส่วนผู้ดูแลระบบ', roles: ['admin'] }
];

const Dashboard = ({ userRole }: { userRole: string }) => {
    const [activeTab, setActiveTab] = useState('equipmentTab');

    // Filter tabs based on user role
    const visibleTabs = allTabs.filter(tab => tab.roles.includes(userRole));

    // Set active tab to the first visible tab if the current active tab is no longer visible
    useEffect(() => {
        if (!visibleTabs.some(tab => tab.id === activeTab)) {
            setActiveTab(visibleTabs[0]?.id || 'equipmentTab');
        }
    }, [userRole, visibleTabs, activeTab]);

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'equipmentTab': return <EquipmentTab />;
            case 'borrowTab': return <BorrowTab />;
            case 'borrowHistoryTab': return <BorrowHistoryTab />;
            case 'techTab': return <TechTab />;
            case 'deliveryTab': return <DeliveryTab />;
            case 'repairHistoryTab': return <RepairHistoryTab />;
            case 'approvalTab': return <ApprovalTab />;
            case 'approvalHistoryTab': return <ApprovalHistoryTab />;
            case 'assessmentTab': return <AssessmentTab />;
            case 'assessmentHistoryTab': return <AssessmentHistoryTab />;
            case 'reportTab': return <ReportTab />;
            case 'adminTab': return <AdminTab />;
            default: return <EquipmentTab />;
        }
    };

    return (
        <section id="dashboard" className="fade-in">
            {/* Demo Mode Banner can be a component here */}

            <div className="mt-4 overflow-x-auto hidden md:block">
                <div id="desktopTabs" className="inline-flex gap-1 bg-white/10 rounded-xl p-1">
                    {visibleTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            data-tab={tab.id}
                            className={`tab-btn px-4 py-2 rounded-lg ${activeTab === tab.id ? 'bg-white text-slate-900 font-semibold' : 'hover:bg-white/20'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-6">
                {renderActiveTab()}
            </div>
        </section>
    );
};

export default Dashboard;