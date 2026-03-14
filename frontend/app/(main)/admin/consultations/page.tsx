/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Skeleton } from 'primereact/skeleton';
import { LayoutContext } from '@/layout/context/layoutcontext';

interface Message {
  role: 'user' | 'assistant' | 'admin';
  content: string;
  timestamp?: string;
}

interface ConversationSession {
  id: number;
  session_id: string;
  title: string;
  user_id: number | null;
  user_full_name: string | null;
  user_email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  message_count?: number;
  messages?: Message[];
}

const ConsultationsPage = () => {
  const router = useRouter();
  const { role } = useContext(LayoutContext);
  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSession | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [adminReply, setAdminReply] = useState('');
  const [replying, setReplying] = useState(false);
  const toast = useRef<Toast>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Redirect if not admin
    if (role && role !== 'admin') {
      router.push('/');
    }
  }, [role, router]);

  useEffect(() => {
    if (role === 'admin') {
      loadConversations();
    }
  }, [role]);

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation?.messages]);

  // Auto-load new messages every 2 seconds when dialog is open
  useEffect(() => {
    if (!showDetailDialog || !selectedConversation) return;

    const pollInterval = setInterval(async () => {
      try {
        const token = localStorage.getItem('access_token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
        
        const response = await fetch(`${apiUrl}/api/ai/conversations/${selectedConversation.session_id}/get_history/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.messages) {
            setSelectedConversation(prev => {
              if (!prev) return prev;
              // Only update if messages changed
              if (JSON.stringify(prev.messages) !== JSON.stringify(data.messages)) {
                return {
                  ...prev,
                  messages: data.messages
                };
              }
              return prev;
            });
          }
        }
      } catch (error) {
        // Silent error - don't show toast on polling
        console.error('Auto-refresh failed:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [showDetailDialog, selectedConversation?.session_id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/ai/conversations/?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Handle both paginated and non-paginated responses
        const conversations_list = Array.isArray(data) ? data : (data.results || []);
        setConversations(conversations_list);
      } else if (response.status === 401) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Hết phiên',
          detail: 'Vui lòng đăng nhập lại',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải danh sách tư vấn',
        life: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const loadConversationDetail = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      
      const response = await fetch(`${apiUrl}/api/ai/conversations/${sessionId}/get_history/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const conversation = conversations.find(c => c.session_id === sessionId);
        if (conversation && data.messages) {
          setSelectedConversation({
            ...conversation,
            messages: data.messages || []
          });
          setShowDetailDialog(true);
        }
      }
    } catch (error) {
      console.error('Error loading conversation detail:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải chi tiết tư vấn',
        life: 3000
      });
    }
  };

  const handleSendReply = async () => {
    if (!adminReply.trim() || !selectedConversation) return;

    setReplying(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const messageContent = adminReply.trim();

      // Save to backend - send message as admin
      const response = await fetch(`${apiUrl}/api/ai/conversations/${selectedConversation.session_id}/send_message/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          is_admin: true
        })
      });

      if (response.ok) {
        // Add admin reply to conversation UI
        const updatedMessages = [
          ...(selectedConversation.messages || []),
          {
            role: 'admin' as const,
            content: messageContent,
            timestamp: new Date().toISOString()
          }
        ];

        setSelectedConversation({
          ...selectedConversation,
          messages: updatedMessages
        });

        toast.current?.show({
          severity: 'success',
          summary: 'Thành công',
          detail: 'Trả lời đã được gửi đến khách hàng',
          life: 2000
        });

        setAdminReply('');
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể gửi trả lời',
          life: 3000
        });
      }
    } catch (error) {
      console.error('Error sending reply:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể gửi trả lời',
        life: 3000
      });
    } finally {
      setReplying(false);
    }
  };

  const userBodyTemplate = (rowData: ConversationSession) => {
    if (rowData.user_id) {
      return (
        <div>
          <div className="font-semibold text-sm">{rowData.user_full_name}</div>
          <div className="text-xs text-500">{rowData.user_email}</div>
        </div>
      );
    }
    return <Tag value="Khách vãng lai" severity="info" />;
  };

  const statusBodyTemplate = (rowData: ConversationSession) => {
    return rowData.is_active ? 
      <Tag value="Đang hoạt động" severity="success" /> : 
      <Tag value="Đã đóng" severity="info" />;
  };

  const dateBodyTemplate = (rowData: ConversationSession) => {
    return new Date(rowData.updated_at).toLocaleString('vi-VN');
  };

  const messageCountTemplate = (rowData: ConversationSession) => {
    return <span className="badge badge-info">{rowData.message_count || 0}</span>;
  };

  const actionBodyTemplate = (rowData: ConversationSession) => {
    return (
      <Button
        icon="pi pi-eye"
        rounded
        outlined
        severity="info"
        onClick={() => loadConversationDetail(rowData.session_id)}
        tooltip="Xem chi tiết"
        tooltipOptions={{ position: 'top' }}
      />
    );
  };

  const detailHeader = (
    <div className="flex justify-content-between align-items-center">
      <h5 className="m-0">Chi tiết tư vấn</h5>
      <Button
        icon="pi pi-times"
        rounded
        text
        severity="danger"
        onClick={() => setShowDetailDialog(false)}
      />
    </div>
  );

  if (!role || role !== 'admin') {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="card text-center py-8">
            <i className="pi pi-lock text-5xl text-400 mb-4"></i>
            <h3 className="text-600">Không có quyền truy cập</h3>
            <p className="text-500">Bạn không có quyền xem trang này</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="card">
            <div className="flex justify-content-between align-items-center mb-4">
              <h5>Tư vấn bán hàng</h5>
            </div>
            <Skeleton height="400px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <Toast ref={toast} />

      <div className="col-12">
        <div className="card">
          <div className="flex justify-content-between align-items-center mb-4">
            <h5 className="m-0">Tư vấn bán hàng</h5>
            <Button
              icon="pi pi-refresh"
              rounded
              outlined
              onClick={loadConversations}
              tooltip="Làm mới"
              tooltipOptions={{ position: 'top' }}
            />
          </div>

          {conversations.length === 0 ? (
            <div className="text-center py-8">
              <i className="pi pi-comments text-6xl text-400 mb-4"></i>
              <h3 className="text-600">Chưa có tư vấn nào</h3>
              <p className="text-500">Các cuộc tư vấn của khách hàng sẽ hiển thị ở đây</p>
            </div>
          ) : (
            <DataTable
              value={conversations}
              paginator
              rows={10}
              rowsPerPageOptions={[5, 10, 20]}
              tableStyle={{ minWidth: '50rem' }}
              className="p-datatable-striped"
              responsiveLayout="scroll"
            >
              <Column
                field="session_id"
                header="Mã phiên"
                style={{ width: '15%' }}
                body={(row) => <span className="font-mono text-sm">{row.session_id.slice(0, 8)}</span>}
              />
              <Column
                header="Khách hàng"
                style={{ width: '25%' }}
                body={userBodyTemplate}
              />
              <Column
                field="title"
                header="Tiêu đề"
                style={{ width: '20%' }}
              />
              <Column
                header="Tin nhắn"
                style={{ width: '10%' }}
                body={messageCountTemplate}
                align="center"
              />
              <Column
                header="Trạng thái"
                style={{ width: '15%' }}
                body={statusBodyTemplate}
              />
              <Column
                header="Cập nhật"
                style={{ width: '20%' }}
                body={dateBodyTemplate}
              />
              <Column
                header="Hành động"
                style={{ width: '5%' }}
                body={actionBodyTemplate}
              />
            </DataTable>
          )}
        </div>
      </div>

      {/* Detail Dialog */}
      <Dialog
        visible={showDetailDialog}
        onHide={() => setShowDetailDialog(false)}
        header={detailHeader}
        modal
        style={{ width: '90vw', maxWidth: '900px' }}
        className="p-dialog-maximizable"
      >
        {selectedConversation && (
          <div className="flex flex-column gap-4" style={{ height: '600px' }}>
            {/* User Info */}
            <div className="surface-100 p-3 border-round">
              <div className="grid">
                <div className="col-12 md:col-6">
                  <div className="text-sm text-500 mb-1">Khách hàng</div>
                  {selectedConversation.user_id ? (
                    <>
                      <div className="font-semibold">{selectedConversation.user_full_name}</div>
                      <div className="text-sm">{selectedConversation.user_email}</div>
                    </>
                  ) : (
                    <div className="text-sm text-600">Khách vãng lai (không đăng nhập)</div>
                  )}
                </div>
                <div className="col-12 md:col-6">
                  <div className="text-sm text-500 mb-1">Thời gian</div>
                  <div className="font-semibold">{new Date(selectedConversation.created_at).toLocaleString('vi-VN')}</div>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div
              className="flex-1 overflow-y-auto border-1 surface-border border-round p-4"
              style={{ backgroundColor: '#f8f9fa' }}
            >
              <div className="flex flex-column gap-3">
                {selectedConversation.messages && selectedConversation.messages.length > 0 ? (
                  selectedConversation.messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'admin' || msg.role === 'assistant' ? 'justify-content-end' : 'justify-content-start'}`}
                    >
                      <div
                        className="p-3 border-round max-w-30rem text-sm"
                        style={{
                          backgroundColor:
                            msg.role === 'assistant'
                              ? '#e3f2fd'
                              : msg.role === 'admin'
                              ? '#fff3e0'
                              : '#f0f0f0'
                        }}
                      >
                        <div className="text-xs text-600 mb-2 font-semibold">
                          {msg.role === 'user' && '👤 Khách hàng'}
                          {msg.role === 'assistant' && '🤖 AI'}
                          {msg.role === 'admin' && '👨‍💼 Admin'}
                        </div>
                        <div className="text-900 line-height-2">{msg.content}</div>
                        {msg.timestamp && (
                          <div className="text-xs text-500 mt-2">
                            {new Date(msg.timestamp).toLocaleTimeString('vi-VN')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-500 py-4">
                    <i className="pi pi-comments text-3xl text-400 mb-3 block"></i>
                    Chưa có tin nhắn nào
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Admin Reply */}
            {selectedConversation.is_active && (
              <div className="flex flex-column gap-2 surface-100 p-3 border-round border-top-1 surface-border">
                <label className="text-sm font-semibold text-600">Trả lời từ Admin</label>
                <InputTextarea
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  placeholder="Nhập trả lời của bạn..."
                  rows={3}
                  className="w-full"
                />
                <div className="flex gap-2 justify-content-end">
                  <Button
                    label="Hủy"
                    severity="secondary"
                    outlined
                    onClick={() => setAdminReply('')}
                    disabled={replying}
                    size="small"
                  />
                  <Button
                    label="Gửi trả lời"
                    icon="pi pi-send"
                    onClick={handleSendReply}
                    loading={replying}
                    disabled={!adminReply.trim() || replying}
                    size="small"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
};

export default ConsultationsPage;
