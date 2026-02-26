import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, message, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import api from '../api/axios';

const { Text } = Typography;

interface PasswordRecord {
  id: number;
  title: string;
  username: string;
  password?: string;
  details?: string;
  remark?: string;
  updated_at: string;
}

const PasswordManager: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  
  const [passwords, setPasswords] = useState<PasswordRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  const [form] = Form.useForm();

  useEffect(() => {
    if (isUnlocked) {
      fetchPasswords();
    }
  }, [isUnlocked]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '9669') {
      setIsUnlocked(true);
      setPinError(false);
      message.success('ปลดล็อคสำเร็จ');
    } else {
      setPinError(true);
      setPin('');
      message.error('รหัส PIN ไม่ถูกต้อง');
    }
  };

  const lockAgain = () => {
    setIsUnlocked(false);
    setPin('');
    setPasswords([]);
  };

  const fetchPasswords = async () => {
    setLoading(true);
    try {
      const response = await api.get('/passwords');
      setPasswords(response.data);
    } catch (error) {
      message.error('ไม่สามารถดึงข้อมูลรหัสผ่านได้');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const openEditModal = (record: PasswordRecord) => {
    setEditingId(record.id);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = (id: number) => {
    Modal.confirm({
      centered: true,
      title: 'ยืนยันการลบรหัสผ่าน',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลนี้? การกระทำนี้ไม่สามารถย้อนกลับได้',
      okText: 'ลบข้อมูล',
      okType: 'danger',
      cancelText: 'ยกเลิก',
      onOk: async () => {
        try {
          await api.delete(`/passwords/${id}`);
          message.success('ลบรหัสผ่านสำเร็จ');
          fetchPasswords();
        } catch (error) {
          message.error('ไม่สามารถลบรหัสผ่านได้');
        }
      }
    });
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/passwords/${editingId}`, values);
        message.success('อัพเดทข้อมูลสำเร็จ');
      } else {
        await api.post('/passwords', values);
        message.success('เพิ่มข้อมูลสำเร็จ');
      }
      setIsModalVisible(false);
      fetchPasswords();
    } catch (error) {
      message.error(editingId ? 'ไม่สามารถอัพเดทข้อมูลได้' : 'ไม่สามารถเพิ่มข้อมูลได้');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'หัวข้อที่บันทึก',
      dataIndex: 'title',
      key: 'title',
      width: '20%',
    },
    {
      title: 'ชื่อผู้ใช้ (Username)',
      dataIndex: 'username',
      key: 'username',
      width: '15%',
    },
    {
      title: 'รหัสผ่าน (Password)',
      dataIndex: 'password',
      key: 'password',
      width: '15%',
      render: (text: string) => (
        <Input.Password 
          value={text} 
          readOnly 
          bordered={false} 
          iconRender={visible => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          className="bg-transparent"
        />
      ),
    },
    {
      title: 'รายละเอียด (Details / Text ยาวๆ)',
      dataIndex: 'details',
      key: 'details',
      width: '20%',
      render: (text: string) => <div className="max-h-20 overflow-y-auto whitespace-pre-wrap">{text || '-'}</div>,
    },
    {
      title: 'หมายเหตุ',
      dataIndex: 'remark',
      key: 'remark',
      width: '15%',
      render: (text: string) => text || '-',
    },
    {
      title: 'จัดการ',
      key: 'action',
      width: '15%',
      render: (_: any, record: PasswordRecord) => (
        <Space size="middle">
          <Button type="primary" icon={<EditOutlined />} size="small" onClick={() => openEditModal(record)}>
            แก้ไข
          </Button>
          <Button danger icon={<DeleteOutlined />} size="small" onClick={() => handleDelete(record.id)}>
            ลบ
          </Button>
        </Space>
      ),
    },
  ];

  // PIN Lock Screen View
  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-sm border border-gray-100 text-center relative overflow-hidden">
          <div className="bg-gray-50 text-gray-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <LockOutlined className="text-3xl" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-gray-800">คลังเก็บรหัสผ่านส่วนกลาง</h2>
          <Text className="block mb-8 text-gray-500">
            กรุณาใส่รหัสผ่าน 4 หลัก เพื่อยืนยันตัวตน
          </Text>
          
          <form onSubmit={handlePinSubmit}>
            <div className="mb-6 flex justify-center">
              <Input.OTP 
                 length={4} 
                 mask="⚫" 
                 value={pin}
                 onChange={setPin}
                 autoFocus
                 size="large"
                 status={pinError ? 'error' : ''}
                 style={{ gap: '16px' }}
                 className="custom-otp-input"
              />
            </div>
            {pinError && <div className="text-red-500 mb-4 text-sm">รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่</div>}
            
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large" 
              block 
              className="bg-[#1f2937] hover:bg-[#374151] border-none rounded-lg h-12 text-base font-medium"
            >
              ยืนยันรหัสผ่าน
            </Button>
          </form>
          
          {/* Decorative CSS specifically for OTP inner inputs */}
          <style>{`
            .custom-otp-input input {
               background-color: #fef08a !important; /* Yellow-100 */
               border: 1px solid #93c5fd !important; /* Blue-300 */
               border-radius: 8px !important;
               width: 50px !important;
               height: 50px !important;
               font-size: 24px !important;
            }
            .custom-otp-input input:focus {
               border-color: #3b82f6 !important;
               box-shadow: 0 0 0 2px rgba(59,130,246,0.2) !important;
               background-color: #fdf08a !important;
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Main Password Manager View
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1 flex items-center gap-2">
            <UnlockOutlined className="text-orange-500" /> จัดการรหัสผ่านในบริษัท
          </h1>
          <Text type="secondary">เก็บรักษารหัสผ่านสำคัญต่างๆ อย่างปลอดภัยและเป็นความลับ</Text>
        </div>
        <div className="flex gap-2">
          <Button onClick={lockAgain} icon={<LockOutlined />}>
            ล็อคหน้าจอนี้
          </Button>
          <Button type="primary" className="bg-orange-500" icon={<PlusOutlined />} onClick={openAddModal}>
            เพิ่มรหัสผ่านใหม่
          </Button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <Table
          columns={columns}
          dataSource={passwords}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 15 }}
          bordered
          scroll={{ x: 'max-content' }}
        />
      </div>

      {/* Add/Edit Modal */}
      <Modal
        title={editingId ? "แก้ไขข้อมูลรหัสผ่าน" : "เพิ่มข้อมูลรหัสผ่านใหม่"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={600}
        style={{ maxWidth: '95vw' }}
        centered
        destroyOnClose
      >
        <Form 
          form={form} 
          layout="vertical" 
          onFinish={handleSubmit}
          className="mt-4"
        >
          <Form.Item
            name="title"
            label="หัวข้อ/ชื่อรายการ"
            rules={[{ required: true, message: 'กรุณากรอกหัวข้อ' }]}
          >
            <Input placeholder="เช่น รหัสผ่านเข้า Server กลาง, รหัส WiFi ออฟฟิศ" />
          </Form.Item>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="username"
              label="ชื่อผู้ใช้ (Username)"
              rules={[{ required: true, message: 'กรุณากรอก Username' }]}
            >
              <Input placeholder="admin, user@company.com" />
            </Form.Item>

            <Form.Item
              name="password"
              label="รหัสผ่าน (Password)"
              rules={[{ required: true, message: 'กรุณากรอก Password' }]}
            >
              <Input.Password placeholder="รหัสผ่าน" />
            </Form.Item>
          </div>

          <Form.Item
            name="details"
            label="รายละเอียดเพิ่มเติม (ข้อความยาวๆ)"
          >
            <Input.TextArea 
              rows={4} 
              placeholder="สามารถใส่รายละเอียดต่างๆ โค้ดที่เกี่ยวข้อง หรือลิงก์ล็อกอินที่ต้องจำได้ที่นี่..." 
            />
          </Form.Item>

          <Form.Item
            name="remark"
            label="หมายเหตุ"
          >
            <Input placeholder="บันทึกข้อความสั้นๆ หรือสิ่งที่ต้องระวัง" />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" loading={submitting} className="bg-orange-500">
                {editingId ? 'บันทึกการเปลี่ยนแปลง' : 'เพิ่มรหัสผ่าน'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

    </div>
  );
};

export default PasswordManager;
