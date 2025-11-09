import React, { useState } from 'react';

interface StandardAssessmentModalProps {
    equipment: any;
    onClose: () => void;
    onSubmit?: (assessmentData: any) => void;
    readOnlyData?: any;
}

const StandardAssessmentModal: React.FC<StandardAssessmentModalProps> = ({ equipment, onClose, onSubmit, readOnlyData }) => {
    const isReadOnly = !!readOnlyData;

    const [externalCondition, setExternalCondition] = useState(isReadOnly ? readOnlyData.externalCondition : 'ปานกลาง');
    const [engineStart, setEngineStart] = useState(isReadOnly ? readOnlyData.engineStart : 'ติดง่าย');
    const [internalCleanliness, setInternalCleanliness] = useState<string[]>(isReadOnly ? readOnlyData.internalCleanliness || [] : []);
    const [chemicalName, setChemicalName] = useState(isReadOnly ? readOnlyData.testChemical?.name : '');
    const [concentration, setConcentration] = useState(isReadOnly ? readOnlyData.testChemical?.concentration?.toString() || '' : '');
    const [mixingRatio, setMixingRatio] = useState(isReadOnly ? readOnlyData.testChemical?.mixingRatio : '');
    const [nozzleTemp, setNozzleTemp] = useState(isReadOnly ? readOnlyData.testResult?.nozzleTemp?.toString() || '' : '');
    const [flowRate, setFlowRate] = useState(isReadOnly ? readOnlyData.testResult?.flowRate?.toString() || '' : '');
    const [suggestions, setSuggestions] = useState(isReadOnly ? readOnlyData.testResult?.suggestions : '');
    const [newStatus, setNewStatus] = useState(isReadOnly ? readOnlyData.newStatus : equipment.status);
    const [damageDescription, setDamageDescription] = useState(isReadOnly ? readOnlyData.damageDescription : '');

    const handleCleanlinessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        const { value, checked } = e.target;
        setInternalCleanliness(prev => 
            checked ? [...prev, value] : prev.filter(item => item !== value)
        );
    };

    const handleNumericChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (isReadOnly) return;
        const { value } = e.target;
        if (/^\d*\.?\d*$/.test(value)) {
            setter(value);
        }
    };

    const handleSubmit = () => {
        if (isReadOnly || !onSubmit) return;

        if (newStatus === 'under_maintenance' && !damageDescription) {
            alert('กรุณากรอกรายละเอียดอาการเสียเพื่อส่งซ่อม');
            return;
        }

        const assessmentData = {
            equipmentId: equipment.id,
            equipmentName: equipment.name,
            equipmentType: equipment.type, // Add this line
            assessedAt: new Date(),
            externalCondition,
            engineStart,
            internalCleanliness,
            testChemical: {
                name: chemicalName,
                concentration: parseFloat(concentration) || 0,
                mixingRatio,
            },
            testResult: {
                nozzleTemp: parseFloat(nozzleTemp) || 0,
                flowRate: parseFloat(flowRate) || 0,
                suggestions,
            },
            newStatus: newStatus,
            damageDescription: newStatus === 'under_maintenance' ? damageDescription : null,
        };
        onSubmit(assessmentData);
    };

    return (
        <div className="p-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">{isReadOnly ? 'รายละเอียดการประเมินมาตรฐาน' : 'แบบรายงานการประเมินมาตรฐานเครื่องพ่น'}</h3>
            <p className="text-sm text-gray-600 mb-4">สำหรับเครื่อง: <span className='font-semibold'>{equipment?.name || readOnlyData.equipmentName}</span></p>
            
            <div className="space-y-4">
                {/* สภาพภายนอก */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">1. สภาพภายนอก</label>
                    <div className="flex gap-4 mt-1">
                        <label className="flex items-center"><input type="radio" value="ใหม่" checked={externalCondition === 'ใหม่'} onChange={e => !isReadOnly && setExternalCondition(e.target.value)} disabled={isReadOnly} className="mr-1"/> ใหม่</label>
                        <label className="flex items-center"><input type="radio" value="ปานกลาง" checked={externalCondition === 'ปานกลาง'} onChange={e => !isReadOnly && setExternalCondition(e.target.value)} disabled={isReadOnly} className="mr-1"/> ปานกลาง</label>
                        <label className="flex items-center"><input type="radio" value="เก่า" checked={externalCondition === 'เก่า'} onChange={e => !isReadOnly && setExternalCondition(e.target.value)} disabled={isReadOnly} className="mr-1"/> เก่า</label>
                    </div>
                </div>

                {/* การติดตั้งเครื่องยนต์ */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">2. การติดตั้งเครื่องยนต์</label>
                    <div className="flex gap-4 mt-1">
                        <label className="flex items-center"><input type="radio" value="ติดง่าย" checked={engineStart === 'ติดง่าย'} onChange={e => !isReadOnly && setEngineStart(e.target.value)} disabled={isReadOnly} className="mr-1"/> ติดง่าย</label>
                        <label className="flex items-center"><input type="radio" value="ติดยาก" checked={engineStart === 'ติดยาก'} onChange={e => !isReadOnly && setEngineStart(e.target.value)} disabled={isReadOnly} className="mr-1"/> ติดยาก</label>
                    </div>
                </div>

                {/* ความสะอาดภายใน */}
                <div>
                    <label className="block text-sm font-medium text-gray-700">3. ความสะอาดภายใน</label>
                    <div className="flex gap-4 mt-1 flex-wrap">
                        <label className="flex items-center"><input type="checkbox" value="ท่อพ่น" checked={internalCleanliness.includes('ท่อพ่น')} onChange={handleCleanlinessChange} disabled={isReadOnly} className="mr-1"/> ท่อพ่น</label>
                        <label className="flex items-center"><input type="checkbox" value="สายส่งน้ำยา" checked={internalCleanliness.includes('สายส่งน้ำยา')} onChange={handleCleanlinessChange} disabled={isReadOnly} className="mr-1"/> สายส่งน้ำยา</label>
                        <label className="flex items-center"><input type="checkbox" value="ถังเบนซิน" checked={internalCleanliness.includes('ถังเบนซิน')} onChange={handleCleanlinessChange} disabled={isReadOnly} className="mr-1"/> ถังเบนซิน</label>
                        <label className="flex items-center"><input type="checkbox" value="ถังเคมี" checked={internalCleanliness.includes('ถังเคมี')} onChange={handleCleanlinessChange} disabled={isReadOnly} className="mr-1"/> ถังเคมี</label>
                    </div>
                </div>

                {/* ข้อมูลสารเคมี */}
                <div className="p-3 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">4. ข้อมูลสารเคมีที่ทดสอบ</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input type="text" value={chemicalName} onChange={e => !isReadOnly && setChemicalName(e.target.value)} disabled={isReadOnly} placeholder="ชื่อสารเคมี" className="w-full px-3 py-2 border rounded-lg" />
                        <input type="text" value={concentration} onChange={handleNumericChange(setConcentration)} disabled={isReadOnly} placeholder="ความเข้มข้น (%)" className="w-full px-3 py-2 border rounded-lg" />
                        <input type="text" value={mixingRatio} onChange={e => !isReadOnly && setMixingRatio(e.target.value)} disabled={isReadOnly} placeholder="อัตราส่วนผสม" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                </div>

                {/* สรุปผล */}
                <div className="p-3 border rounded-lg bg-gray-50">
                    <h4 className="font-medium mb-2">5. สรุปผลการทดสอบ</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                        <input type="text" value={nozzleTemp} onChange={handleNumericChange(setNozzleTemp)} disabled={isReadOnly} placeholder="อุณหภูมิปลายท่อ (℃)" className="w-full px-3 py-2 border rounded-lg" />
                        <input type="text" value={flowRate} onChange={handleNumericChange(setFlowRate)} disabled={isReadOnly} placeholder="อัตราการไหลเฉลี่ย (มล./นาที)" className="w-full px-3 py-2 border rounded-lg" />
                    </div>
                    <textarea value={suggestions} onChange={e => !isReadOnly && setSuggestions(e.target.value)} disabled={isReadOnly} placeholder="ข้อเสนอแนะ" rows={3} className="w-full px-3 py-2 border rounded-lg"></textarea>
                </div>

                {/* ปรับสถานะ */}
                <div>
                    <label htmlFor="newStatus" className="block text-sm font-medium text-gray-700">6. ปรับสถานะเครื่องหลังประเมิน</label>
                    <select id="newStatus" value={newStatus} onChange={e => !isReadOnly && setNewStatus(e.target.value)} disabled={isReadOnly} className="w-full mt-1 px-3 py-2 border rounded-lg bg-white">
                        <option value="available">ว่าง</option>
                        <option value="under_maintenance">ซ่อม</option>
                    </select>
                </div>

                {newStatus === 'under_maintenance' && !isReadOnly && (
                    <div>
                        <label htmlFor="damage-desc" className="block text-sm font-medium text-red-700">รายละเอียดอาการเสียเพื่อส่งซ่อม</label>
                        <textarea id="damage-desc" value={damageDescription} onChange={e => !isReadOnly && setDamageDescription(e.target.value)} disabled={isReadOnly} rows={3} className="w-full mt-1 px-3 py-2 border rounded-lg border-red-300" required />
                    </div>
                )}

            </div>

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={onClose} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300">{isReadOnly ? 'ปิด' : 'ยกเลิก'}</button>
                {!isReadOnly && (
                    <button onClick={handleSubmit} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">บันทึกผลประเมิน</button>
                )}
            </div>
        </div>
    );
};

export default StandardAssessmentModal;