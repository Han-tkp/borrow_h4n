import React from 'react';
import { useAppContext } from '../context/AppContext';
import EquipmentTab from './dashboard/EquipmentTab';
import BorrowTab from './dashboard/BorrowTab';
import BorrowHistoryTab from './dashboard/BorrowHistoryTab';
import TechTab from './dashboard/TechTab';
import RepairHistoryTab from './dashboard/RepairHistoryTab';
import ApprovalTab from './dashboard/ApprovalTab';
import ApprovalHistoryTab from './dashboard/ApprovalHistoryTab';
import AssessmentTab from './dashboard/AssessmentTab';
import ReportTab from './dashboard/ReportTab';
import AdminTab from './dashboard/AdminTab';
import ProfileTab from './dashboard/ProfileTab';
import StandardAssessmentHistoryTab from './dashboard/StandardAssessmentHistoryTab';

const Dashboard = ({ activeTab, setActiveTab, visibleTabs }) => {
    const { user } = useAppContext();

    const renderActiveTab = () => {
        if (!user) return null;

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
        return <p>Loading user data...</p>;
    }

    return (
        <section id="dashboard" className="fade-in">
            {/* Desktop Tabs */}
            <div className="hidden md:block">
                <div id="desktopTabs" className="max-w-7xl mx-auto">
                    <div className="bg-white/50 backdrop-blur-sm p-2 rounded-xl flex items-center overflow-x-auto">
                        {visibleTabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                data-tab={tab.id}
                                className={`flex-shrink-0 py-2 px-6 rounded-md transition-colors duration-300 text-sm font-medium ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-700 hover:bg-gray-200/50 hover:text-gray-900'}`}>
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