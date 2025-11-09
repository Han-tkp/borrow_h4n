
import React, { useState, useEffect } from 'react';
import { getEquipmentList, submitStandardAssessment, getEquipmentTypes } from '../../api/firestoreApi';
import { useAppContext } from '../../App';
import StandardAssessmentModal from './StandardAssessmentModal';
import { statusMap } from '../../utils/helpers';

const AssessmentTab = () => {
    const { showModal, hideModal, showToast } = useAppContext();
    const [equipment, setEquipment] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [equipmentTypes, setEquipmentTypes] = useState<string[]>([]);
    const [typeFilter, setTypeFilter] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [equipmentList, types] = await Promise.all([
                getEquipmentList({ includeDeleted: false }),
                getEquipmentTypes()
            ]);
            setEquipment(equipmentList);
            setEquipmentTypes(types as string[]);
        } catch (error) {
            console.error("Error fetching data for assessment tab:", error);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleStandardAssess = (equipmentItem: any) => {
        showModal('ประเมินมาตรฐานเครื่องพ่น', 
            <StandardAssessmentModal 
                equipment={equipmentItem}
                onClose={hideModal}
                onSubmit={async (assessmentData) => {
                    try {
                        await submitStandardAssessment(assessmentData);
                        showToast('Success', 'บันทึกผลการประเมินเรียบร้อยแล้ว');
                        fetchData(); // Refresh data
                        hideModal();
                    } catch (error) {
                        console.error("Failed to submit standard assessment:", error);
                        showToast('Error', 'เกิดข้อผิดพลาดในการบันทึกผลการประเมิน');
                    }
                }}
            />
        );
    };

    const filteredEquipment = equipment.filter(e => typeFilter === '' || e.type === typeFilter);

    if (loading) {
        return <p>Loading equipment...</p>;
    }

    return (
        <div id="assessmentTab" className="tab-content">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-[var(--text-color-dark)]">ประเมินมาตรฐานเครื่องพ่น</h3>
                        <p className="text-sm text-gray-500 mt-1">เลือกเครื่องพ่นที่ต้องการบันทึกการประเมินประสิทธิภาพ</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 text-sm">
                            <option value="">ทุกประเภท</option>
                            {equipmentTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[65vh] overflow-y-auto pr-2 -mr-2">
                    {filteredEquipment.map(e => (
                        <div key={e.id} className="p-4 rounded-lg border border-[var(--border-color)] flex justify-between items-center">
                            <div>
                                <p className="font-semibold text-gray-800">{e.name}</p>
                                <p className="text-sm text-gray-500">S/N: {e.serial}</p>
                                <span className={`mt-2 inline-block text-xs font-medium px-2 py-1 rounded-full ${statusMap[e.status]?.color || 'bg-gray-100 text-gray-800'}`}>
                                    {statusMap[e.status]?.text || e.status}
                                </span>
                            </div>
                            <button onClick={() => handleStandardAssess(e)} className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700">ประเมิน</button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AssessmentTab;
