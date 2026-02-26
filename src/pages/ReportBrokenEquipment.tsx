import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Modal, Form, Input, Select } from 'antd';
import { PlusCircleOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

interface RepairReport {
  id: number;
  equipment_id: number;
  category: string;
  asset_code: string;
  name: string;
  reporter_name: string;
  problem_detail: string;
  report_date: string;
  repair_status: string;
  resolved_date?: string;
}

const ReportBrokenEquipment: React.FC = () => {
  const [reportsList, setReportsList] = useState<RepairReport[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  
  const [currentUser, setCurrentUser] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setCurrentUser(decoded.username || decoded.name || 'Unknown User');
        setUserRole(decoded.role || '');
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
    fetchReports();
  }, []);

  const hasElevatedAccess = ['HR', 'IT', 'OwnerBMU', 'Head'].includes(userRole);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await api.get('/equipment/broken');
      setReportsList(response.data);
    } catch (error) {
      message.error('ดึงข้อมูลการแจ้งซ่อมไม่สำเร็จ');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const openReportModal = async () => {
    form.setFieldsValue({ reporter_name: currentUser });
    setIsModalVisible(true);
    try {
      // Fetch equipment that can be reported (not already broken)
      const response = await api.get('/equipment');
      const repItem = response.data.filter((eq: any) => eq.status !== 'broken' && eq.status !== 'รอซ่อม');
      setAvailableEquipment(repItem);
    } catch {
      message.error('ไม่สามารถดึงรายการอุปกรณ์มารายงานได้');
    }
  };

  const handleReport = async (values: any) => {
    setSubmitting(true);
    try {
      const payload = {
        equipment_id: values.equipment_id,
        problem_detail: values.problem_detail
      };
      await api.post('/equipment/broken', payload);
      message.success('แจ้งอุปกรณ์เสียสำเร็จ');
      setIsModalVisible(false);
      form.resetFields();
      fetchReports();
    } catch (error) {
      message.error('แจ้งอุปกรณ์เสียไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await api.put(`/equipment/broken/${id}/resolve`);
      message.success('บันทึกการซ่อมแซมสำเร็จ สถานะอุปกรณ์กลับมาใช้งานได้แล้ว');
      fetchReports();
    } catch (error) {
      message.error('บันทึกการซ่อมไม่สำเร็จ');
    }
  };

  const columns = [
    {
      title: 'วันที่แจ้ง',
      dataIndex: 'report_date',
      key: 'report_date',
      render: (text: string) => text ? new Date(text).toLocaleString() : '-',
    },
    {
      title: 'รหัสอุปกรณ์',
      dataIndex: 'asset_code',
      key: 'asset_code',
    },
    {
      title: 'ชื่ออุปกรณ์',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ผู้แจ้ง',
      dataIndex: 'reporter_name',
      key: 'reporter_name',
    },
    {
      title: 'อาการเสีย',
      dataIndex: 'problem_detail',
      key: 'problem_detail',
    },
    {
      title: 'สถานะ',
      dataIndex: 'repair_status',
      key: 'repair_status',
      render: (status: string) => (
        <Tag color={status === 'repaired' ? 'green' : 'red'}>
          {status === 'repaired' ? 'ซ่อมเสร็จแล้ว' : 'รอซ่อม'}
        </Tag>
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: RepairReport) => {
        if (record.repair_status === 'pending' && hasElevatedAccess) {
          return (
            <Button onClick={() => handleResolve(record.id)} icon={<CheckCircleOutlined />} className="text-green-600 border-green-600 hover:bg-green-50">
              บันทึกว่าซ่อมเสร็จ
            </Button>
          );
        }
        return null; // hide if already repaired or normal user
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold">แจ้งซ่อม/อุปกรณ์เสีย</h1>
          <p className="text-gray-500 mb-0">ประวัติการแจ้งซ่อมอุปกรณ์ทั้งหมด</p>
        </div>
        <Button type="primary" danger icon={<PlusCircleOutlined />} onClick={openReportModal}>
          แจ้งอุปกรณ์เสีย
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={reportsList}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        centered
        style={{ maxWidth: '95vw' }}
        title="แบบฟอร์มแจ้งอุปกรณ์เสีย"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <div className="mb-4 p-3 bg-orange-50 text-orange-800 rounded-md border border-orange-100">
          เมื่อคุณแจ้งเคลม อุปกรณ์ชิ้นนี้จะถูกเปลี่ยนสถานะเป็น "เสีย(รอซ่อม)" ทันที และจะถูกถอนออกจากรายการที่สามารถยืมได้จนกว่าจะมีการซ่อมเสร็จ
        </div>

        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleReport}
        >
          <Form.Item
            name="equipment_id"
            label="เลือกอุปกรณ์ที่เสีย"
            rules={[{ required: true, message: 'กรุณาเลือกอุปกรณ์' }]}
          >
            <Select 
              showSearch 
              placeholder="พิมพ์เพื่อค้นหาชื่อ หรือ รหัสสินทรัพย์..."
              size="large"
              optionFilterProp="children"
              filterOption={(input, option) =>
                (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
              }
              options={availableEquipment.map(eq => ({
                value: eq.ID,
                label: `[${eq.asset_code}] ${eq.name}`
              }))}
            />
          </Form.Item>

          <Form.Item
            name="reporter_name"
            label="ผู้แจ้ง"
          >
            <Input readOnly className="bg-gray-100" />
          </Form.Item>

          <Form.Item
            name="problem_detail"
            label="อาการเสีย / ปัญหาที่พบ"
            rules={[{ required: true, message: 'กรุณาระบุอาการเสีย' }]}
          >
            <Input.TextArea rows={4} placeholder="อธิบายอาการเสียที่พบ เช่น เปิดไม่ติด, จอแตก, สายขาด เป็นต้น" />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <div className="flex gap-2">
              <Button onClick={() => setIsModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" danger htmlType="submit" loading={submitting}>
                แจ้งอุปกรณ์เสีย
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ReportBrokenEquipment;
