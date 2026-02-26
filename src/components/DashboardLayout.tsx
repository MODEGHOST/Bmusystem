import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Avatar, Dropdown, ConfigProvider, Badge } from 'antd';
import type { MenuProps } from 'antd';
import {
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  SwapOutlined,
  ToolOutlined,
  DesktopOutlined,
  CheckSquareOutlined,
  PieChartOutlined,
  AppstoreOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api/axios';

const { Header, Sider, Content } = Layout;

interface DecodedToken {
  id: number;
  role: string;
  department: string;
  username: string;
  first_name: string;
  last_name: string;
  exp: number;
}

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string>('');
  const [userDept, setUserDept] = useState<string>('');
  const [pendingCount, setPendingCount] = useState<number>(0);

  const fetchPendingRequests = async () => {
    try {
      const response = await api.get('/equipment/history/pending');
      setPendingCount(response.data.length);
    } catch (error) {
      console.error('Error fetching pending requests for badge:', error);
    }
  };

  useEffect(() => {
    const handleRequestUpdate = () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decoded: DecodedToken = jwtDecode(token);
                if (['HR', 'IT', 'OwnerBMU', 'Head'].includes(decoded.role)) {
                    fetchPendingRequests();
                }
            } catch (e) {
                // Ignore silent errors
            }
        }
    };

    window.addEventListener('request-update', handleRequestUpdate);

    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded: DecodedToken = jwtDecode(token);
        setUserRole(decoded.role);
        setUserFullName(`${decoded.first_name || ''} ${decoded.last_name || ''}`.trim());
        setUserDept(decoded.department || '');
        
        // Fetch pending requests immediately if user has approval rights
        if (['HR', 'IT', 'OwnerBMU', 'Head'].includes(decoded.role)) {
           fetchPendingRequests();
        }
      } catch (error) {
        console.error('Invalid token', error);
      }
    }
    
    // Set up polling for pending requests every 30 seconds
    const intervalId = setInterval(() => {
        const currentToken = localStorage.getItem('token');
        if (currentToken) {
            try {
                const decoded: DecodedToken = jwtDecode(currentToken);
                if (['HR', 'IT', 'OwnerBMU', 'Head'].includes(decoded.role)) {
                    fetchPendingRequests();
                }
            } catch (e) {
                // Ignore silent errors during polling
            }
        }
    }, 30000);

      return () => {
        clearInterval(intervalId);
        window.removeEventListener('request-update', handleRequestUpdate);
      };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = React.useMemo(() => [
    {
      key: '/dashboard/summary',
      icon: <PieChartOutlined />,
      label: 'ภาพรวมระบบ',
    },
    {
      key: '/dashboard/equipment',
      icon: <AppstoreOutlined />,
      label: 'อุปกรณ์ทั้งหมด',
    },
    {
      key: '/dashboard/borrow',
      icon: <SwapOutlined />,
      label: 'ยืมอุปกรณ์',
    },
    {
      key: '/dashboard/my-equipment',
      icon: <DesktopOutlined />,
      label: 'ข้อมูลอุปกรณ์ส่วนตัว',
    },
    {
      key: '/dashboard/report-broken',
      icon: <ToolOutlined />,
      label: 'แจ้งอุปกรณ์เสีย',
    },
    ...(userRole && ['HR', 'IT', 'OwnerBMU', 'Head'].includes(userRole)
      ? [
          {
            key: '/dashboard/approval-requests',
            icon: <CheckSquareOutlined />,
            label: (
              <Badge count={pendingCount} offset={[15, 0]}>
                <span>คำขออนุมัติ</span>
              </Badge>
            ),
          },
          {
            key: '/dashboard/users',
            icon: <UserOutlined />,
            label: 'จัดการผู้ใช้งาน',
          },
        ]
      : []),
    ...(userRole && ['IT', 'OwnerBMU'].includes(userRole)
      ? [
          {
            key: '/dashboard/passwords',
            icon: <KeyOutlined />,
            label: 'จัดการรหัสผ่าน',
          },
        ]
      : []),
  ], [userRole, pendingCount]);

  const avatarMenuItems: MenuProps['items'] = [
    {
      key: 'user-info',
      label: (
        <div className="flex flex-col px-1 py-1">
          <span className="font-bold text-gray-800">{userFullName || 'ผู้ใช้งาน'}</span>
          <span className="text-xs text-gray-500 mt-1">
            แผนก: {userDept} <span className="text-orange-600 font-medium ml-1">[{userRole}]</span>
          </span>
        </div>
      ),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined className="text-red-500" />,
      label: <span className="text-red-500 font-medium">ออกจากระบบ</span>,
      onClick: handleLogout,
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#ea580c', // Orange 600
          borderRadius: 8,
          controlHeightLG: 48, // larger height for easier taps
        },
        components: {
          Menu: {
            itemHeight: 50,
            itemBorderRadius: 8,
          },
          Button: {
            controlHeight: 40,
          },
        },
      }}
    >
      <Layout className="min-h-screen">
        <Sider 
          theme="light"
          style={{ backgroundColor: '#ffffff' }}
          trigger={null} 
          collapsible 
          collapsed={collapsed} 
          breakpoint="lg"
          collapsedWidth="0"
          width={280}
          onBreakpoint={(broken) => {
            if (broken) {
              setCollapsed(true);
            }
          }}
          className="shadow-md z-50 fixed lg:relative h-full border-r border-gray-100"
        >
          <div className="h-16 flex items-center justify-center m-2 font-bold text-lg text-orange-600 truncate border-b">
            {!collapsed ? 'ระบบ BMU' : 'BMU'}
          </div>
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={({ key }) => {
              navigate(key);
              if (window.innerWidth < 1024) {
                setCollapsed(true);
              }
            }}
            className="h-full border-r-0 text-base font-medium text-gray-700"
          />
        </Sider>
        <Layout className="site-layout">
          <Header 
            className="!bg-white p-0 flex justify-between items-center shadow-sm px-4 md:px-6 relative z-40 border-b border-gray-100 h-16"
            style={{ backgroundColor: '#ffffff' }}
          >
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="text-xl w-12 h-12 flex items-center justify-center rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors"
            />
            <div className="flex items-center gap-3">
              {/* Desktop View */}
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex flex-col text-right">
                  <span className="font-medium text-gray-800 text-sm leading-tight">
                    {userFullName || 'ผู้ใช้งาน'}
                  </span>
                  <span className="text-xs text-gray-500 leading-tight">
                    {userDept} <span className="text-orange-600 ml-1 font-medium">[{userRole}]</span>
                  </span>
                </div>
                <div className="w-px h-8 bg-gray-200 mx-1"></div>
                <Button 
                    type="text" 
                    danger 
                    icon={<LogoutOutlined />} 
                    onClick={handleLogout}
                    className="font-medium hover:bg-red-50 h-10 px-4 rounded-lg flex items-center justify-center"
                >
                  ออกจากระบบ
                </Button>
              </div>

              {/* Mobile View with Avatar Dropdown */}
              <div className="sm:hidden flex items-center pl-2">
                <Dropdown 
                  menu={{ items: avatarMenuItems }} 
                  trigger={['click']} 
                  placement="bottomRight"
                >
                  <Avatar 
                    size={42} 
                    icon={<UserOutlined />} 
                    className="bg-orange-100 text-orange-600 border border-orange-200 cursor-pointer shadow-sm transition-transform hover:scale-105"
                  />
                </Dropdown>
              </div>
            </div>
          </Header>
          <Content className="m-2 md:m-6 p-2 md:p-6 min-h-[280px] bg-white rounded-lg shadow-inner overflow-auto">
            <Outlet />
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
};

export default DashboardLayout;
