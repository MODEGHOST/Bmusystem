import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Typography, message, Skeleton } from 'antd';
import { AppstoreOutlined, ToolOutlined, SwapOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../api/axios';

const { Title } = Typography;

interface DashboardData {
  totalEquipment: number;
  brokenEquipment: number;
  borrowsThisMonth: number;
  categoryCounts: { name: string; value: number }[];
}

const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#eab308'];

const DashboardSummary: React.FC = () => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/equipment/dashboard-summary');
      setData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      message.error('ไม่สามารถดึงข้อมูลสรุปได้');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Skeleton active paragraph={{ rows: 4 }} />
        <Skeleton active paragraph={{ rows: 8 }} className="mt-8" />
      </div>
    );
  }

  return (
    <div className="p-2 md:p-6 bg-gray-50 min-h-full rounded-lg">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Title level={3} className="!mb-0 text-gray-800 text-xl sm:text-2xl">ภาพรวมระบบ (Dashboard)</Title>
      </div>

      <Row gutter={[16, 16]} className="mb-8">
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
            <Statistic
              title="อุปกรณ์ทั้งหมด"
              value={data?.totalEquipment || 0}
              suffix="ชิ้น"
              valueStyle={{ color: '#3b82f6', fontWeight: 'bold' }}
              prefix={<AppstoreOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
            <Statistic
              title="อุปกรณ์เสีย / รอซ่อม"
              value={data?.brokenEquipment || 0}
              suffix="รายการ"
              valueStyle={{ color: '#ef4444', fontWeight: 'bold' }}
              prefix={<ToolOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="shadow-sm border-l-4 border-l-green-500 hover:shadow-md transition-shadow">
            <Statistic
              title="การยืมในเดือนนี้"
              value={data?.borrowsThisMonth || 0}
              suffix="ครั้ง"
              valueStyle={{ color: '#10b981', fontWeight: 'bold' }}
              prefix={<SwapOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card 
            title="สัดส่วนอุปกรณ์ตามหมวดหมู่" 
            className="shadow-sm h-full"
            bodyStyle={{ minHeight: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {data?.categoryCounts && data.categoryCounts.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.categoryCounts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                  >
                    {data.categoryCounts.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} ชิ้น`, 'จำนวน']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-gray-400">ยังไม่มีข้อมูลอุปกรณ์</div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardSummary;
