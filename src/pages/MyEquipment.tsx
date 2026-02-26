import React, { useState, useEffect } from 'react';
import { Button, Form, Select, message, Modal, Empty, Switch } from 'antd';
import { PlusCircleOutlined, UserOutlined, LaptopOutlined, BankOutlined, HomeOutlined } from '@ant-design/icons';
import api from '../api/axios';
import { jwtDecode } from 'jwt-decode';

interface Equipment {
  ID: number;
  category: string;
  asset_code: string;
  name: string;
  status: string;
  assigned_to?: string;
  current_location?: 'office' | 'home';
  is_borrowed?: boolean;
}

const MyEquipment: React.FC = () => {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]); // Current user's equipment
  const [availableEquipment, setAvailableEquipment] = useState<Equipment[]>([]); // Equipment available for binding
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();
  
  const [currentUser, setCurrentUser] = useState<string>('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        // Fallback to whichever username field logic the token has
        setCurrentUser(decoded.username || decoded.name || `User ID: ${decoded.id}`);
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchMyEquipment();
    }
  }, [currentUser]);

  const fetchMyEquipment = async () => {
    setLoading(true);
    try {
      // 1. Fetch personal equipment
      const eqResponse = await api.get('/equipment');
      const myItems = eqResponse.data.filter((eq: Equipment) => eq.assigned_to === currentUser);

      // 2. Fetch active borrowed equipment
      const historyResponse = await api.get('/equipment/history/active');
      const myBorrowedItems = historyResponse.data
        .filter((hist: any) => hist.borrower_name === currentUser)
        .map((hist: any) => ({
          ID: hist.equipment_id,
          category: hist.category,
          asset_code: hist.asset_code,
          name: hist.name,
          status: 'borrowed',
          current_location: 'office', // Default for central
          is_borrowed: true,
          history_id: hist.id
        }));

      // Combine both lists
      setEquipmentList([...myItems, ...myBorrowedItems]);

      // Items available to be bound (status is usable or blank)
      const availableItems = eqResponse.data.filter((eq: Equipment) => eq.status === 'usable' || eq.status === 'ว่าง');
      setAvailableEquipment(availableItems);
      
    } catch (error) {
      message.error('ดึงข้อมูลอุปกรณ์ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleBindEquipment = async (values: { asset_code: string }) => {
    setSubmitting(true);
    try {
      await api.post('/equipment/bind', { asset_code: values.asset_code });
      message.success('ผูกอุปกรณ์สำเร็จ');
      setIsModalVisible(false);
      form.resetFields();
      fetchMyEquipment();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'ผูกอุปกรณ์ไม่สำเร็จ ตรวจสอบรหัสสินทรัพย์อีกครั้ง');
    } finally {
      setSubmitting(false);
    }
  };
  const handleToggleLocation = async (id: number, checked: boolean) => {
    const newLocation = checked ? 'home' : 'office';
    try {
      await api.put(`/equipment/${id}/location`, { location: newLocation });
      message.success(`อัปเดตสถานะเป็นนำกลับบ้าน: ${checked ? 'ใช่' : 'ไม่ใช่'}`);
      setEquipmentList(prev => 
        prev.map(eq => eq.ID === id ? { ...eq, current_location: newLocation } : eq)
      );
    } catch (error) {
      message.error('ไม่สามารถอัปเดตสถานที่ใช้งานได้');
    }
  };


  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">ข้อมูลอุปกรณ์ส่วนตัว</h1>
        <Button 
          type="primary" 
          icon={<PlusCircleOutlined />} 
          onClick={() => setIsModalVisible(true)}
        >
          เพิ่มอุปกรณ์ที่ใช้งาน
        </Button>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 mb-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-2">โครงสร้างอุปกรณ์ในความดูแลของคุณ</h2>
        <p className="text-gray-500 mb-0">รายการด้านล่างแสดงโครงสร้างอุปกรณ์ที่คุณดำเนินการผูกรหัสสินทรัพย์ไว้ หากต้องการเพิ่มอุปกรณ์ให้กดปุ่มมุมขวาบน</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-20">กำลังโหลดโครงสร้าง...</div>
      ) : equipmentList.length === 0 ? (
        <Empty description="ยังไม่มีอุปกรณ์ที่ผูกกับคุณในขณะนี้" className="my-20" />
      ) : (
        <div className="w-full overflow-x-auto bg-gray-50/50 rounded-2xl border border-gray-100 py-16 px-8 min-h-[500px]">
          <div className="flex flex-col items-center min-w-max">
            
            {/* User Avatar Node */}
            <div className="relative flex flex-col items-center">
              <div className="z-10 w-32 h-32 bg-white rounded-full border-4 border-orange-500 shadow-xl flex flex-col items-center justify-center transition-transform hover:scale-105">
                <UserOutlined className="text-5xl text-orange-500 mb-2" />
                <span className="font-bold text-gray-800 px-3 text-center text-sm truncate w-full" title={currentUser}>
                  {currentUser}
                </span>
              </div>
              
              {/* Trunk Line downwards from user */}
              <div className="w-1.5 h-12 bg-orange-400"></div>
            </div>

            {/* Tree Branches */}
            <div className="flex justify-center">
              {equipmentList.map((eq, index) => {
                // Determine horizontal line visibility based on index
                const isFirst = index === 0;
                const isLast = index === equipmentList.length - 1;
                const isOnlyChild = equipmentList.length === 1;

                // Get adjacent items to determine line colors
                const prevEq = index > 0 ? equipmentList[index - 1] : null;
                const nextEq = index < equipmentList.length - 1 ? equipmentList[index + 1] : null;

                // Left line color
                const leftColor = isFirst || isOnlyChild ? 'bg-transparent' : (
                  prevEq?.is_borrowed && eq.is_borrowed ? 'bg-purple-400' :
                  !prevEq?.is_borrowed && !eq.is_borrowed ? 'bg-orange-400' :
                  'bg-gradient-to-r from-orange-400 to-purple-400' // If mixing, standard fallback or gradient
                );

                // Right line color
                const rightColor = isLast || isOnlyChild ? 'bg-transparent' : (
                  nextEq?.is_borrowed && eq.is_borrowed ? 'bg-purple-400' :
                  !nextEq?.is_borrowed && !eq.is_borrowed ? 'bg-orange-400' :
                  'bg-gradient-to-r from-purple-400 to-orange-400'
                );

                return (
                  <div key={eq.ID} className="relative flex flex-col items-center px-4 w-64">
                    {/* Horizontal Connector Line */}
                    <div className="absolute top-0 w-full flex h-1.5">
                      <div className={`h-full w-1/2 ${leftColor}`}></div>
                      <div className={`h-full w-1/2 ${rightColor}`}></div>
                    </div>
                    
                    {/* Vertical line connecting horizontal bar to the card */}
                    <div className={`w-1.5 h-8 ${eq.is_borrowed ? 'bg-purple-400' : 'bg-orange-400'}`}></div>
                    
                    {/* Equipment Card */}
                    <div className={`bg-white rounded-2xl border-2 shadow-md w-full p-5 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 ${eq.is_borrowed ? 'border-purple-300 hover:border-purple-500' : 'border-orange-200 hover:border-orange-400'}`}>
                      <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                        <span className={`text-xs font-bold px-2 py-1 rounded-md ${eq.is_borrowed ? 'bg-purple-100 text-purple-600' : 'bg-orange-100 text-orange-600'}`}>
                          {eq.category}
                        </span>
                        <LaptopOutlined className="text-gray-400 text-lg" />
                      </div>
                      <div className="font-bold text-gray-800 text-base mb-1 truncate" title={eq.name}>{eq.name}</div>
                      <div className="text-xs text-gray-500 font-mono tracking-tight bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block mb-3">
                        {eq.asset_code}
                      </div>

                      <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`w-2 h-2 rounded-full ${eq.is_borrowed ? 'bg-purple-500' : 'bg-orange-500'}`}></div>
                            <span className={eq.is_borrowed ? 'text-purple-600 font-bold' : 'text-gray-600'}>
                              {eq.is_borrowed ? 'ยืมจากส่วนกลาง' : (eq.status === 'in_use' ? 'ในครอบครอง' : 'อื่นๆ')}
                            </span>
                          </div>
                        </div>
                        
                        {!eq.is_borrowed && (
                          <div className="flex items-center justify-between bg-orange-50 p-2 rounded-md">
                            <span className="text-xs text-gray-600 font-medium">นำกลับบ้าน</span>
                            <Switch 
                              size="small"
                              checked={eq.current_location === 'home'}
                              onChange={(checked) => handleToggleLocation(eq.ID, checked)}
                              checkedChildren={<HomeOutlined />}
                              unCheckedChildren={<BankOutlined />}
                              className={`${eq.current_location === 'home' ? 'bg-orange-500' : 'bg-gray-300'}`}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <Modal
        centered
        style={{ maxWidth: '95vw' }}
        title="เพิ่มอุปกรณ์ที่ใช้งาน (ผูกรหัสสินทรัพย์)"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <div className="mb-4 p-3 bg-blue-50 text-blue-800 rounded-md text-base border border-blue-100 shadow-sm">
          เลือกอุปกรณ์ที่คุณกำลังใช้งานอยู่จากรายการด้านล่าง เพื่อนำมาผูกและสร้างผังความรับผิดชอบของคุณ
        </div>
        
        <Form form={form} layout="vertical" onFinish={handleBindEquipment}>
          <Form.Item
            name="asset_code"
            label="เลือกอุปกรณ์ส่วนตัว"
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
                value: eq.asset_code,
                label: `[${eq.asset_code}] ${eq.name} (${eq.category})`
              }))}
            />
          </Form.Item>

          <Form.Item className="mb-0 flex justify-end">
            <div className="flex gap-2">
              <Button onClick={() => setIsModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                ยืนยันการผูกอุปกรณ์
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default MyEquipment;
