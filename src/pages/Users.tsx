import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, Tag, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Option } = Select;

interface User {
  ID: number;
  username: string;
  first_name: string;
  last_name: string;
  department: string;
  role: string;
}

const UsersPage: React.FC = () => {
  const [userList, setUserList] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUserList(response.data);
    } catch (error: any) {
      message.error('ดึงข้อมูลผู้ใช้งานไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (values: any) => {
    try {
      await api.post('/users', values);
      message.success('เพิ่มผู้ใช้งานสำเร็จ');
      setIsModalVisible(false);
      form.resetFields();
      fetchUsers();
    } catch (error: any) {
      if (error.response && error.response.status === 403) {
        message.error('คุณไม่มีสิทธิ์ในการเพิ่มผู้ใช้งาน');
      } else {
        message.error('เพิ่มผู้ใช้งานไม่สำเร็จ');
      }
    }
  };

  const handleDeleteUser = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      message.success('ลบผู้ใช้งานสำเร็จ');
      fetchUsers();
    } catch (error: any) {
      message.error('ลบผู้ใช้งานไม่สำเร็จ');
    }
  };

  const columns = [
    {
      title: 'ชื่อผู้ใช้',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'ชื่อ-นามสกุล',
      key: 'name',
      render: (_: any, record: User) => `${record.first_name} ${record.last_name}`,
    },
    {
      title: 'แผนก',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'สิทธิ์',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={role === 'IT' ? 'orange' : role === 'HR' ? 'purple' : role === 'OwnerBMU' ? 'gold' : role === 'Head' ? 'geekblue' : 'default'}>
          {role}
        </Tag>
      ),
    },
    {
      title: 'จัดการ',
      key: 'action',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteUser(record.ID)}
          />
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold">จัดการผู้ใช้งาน</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setIsModalVisible(true)}
        >
          เพิ่มผู้ใช้งาน
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={userList}
        rowKey="ID"
        loading={loading}
        scroll={{ x: 'max-content' }}
      />

      <Modal
        centered
        style={{ maxWidth: '95vw' }}
        title="เพิ่มผู้ใช้งานใหม่"
        open={isModalVisible}
        onCancel={() => {
          setIsModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddUser}>
          <Form.Item
            name="username"
            label="ชื่อผู้ใช้"
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="password"
            label="รหัสผ่าน"
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน' }]}
          >
            <Input.Password />
          </Form.Item>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
            <Form.Item
              name="first_name"
              label="ชื่อจริง"
              rules={[{ required: true, message: 'จำเป็นต้องกรอก' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              name="last_name"
              label="นามสกุล"
              rules={[{ required: true, message: 'จำเป็นต้องกรอก' }]}
            >
              <Input />
            </Form.Item>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
             <Form.Item
              name="department"
              label="แผนก"
              rules={[{ required: true, message: 'จำเป็นต้องกรอก' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item 
                name="role" 
                label="สิทธิ์" 
                initialValue="Normal" 
                rules={[{ required: true, message: 'จำเป็นต้องกรอก' }]}
            >
              <Select>
                <Option value="Normal">Normal</Option>
                <Option value="HR">HR</Option>
                <Option value="IT">IT</Option>
                <Option value="OwnerBMU">OwnerBMU</Option>
                <Option value="Head">Head</Option>
              </Select>
            </Form.Item>
          </div>
         
          <Form.Item className="mb-0 flex justify-end">
            <Space>
              <Button onClick={() => setIsModalVisible(false)}>ยกเลิก</Button>
              <Button type="primary" htmlType="submit">
                เพิ่มผู้ใช้งาน
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UsersPage;
