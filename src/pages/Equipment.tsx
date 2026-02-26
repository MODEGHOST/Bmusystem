import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined, KeyOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

const { Option } = Select;

interface Equipment {
  ID: number;
  category: string;
  sub_category?: string;
  asset_group_code?: string;
  asset_code: string;
  name: string;
  unit?: string;
  description?: string;
  ref_document?: string;
  status: string;
  assigned_to?: string;
  assigned_date?: string;
  checklist?: string;
  is_leased?: boolean | number;
  created_at: string;
}

interface Password {
  ID: number;
  equipment_id: number;
  password: string;
  note: string;
}

const EquipmentPage: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [form] = Form.useForm();
  
  // Passwords Modal State
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [currentEquipment, setCurrentEquipment] = useState<Equipment | null>(null);
  const [passwords, setPasswords] = useState<Password[]>([]);
  const [passwordForm] = Form.useForm();
  
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    fetchEquipment();
    fetchCategories();
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        setUserRole(decoded.role);
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
  }, []);

  const hasElevatedAccess = ['HR', 'IT', 'OwnerBMU', 'Head'].includes(userRole || '');

  const fetchCategories = async () => {
    try {
      const response = await api.get('/equipment/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Failed to fetch categories', error);
    }
  };

  const fetchEquipment = async () => {
    setLoading(true);
    try {
      const response = await api.get('/equipment');
      setEquipmentList(response.data);
    } catch (error) {
      message.error('ดึงข้อมูลอุปกรณ์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEquipment = async (values: any) => {
    try {
      const finalData = {
        ...values,
        category: values.category === 'อื่นๆ' ? values.customCategory : values.category
      };
      // We don't send customCategory to the backend
      delete finalData.customCategory;

      await api.post('/equipment', finalData);
      message.success('เพิ่มอุปกรณ์สำเร็จ');
      setIsModalVisible(false);
      setIsOtherCategory(false);
      form.resetFields();
      fetchEquipment();
      fetchCategories();
    } catch (error: any) {
      console.error('Add Equipment Error:', error);
      message.error(`เพิ่มอุปกรณ์ไม่สำเร็จ: ${error.response?.data?.message || 'เกิดข้อผิดพลาดที่เซิร์ฟเวอร์'}`);
    }
  };

  const handleDeleteEquipment = (id: number) => {
    Modal.confirm({
      centered: true,
      title: 'ยืนยันการลบอุปกรณ์',
      content: 'คุณแน่ใจหรือไม่ว่าต้องการลบอุปกรณ์ชิ้นนี้? ข้อมูลทั้งหมดที่เกี่ยวข้องจะถูกลบและไม่สามารถกู้คืนได้',
      okText: 'ลบข้อมูล',
      cancelText: 'ยกเลิก',
      okType: 'danger',
      onOk: async () => {
        try {
          await api.delete(`/equipment/${id}`);
          message.success('ลบอุปกรณ์สำเร็จ');
          fetchEquipment();
        } catch (error) {
          message.error('ลบอุปกรณ์ไม่สำเร็จ');
        }
      }
    });
  };

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.put(`/equipment/${id}/status`, { status });
      message.success('อัปเดตสถานะสำเร็จ');
      fetchEquipment();
    } catch (error) {
      message.error('อัปเดตสถานะไม่สำเร็จ');
    }
  };

  // Passwords Handlers
  const fetchPasswords = async (equipmentId: number) => {
    try {
      const response = await api.get(`/equipment/${equipmentId}/passwords`);
      setPasswords(response.data);
    } catch (error) {
      message.error('ดึงข้อมูลรหัสผ่านไม่สำเร็จ');
    }
  };

  const openPasswordModal = (equipment: Equipment) => {
    setCurrentEquipment(equipment);
    fetchPasswords(equipment.ID);
    setIsPasswordModalVisible(true);
  };

  const handleAddPassword = async (values: any) => {
    if (!currentEquipment) return;
    try {
      await api.post(`/equipment/${currentEquipment.ID}/passwords`, values);
      message.success('เพิ่มรหัสผ่านสำเร็จ');
      passwordForm.resetFields();
      fetchPasswords(currentEquipment.ID);
    } catch (error) {
      message.error('เพิ่มรหัสผ่านไม่สำเร็จ');
    }
  };
  
  const handleDeletePassword = async (passwordId: number) => {
     try {
      await api.delete(`/equipment/passwords/${passwordId}`);
      message.success('ลบรหัสผ่านสำเร็จ');
      if (currentEquipment) fetchPasswords(currentEquipment.ID);
    } catch (error) {
      message.error('ลบรหัสผ่านไม่สำเร็จ');
    }
  }

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
      render: (text: string, record: Equipment) => (
        <span>
          {text} {record.is_leased ? <Tag color="blue" className="ml-2">เช่ามา</Tag> : null}
        </span>
      ),
    },
    {
      title: 'สถานะ',
      dataIndex: 'status',
      key: 'status',
      render: (status: string, record: any) => (
        <Tag color={status === 'usable' ? 'green' : status === 'in_use' || status === 'borrowed' ? 'purple' : status === 'broken' ? 'red' : 'orange'}>
          {status === 'usable' ? 'ใช้งานได้' : status === 'in_use' ? `ผู้กำลังใช้งาน: ${record.assigned_to || '-'}` : status === 'borrowed' ? 'อยู่ระหว่างการยืมกลาง' : status === 'broken' ? 'เสีย' : 'รอซ่อม'}
        </Tag>
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: Equipment) => (
        <Space size="middle">
          <Button
            type="primary"
            onClick={() => {
              setSelectedEquipment(record);
              setIsDetailModalVisible(true);
            }}
          >
            ดูรายละเอียด
          </Button>
          {hasElevatedAccess && (
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteEquipment(record.ID)}
            />
          )}
        </Space>
      ),
    },
  ];
  
   const passwordColumns = [
    {
      title: 'รหัสผ่าน',
      dataIndex: 'password',
      key: 'password',
    },
    {
      title: 'บันทึก',
      dataIndex: 'note',
      key: 'note',
    },
    {
        title: 'จัดการ',
        key: 'action',
        render: (_:any, record: Password) => (
            hasElevatedAccess && (
             <Button type="link" danger onClick={() => handleDeletePassword(record.ID)}>
                ลบ
             </Button>
            )
        )
    }
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">จัดการอุปกรณ์</h1>
        {hasElevatedAccess && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setIsModalVisible(true)}
          >
            เพิ่มอุปกรณ์
          </Button>
        )}
      </div>

      <Table
        columns={columns}
        dataSource={equipmentList}
        rowKey="ID"
        loading={loading}
        scroll={{ x: 'max-content' }}
      />

      {/* Detail Modal */}
      <Modal
        centered
        width={800}
        style={{ maxWidth: '95vw' }}
        title={`รายละเอียดอุปกรณ์: ${selectedEquipment?.asset_code}`}
        open={isDetailModalVisible}
        onCancel={() => {
          setIsDetailModalVisible(false);
          setSelectedEquipment(null);
        }}
        footer={null}
      >
        {selectedEquipment && (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-6 text-base">
              <div><span className="font-bold text-gray-500 mr-2">ชื่ออุปกรณ์:</span> {selectedEquipment.name}</div>
              <div><span className="font-bold text-gray-500 mr-2">หมวดหมู่:</span> {selectedEquipment.category}</div>
              <div><span className="font-bold text-gray-500 mr-2">รหัสสินทรัพย์:</span> {selectedEquipment.asset_code}</div>
              
              <div><span className="font-bold text-gray-500 mr-2">หน่วย:</span> {selectedEquipment.unit || '-'}</div>
              <div><span className="font-bold text-gray-500 mr-2">เลขที่เอกสารอ้างอิง:</span> {selectedEquipment.ref_document || '-'}</div>
              <div className="md:col-span-2"><span className="font-bold text-gray-500 mr-2">ลักษณะเครื่อง/คำอธิบาย:</span> {selectedEquipment.description || '-'}</div>
              <div className="md:col-span-2"><span className="font-bold text-gray-500 mr-2">Checklist:</span> {selectedEquipment.checklist || '-'}</div>
              <div><span className="font-bold text-gray-500 mr-2">อุปกรณ์เช่า:</span> {selectedEquipment.is_leased ? <span className="text-blue-600 font-bold">ใช่ (เช่ามา)</span> : 'ไม่ใช่'}</div>
            </div>

            {/* Status Change Area */}
            {hasElevatedAccess && (
              <div className="bg-gray-50 p-4 rounded-md flex flex-col sm:flex-row sm:items-center gap-4">
                <span className="font-bold">เปลี่ยนสถานะเครื่อง:</span>
                <Select
                  value={selectedEquipment.status}
                  onChange={(value) => {
                    handleStatusChange(selectedEquipment.ID, value);
                    // Update local state to reflect UI change immediately
                    setSelectedEquipment({...selectedEquipment, status: value});
                  }}
                  style={{ width: 150 }}
                >
                  <Option value="usable">ใช้งานได้</Option>
                  <Option value="broken">เสีย</Option>
                  <Option value="needs_repair">รอซ่อม</Option>
                </Select>
                {(selectedEquipment.status === 'borrowed' || selectedEquipment.status === 'in_use') && (
                  <span className="text-orange-500 text-sm ml-2">*อุปกรณ์ถูกใช้งานอยู่ หากต้องการเปลี่ยนสถานะกรุณาทำเรื่องคืนเครื่องก่อน</span>
                )}
              </div>
            )}

            {/* Passwords Management */}
            {hasElevatedAccess && (
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-lg">จัดการรหัสผ่าน</h3>
                  <Button type="dashed" icon={<KeyOutlined />} onClick={() => openPasswordModal(selectedEquipment)}>
                    เปิดหน้ารหัสผ่าน
                  </Button>
                </div>
                <p className="text-sm text-gray-500">เก็บรหัสผ่านที่เกี่ยวข้องกับอุปกรณ์ชิ้นนี้ เช่น BIOS, แอดมิน</p>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
                <Button onClick={() => setIsDetailModalVisible(false)}>ปิดหน้าต่าง</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Equipment Modal */}
      <Modal
        centered
        width={800}
        style={{ maxWidth: '95vw' }}
        title="เพิ่มอุปกรณ์ใหม่"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddEquipment}>
          <div className={`grid gap-4 ${isOtherCategory ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 md:grid-cols-2'}`}>
            <Form.Item name="category" label="หมวดหมู่" rules={[{ required: true, message: 'กรุณาเลือกหรือระบุหมวดหมู่' }]}>
              <Select 
                 placeholder="เลือกหมวดหมู่" 
                 onChange={(val) => setIsOtherCategory(val === 'อื่นๆ')}
              >
                {categories.map((c: string) => <Option key={c} value={c}>{c}</Option>)}
                <Option value="อื่นๆ">อื่นๆ (ระบุเอง)</Option>
              </Select>
            </Form.Item>
            {isOtherCategory && (
              <Form.Item name="customCategory" label="ระบุหมวดหมู่ใหม่" rules={[{ required: true, message: 'กรุณาระบุหมวดหมู่' }]}>
                <Input placeholder="เช่น Notebook, Mouse" />
              </Form.Item>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="asset_code"
              label="รหัสสินทรัพย์"
              rules={[{ required: true, message: 'กรุณากรอกรหัสสินทรัพย์' }]}
            >
              <Input placeholder="เช่น SOF-001" />
            </Form.Item>
            <Form.Item
              name="name"
              label="ชื่อสินทรัพย์"
              rules={[{ required: true, message: 'กรุณากรอกชื่อสินทรัพย์' }]}
            >
              <Input placeholder="เช่น Notebook Acer" />
            </Form.Item>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="unit" label="หน่วย">
              <Input placeholder="เช่น เครื่อง, สิทธิ" />
            </Form.Item>
            <Form.Item name="ref_document" label="เลขที่เอกสารอ้างอิง">
              <Input />
            </Form.Item>
          </div>
          
          <Form.Item name="description" label="คำอธิบายสินทรัพย์">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="checklist" label="Checklist (บันทึกเพิ่มเติม)">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="status" label="สถานะเริ่มต้น" initialValue="usable">
            <Select>
              <Option value="usable">ใช้งานได้</Option>
              <Option value="broken">เสีย</Option>
              <Option value="needs_repair">รอซ่อม</Option>
            </Select>
          </Form.Item>

          <Form.Item name="is_leased" valuePropName="checked" className="mb-6">
            <Checkbox className="font-medium text-blue-600">เป็นอุปกรณ์เช่า (Leased Equipment)</Checkbox>
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => { setIsModalVisible(false); setIsOtherCategory(false); form.resetFields(); }}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit">
                เพิ่ม
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Passwords Modal */}
      <Modal
        centered
        title={`รหัสผ่านสำหรับ ${currentEquipment?.name} (${currentEquipment?.asset_code})`}
        open={isPasswordModalVisible}
        onCancel={() => {
          setIsPasswordModalVisible(false);
          setCurrentEquipment(null);
          passwordForm.resetFields();
        }}
        footer={null}
        width={600}
        style={{ maxWidth: '95vw' }}
      >
        {hasElevatedAccess && (
          <Form
            form={passwordForm}
            layout="inline"
            onFinish={handleAddPassword}
            className="mb-4"
          >
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
            >
              <Input.Password placeholder="รหัสผ่าน" />
            </Form.Item>
            <Form.Item name="note">
              <Input placeholder="บันทึก (เช่น BIOS, แอดมิน)" />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                เพิ่ม
              </Button>
            </Form.Item>
          </Form>
        )}
        <Table
          columns={passwordColumns}
          dataSource={passwords}
          rowKey="ID"
          size="small"
          pagination={false}
        />
      </Modal>
    </div>
  );
};

export default EquipmentPage;
