import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Modal, Form, Input, Space } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

interface PendingRequest {
  id: number;
  equipment_id: number;
  category: string;
  asset_code: string;
  name: string;
  borrower_name: string;
  borrow_date: string;
  return_date?: string;
  status: string;
  remark?: string;
  received_by?: string;
}

const ApprovalRequests: React.FC = () => {
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isRejectModalVisible, setIsRejectModalVisible] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [form] = Form.useForm();
  
  // Optional: Extra safety to only show data to correct roles, though UI handles routing
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    fetchRequests(true); // Initial fetch with loading state

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserRole(decoded.role || '');
      } catch (error) {
        console.error('Invalid token', error);
      }
    }

  }, []);

  const fetchRequests = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const response = await api.get('/equipment/history/pending');
      setRequests(response.data);
    } catch (error) {
      message.error('ไม่สามารถดึงข้อมูลคำขอที่รออนุมัติได้');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleApprove = (id: number) => {
    Modal.confirm({
      centered: true,
      title: 'ยืนยันการอนุมัติ',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการอนุมัติคำขอนี้?',
      okText: 'อนุมัติ',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await api.put(`/equipment/history/${id}/approve`);
          message.success('อนุมัติคำขอสำเร็จ');
          fetchRequests();
          window.dispatchEvent(new CustomEvent('request-update'));
        } catch (error) {
          message.error('ไม่สามารถอนุมัติคำขอได้');
        }
      }
    });
  };

  const openRejectModal = (id: number) => {
    setSelectedRequestId(id);
    form.resetFields();
    setIsRejectModalVisible(true);
  };

  const handleReject = async (values: any) => {
    if (!selectedRequestId) return;
    
    Modal.confirm({
      centered: true,
      title: 'ยืนยันการปฏิเสธคำขอ',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธคำขอนี้? (อุปกรณ์จะถูกปลดล็อค หรือกลับไปสถานะเดิม)',
      okText: 'ปฏิเสธคำขอ',
      cancelText: 'ยกเลิก',
      okType: 'danger',
      onOk: async () => {
        setSubmitting(true);
        try {
          await api.put(`/equipment/history/${selectedRequestId}/reject`, {
            remark: values.reject_remark
          });
          message.success('ปฏิเสธคำขอสำเร็จ');
          setIsRejectModalVisible(false);
          fetchRequests();
          window.dispatchEvent(new CustomEvent('request-update'));
        } catch (error) {
          message.error('ไม่สามารถปฏิเสธคำขอได้');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const columns = [
    {
      title: 'ผู้ทำรายการ',
      dataIndex: 'borrower_name',
      key: 'borrower_name',
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
      title: 'ประเภทคำขอ',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'pending_borrow' ? 'blue' : 'cyan'}>
          {status === 'pending_borrow' ? 'ขอยืมอุปกรณ์' : 'ขอคืนอุปกรณ์'}
        </Tag>
      ),
    },
    {
      title: 'เหตุผลการยืม/ผู้รับคืน',
      key: 'details',
      render: (_: any, record: PendingRequest) => {
        if (record.status === 'pending_borrow') {
          return record.remark || '-';
        }
        return `ผู้รับคืน: ${record.received_by || '-'}`;
      }
    },
    {
      title: 'วันที่ทำรายการ',
      dataIndex: 'borrow_date',
      key: 'borrow_date',
      render: (text: string) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: PendingRequest) => (
        <Space size="small">
          <Button 
            type="primary" 
            icon={<CheckOutlined />} 
            onClick={() => handleApprove(record.id)}
            className="bg-green-600 hover:bg-green-500 border-none"
          >
            อนุมัติ
          </Button>
          <Button 
            danger 
            icon={<CloseOutlined />} 
            onClick={() => openRejectModal(record.id)}
          >
            ปฏิเสธ
          </Button>
        </Space>
      ),
    },
  ];

  const hasAccess = ['HR', 'IT', 'OwnerBMU', 'Head'].includes(userRole);

  if (!hasAccess && userRole !== '') {
    return (
      <div className="flex justify-center items-center h-full"> 
        <h2 className="text-xl text-red-500">คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-0">จัดการคำขออนุมัติ ยืม-คืน อุปกรณ์ส่วนกลาง</h1>
          <Button 
            type="default" 
            icon={<ReloadOutlined />} 
            onClick={() => fetchRequests(true)}
            loading={loading}
          >
            รีเฟรชข้อมูล
          </Button>
        </div>
      </div>

      <Table
        columns={columns}
        dataSource={requests}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        centered
        style={{ maxWidth: '95vw' }}
        title="ปฏิเสธคำขอ"
        open={isRejectModalVisible}
        onCancel={() => setIsRejectModalVisible(false)}
        footer={null}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleReject}
        >
          <Form.Item
            name="reject_remark"
            label="เหตุผลในการปฏิเสธคำขอ"
            rules={[{ required: true, message: 'กรุณากรอกเหตุผลเพื่อที่ผู้ยืม/คืนจะได้ทราบ' }]}
          >
            <Input.TextArea rows={4} placeholder="เช่น อุปกรณ์นี้ถูกจองไว้แล้ว, ระบุชื่อผู้รับคืนไม่ถูกต้อง ฯลฯ" autoFocus />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setIsRejectModalVisible(false)}>ยกเลิก</Button>
              <Button danger type="primary" htmlType="submit" loading={submitting}>
                ยืนยันการปฏิเสธ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default ApprovalRequests;
