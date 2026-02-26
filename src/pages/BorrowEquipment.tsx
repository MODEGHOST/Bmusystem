import React, { useState, useEffect } from 'react';
import { Table, Button, Tag, message, Modal, Form, Input, Select, DatePicker } from 'antd';
import { RollbackOutlined, PlusOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

interface BorrowHistory {
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
}

const BorrowEquipment: React.FC = () => {
  const [historyList, setHistoryList] = useState<BorrowHistory[]>([]);
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isBorrowModalVisible, setIsBorrowModalVisible] = useState(false);
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [selectedReturnId, setSelectedReturnId] = useState<number | null>(null);
  
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  const [returnForm] = Form.useForm();
  
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    fetchHistory();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const name = decoded.username || decoded.name || 'Unknown User';
        setCurrentUser(name);
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
  }, []);


  const fetchHistory = async () => {
    setLoading(true);
    try {
      // Wait for backend endpoint to be implemented, fallback to local empty list if it fails
      const response = await api.get('/equipment/history/active');
      setHistoryList(response.data);
    } catch (error) {
      console.warn('History API not ready yet, showing empty.');
      setHistoryList([]);
      message.error('ดึงข้อมูลอุปกรณ์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };



  const handleReturn = (id: number) => {
    setSelectedReturnId(id);
    returnForm.resetFields();
    setIsReturnModalVisible(true);
  };

  const submitReturn = (values: any) => {
    if (!selectedReturnId) return;
    
    Modal.confirm({
      centered: true,
      title: 'ยืนยันการคืนอุปกรณ์',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการส่งคำขอคืนอุปกรณ์นี้?',
      okText: 'ส่งคำขอคืน',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setSubmitting(true);
        try {
          await api.put(`/equipment/history/${selectedReturnId}/return`, {
            received_by: values.received_by
          });
          message.success('ส่งคำขอคืนอุปกรณ์ส่วนกลางสำเร็จ กรุณารอการอนุมัติ');
          setIsReturnModalVisible(false);
          fetchHistory();
          window.dispatchEvent(new CustomEvent('request-update'));
        } catch (error) {
          if ((error as any).response && (error as any).response.data && (error as any).response.data.message) {
             message.error((error as any).response.data.message);
          } else {
             message.error('ส่งคำขอคืนไม่สำเร็จ');
          }
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const openBorrowModal = async () => {
    // Set form explicitly to ensure it displays immediately
    form.setFieldsValue({ borrower_name: currentUser });
    setIsBorrowModalVisible(true);
    try {
      // Fetch usable equipment
      const response = await api.get('/equipment');
      const usableItems = response.data.filter((eq: any) => eq.status === 'usable' || eq.status === 'ว่าง');
      setAvailableEquipment(usableItems);
    } catch {
      message.error('ไม่สามารถดึงรายการอุปกรณ์ที่ว่างได้');
    }
  };

  const handleBorrow = (values: any) => {
    Modal.confirm({
      centered: true,
      title: 'ยืนยันการทำรายการยืม',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการส่งคำขอยืมอุปกรณ์นี้?',
      okText: 'ส่งคำขอยืม',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        setSubmitting(true);
        try {
          const payload = {
            borrower_name: values.borrower_name,
            return_date: values.return_date ? values.return_date.format('YYYY-MM-DD HH:mm:ss') : null,
            remark: values.remark
          };
          await api.post(`/equipment/history/${values.equipment_id}/borrow`, payload);
          message.success('ส่งคำขอยืมสำเร็จ กรุณารอผู้อนุมัติทำรายการ');
          setIsBorrowModalVisible(false);
          form.resetFields();
          fetchHistory();
          window.dispatchEvent(new CustomEvent('request-update'));
        } catch (error) {
          message.error('ส่งคำขอยืมไม่สำเร็จ');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const columns = [
    {
      title: 'หมวดหมู่',
      dataIndex: 'category',
      key: 'category',
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
      title: 'ผู้ยืมส่วนกลาง',
      dataIndex: 'borrower_name',
      key: 'borrower_name',
    },
    {
      title: 'เหตุผลที่ยืม',
      dataIndex: 'remark',
      key: 'remark',
      render: (text: string) => text || '-',
    },
    {
      title: 'วันที่ยืม',
      dataIndex: 'borrow_date',
      key: 'borrow_date',
      render: (text: string) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: 'กำหนดคืน (ถ้ามี)',
      dataIndex: 'return_date',
      key: 'return_date',
      render: (text: string) => text ? new Date(text).toLocaleDateString() : '-',
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        let color = 'default';
        let text = status;
        
        switch (status) {
          case 'returned': color = 'green'; text = 'คืนแล้ว'; break;
          case 'borrowed': color = 'purple'; text = 'กำลังยืม'; break;
          case 'pending_borrow': color = 'orange'; text = 'รออนุมัติยืม'; break;
          case 'pending_return': color = 'cyan'; text = 'รออนุมัติคืน'; break;
          case 'rejected': color = 'red'; text = 'ไม่อนุมัติ'; break;
        }
        
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: BorrowHistory) => {
        if (record.status === 'borrowed' && record.borrower_name === currentUser) {
          return (
            <Button onClick={() => handleReturn(record.id)} icon={<RollbackOutlined />}>
              คืนส่วนกลาง
            </Button>
          );
        }
        return null;
      },
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">ยืม-คืน อุปกรณ์ส่วนกลาง</h1>
        <Button type="primary" icon={<PlusOutlined />} onClick={openBorrowModal}>
          ทำเรื่องยืมอุปกรณ์ส่วนกลาง
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={historyList}
        rowKey="id"
        loading={loading}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        centered
        style={{ maxWidth: '95vw' }}
        title="ทำเรื่องยืมอุปกรณ์ส่วนกลาง"
        open={isBorrowModalVisible}
        onCancel={() => {
          setIsBorrowModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleBorrow}
          initialValues={{ borrower_name: currentUser }}
        >
          <Form.Item
            name="equipment_id"
            label="เลือกอุปกรณ์ออฟฟิศที่ต้องการยืม"
            rules={[{ required: true, message: 'กรุณาเลือกอุปกรณ์' }]}
          >
            <Select 
              showSearch 
              placeholder="พิมพ์เพื่อค้นหาชื่อ หรือ รหัสสินทรัพย์..."
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
            name="borrower_name"
            label="ชื่อผู้ยืม"
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ยืม' }]}
          >
            <Input readOnly className="bg-gray-100" />
          </Form.Item>

          <Form.Item
            name="remark"
            label="เหตุผล/นำไปใช้งานอะไร"
            rules={[{ required: true, message: 'กรุณาระบุเหตุผลที่ขอยืม' }]}
          >
            <Input.TextArea rows={3} placeholder="ระบุเหตุผล หรือรายละเอียดการนำไปใช้งาน" />
          </Form.Item>

          <Form.Item
            name="return_date"
            label="กำหนดคืน (ถ้ามี)"
          >
            <DatePicker className="w-full" format="YYYY-MM-DD HH:mm:ss" showTime />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <div className="flex gap-2">
              <Button onClick={() => setIsBorrowModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                ยืนยันการยืม
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        centered
        style={{ maxWidth: '95vw' }}
        title="ยืนยันการคืนอุปกรณ์ส่วนกลาง"
        open={isReturnModalVisible}
        onCancel={() => setIsReturnModalVisible(false)}
        footer={null}
      >
        <Form 
          form={returnForm} 
          layout="vertical" 
          onFinish={submitReturn}
        >
          <div className="mb-4 p-3 bg-red-50 text-red-800 rounded-md border border-red-100">
            <strong>คำเตือน:</strong> การคืนอุปกรณ์จำเป็นต้องมีผู้รับคืนเพื่อเป็นหลักฐานในการตรวจสอบ หากไม่มีชื่อผู้รับคืน จะไม่สามารถทำรายการได้
          </div>

          <Form.Item
            name="received_by"
            label="ชื่อผู้รับคืน (โปรดระบุให้ชัดเจน)"
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้รับคืนอุปกรณ์' }]}
          >
            <Input placeholder="เช่น Tawan (IT), สมชาย (HR) เป็นต้น" autoFocus />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <div className="flex gap-2">
              <Button onClick={() => setIsReturnModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" danger htmlType="submit" loading={submitting}>
                ยืนยันการคืนอุปกรณ์
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default BorrowEquipment;
