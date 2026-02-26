import React, { useState } from 'react';
import { Form, Input, Button, Card, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', values);
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-yellow-100 via-orange-300 to-orange-500">
      {/* Decorative Geometric Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-white/20 rotate-[30deg] transform origin-center rounded-[3rem] backdrop-blur-sm shadow-xl transition-transform hover:scale-105 duration-1000"></div>
      <div className="absolute top-[25%] right-[-20%] w-[70%] h-[70%] bg-white/30 rotate-[45deg] transform origin-center rounded-[4rem] backdrop-blur-md shadow-2xl transition-transform hover:-scale-105 duration-1000"></div>
      <div className="absolute bottom-[-15%] left-[5%] w-[50%] h-[50%] bg-white/20 rotate-[15deg] transform origin-center rounded-[2.5rem] backdrop-blur-sm shadow-lg"></div>
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAiLz4KPHJlY3QgeT0iMiIgd2lkdGg9IjIiIGhlaWdodD0iMiIgZmlsbD0iI2ZmZiIgZmlsbC1vcGFjaXR5PSIwLjE1Ii8+CjxyZWN0IHg9IjIiIHdpZHRoPSIyIiBoZWlnaHQ9IjIiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xNSIvPgo8L3N2Zz4=')] opacity-40"></div>

      <div className="relative z-10 w-full max-w-md px-4 perspective-1000">
        <Card 
          className="shadow-2xl rounded-2xl border-0 bg-white/95 backdrop-blur-lg overflow-hidden transform transition-all duration-500 hover:shadow-orange-500/20"
          styles={{ body: { padding: '2.5rem' } }}
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-tr from-orange-100 to-yellow-50 mb-4 shadow-inner border border-orange-50">
              <LockOutlined className="text-4xl text-orange-500" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">ระบบ <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">BMU</span></h2>
            <p className="text-gray-500 mt-2 font-medium">ลงชื่อเข้าใช้เพื่อเริ่มต้นการทำงาน</p>
          </div>

          <Form
            name="login_form"
            initialValues={{ remember: true }}
            onFinish={onFinish}
            size="large"
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'กรุณากรอกชื่อผู้ใช้!' }]}
            >
              <Input 
                prefix={<UserOutlined className="text-gray-400 mr-2" />} 
                placeholder="ชื่อผู้ใช้" 
                className="rounded-xl px-4 py-3 hover:border-orange-400 focus:border-orange-500 transition-colors"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'กรุณากรอกรหัสผ่าน!' }]}
            >
              <Input.Password 
                prefix={<LockOutlined className="text-gray-400 mr-2" />} 
                placeholder="รหัสผ่าน" 
                className="rounded-xl px-4 py-3 hover:border-orange-400 focus:border-orange-500 transition-colors"
              />
            </Form.Item>

            <Form.Item className="mt-10 mb-0">
              <Button
                type="primary"
                htmlType="submit"
                icon={<LoginOutlined />}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 border-none h-14 rounded-xl text-lg font-bold shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
                loading={loading}
              >
                เข้าสู่ระบบ
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
