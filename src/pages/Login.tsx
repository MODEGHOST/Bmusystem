import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', values);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        message.success('เข้าสู่ระบบสำเร็จ!');
        navigate('/dashboard/equipment');
      }
    } catch (error: any) {
      if (error.response && error.response.status === 401) {
        message.error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      } else {
        message.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg rounded-xl overflow-hidden">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800">ระบบจัดการภายใน BMU</h2>
          <p className="text-gray-500 text-sm mt-2">ลงชื่อเข้าใช้เพื่อจัดการอุปกรณ์และผู้ใช้งาน</p>
        </div>

        <Form
          name="login_form"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          size="large"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้!' }]}
          >
            <Input prefix={<UserOutlined className="text-gray-400" />} placeholder="ชื่อผู้ใช้" />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน!' }]}
          >
            <Input.Password prefix={<LockOutlined className="text-gray-400" />} placeholder="รหัสผ่าน" />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full bg-orange-500 hover:bg-orange-600 border-none"
              loading={loading}
            >
              เข้าสู่ระบบ
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
