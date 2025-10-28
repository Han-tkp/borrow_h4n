import React from 'react';

const AssessmentTab = () => {
    return (
        <div id="assessmentTab" className="tab-content">
            <div className="card rounded-2xl p-6 text-slate-900">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-semibold">ประเมินมาตรฐานเครื่องพ่น</h3>
                    <div className="flex items-center gap-2">
                        <select id="assessmentTypeFilter"
                            className="px-3 py-2 rounded-lg border border-slate-200 text-sm">
                            <option value="">ทุกประเภท</option>
                        </select>
                    </div>
                </div>
                <p className="text-sm text-slate-600 mt-1">เลือกเครื่องพ่นที่ต้องการบันทึกการประเมินประสิทธิภาพ</p>
                <div id="assessmentEquipList"
                    className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4 grid-mobile-1 max-h-[60vh] overflow-y-auto pr-2 -mr-2"></div>
            </div>
        </div>
    );
};

export default AssessmentTab;