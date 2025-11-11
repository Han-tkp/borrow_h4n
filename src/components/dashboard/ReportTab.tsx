import React, { useState, useEffect } from 'react';
import { getReportData } from '../../api/firestoreApi';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const ReportTab = () => {
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const data = await getReportData(startDate, endDate);
                setReportData(data);
            } catch (error) {
                console.error("Error fetching report data:", error);
            }
            setLoading(false);
        };
        fetchData();
    }, [startDate, endDate]);

    if (loading || !reportData) {
        return <p>Loading reports...</p>;
    }

    const borrowByTypeChartData = {
        labels: Object.keys(reportData.borrowingByType),
        datasets: [{
            label: 'จำนวนครั้งที่ยืม',
            data: Object.values(reportData.borrowingByType),
            backgroundColor: ['#4f46e5', '#7c3aed', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444'],
        }],
    };

    const equipmentStatusChartData = {
        labels: Object.keys(reportData.equipmentStatusCounts),
        datasets: [{
            label: 'จำนวนอุปกรณ์',
            data: Object.values(reportData.equipmentStatusCounts),
            backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#6b7280'],
        }],
    };

    const trendChartData = {
        labels: Object.keys(reportData.borrowsByMonth).sort(),
        datasets: [
            {
                label: 'การยืม',
                data: Object.entries(reportData.borrowsByMonth).sort().map(([, value]) => value),
                borderColor: '#4f46e5',
                backgroundColor: '#4f46e5',
                fill: false,
            },
            {
                label: 'การซ่อม',
                data: Object.entries(reportData.repairsByMonth).sort().map(([, value]) => value),
                borderColor: '#ef4444',
                backgroundColor: '#ef4444',
                fill: false,
            },
        ],
    };

    return (
        <div className="tab-content">
            <div className="card rounded-2xl p-4 sm:p-6 bg-slate-50 text-slate-900 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <h3 className="text-lg font-semibold">Strategic Dashboard</h3>
                    <div className="flex items-center gap-2">
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="px-3 py-2 w-full sm:w-auto text-sm rounded-lg border border-slate-200" />
                        <span className="text-slate-500">to</span>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="px-3 py-2 w-full sm:w-auto text-sm rounded-lg border border-slate-200" />
                    </div>
                </div>

                {/* Monthly Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="rounded-xl p-4 bg-indigo-100 text-indigo-800"><div className="text-sm">การยืม (ในขอบเขต)</div><div className="text-3xl font-bold mt-1">{reportData.totalBorrows}</div></div>
                    <div className="rounded-xl p-4 bg-amber-100 text-amber-800"><div className="text-sm">การซ่อม (ในขอบเขต)</div><div className="text-3xl font-bold mt-1">{reportData.totalRepairs}</div></div>
                    <div className="rounded-xl p-4 bg-red-100 text-red-800"><div className="text-sm">ค่าซ่อม (ในขอบเขต)</div><div className="text-3xl font-bold mt-1">{reportData.totalRepairCost.toLocaleString()}.-</div></div>
                </div>

                {/* Overall Summary */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="rounded-xl p-4 bg-green-100 text-green-800"><div className="text-sm">ผู้ใช้งานทั้งหมด</div><div className="text-3xl font-bold mt-1">{reportData.totalUsers}</div></div>
                    <div className="rounded-xl p-4 bg-sky-100 text-sky-800"><div className="text-sm">อุปกรณ์ทั้งหมด</div><div className="text-3xl font-bold mt-1">{reportData.totalEquipment}</div></div>
                </div>

                <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="chart-container lg:col-span-2 xl:col-span-3 h-80">
                        <h5 className="font-semibold mb-2 text-slate-800 text-center">แนวโน้มการยืมและการซ่อม (รายเดือน)</h5>
                        <Line data={trendChartData} options={{ maintainAspectRatio: false }} />
                    </div>
                    <div className="chart-container h-80">
                         <h5 className="font-semibold mb-2 text-slate-800 text-center">สถานะอุปกรณ์ทั้งหมด</h5>
                        {Object.keys(reportData.equipmentStatusCounts).length > 0 ? <Doughnut data={equipmentStatusChartData} options={{ maintainAspectRatio: false }} /> : <p className='text-center text-slate-500'>ไม่มีข้อมูล</p>}
                    </div>
                    <div className="chart-container h-80">
                         <h5 className="font-semibold mb-2 text-slate-800 text-center">สัดส่วนการยืมตามประเภท (ในขอบเขต)</h5>
                        {Object.keys(reportData.borrowingByType).length > 0 ? <Pie data={borrowByTypeChartData} options={{ maintainAspectRatio: false }} /> : <p className='text-center text-slate-500'>ไม่มีข้อมูล</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportTab;
