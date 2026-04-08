'use client';

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { InputText } from 'primereact/inputtext';
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
  user_id?: number | null;
  user_full_name?: string | null;
  user_email?: string | null;
  customer_display_name?: string;
  message_count?: number;
  human_support_active?: boolean;
  human_support_unread_for_admin?: boolean;
  human_support_queue_position?: number | null;
  human_support_waiting_total?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const getDisplaySessionCode = (conv: ConversationSession): string => {
  // Phiên cũ có thể vẫn là session_xxx, fallback về mã số theo ID để admin dễ đọc.
  return /^\d+$/.test(conv.session_id) ? conv.session_id : String(conv.id).padStart(6, '0');
};

const getLocalDateKey = (isoDate: string): string => {
  const d = new Date(isoDate);
  const year = d.getFullYear();
  const month = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateTime = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '-';
  return d.toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
};

const CONVERSATIONS_REFRESH_MS = 1500;
const DETAIL_REFRESH_MS = 1500;

const ConsultationsPage = () => {
  const router = useRouter();
  const { role, roleHydrated } = useContext(LayoutContext);

  const [conversations, setConversations] = useState<ConversationSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  const [rawSearchId, setRawSearchId] = useState('');
  const [rawSearchCustomer, setRawSearchCustomer] = useState('');
  const [searchId, setSearchId] = useState('');
  const [searchCustomer, setSearchCustomer] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showOnlySupportAlerts, setShowOnlySupportAlerts] = useState(false);

  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationSession | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<Message[]>([]);
  const [adminReply, setAdminReply] = useState('');
  const [sendingAdminReply, setSendingAdminReply] = useState(false);
  const [resumingAI, setResumingAI] = useState(false);
  const [detailHumanSupportActive, setDetailHumanSupportActive] = useState(false);

  const toast = useRef<Toast>(null);

  useEffect(() => {
    if (!roleHydrated) return;
    if (role !== 'admin') {
      router.push('/');
    }
  }, [roleHydrated, role, router]);

  useEffect(() => {
    if (!roleHydrated) return;
    if (role === 'admin') {
      void loadConversations(true);
    }
  }, [roleHydrated, role]);

  useEffect(() => {
    if (!roleHydrated || role !== 'admin') return;

    const interval = setInterval(() => {
      void loadConversations(false);
    }, CONVERSATIONS_REFRESH_MS);

    return () => clearInterval(interval);
  }, [roleHydrated, role]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearchId(rawSearchId.trim());
      setSearchCustomer(rawSearchCustomer.trim());
    }, 300);

    return () => clearTimeout(timeout);
  }, [rawSearchId, rawSearchCustomer]);

  useEffect(() => {
    if (!showDetailDialog || !selectedConversation) return;

    const interval = setInterval(() => {
      void loadConversationDetail(selectedConversation, false);
    }, DETAIL_REFRESH_MS);

    return () => clearInterval(interval);
  }, [showDetailDialog, selectedConversation]);

  useEffect(() => {
    if (!roleHydrated || role !== 'admin') return;

    const handleVisibilityOrFocus = () => {
      if (!document.hidden) {
        void loadConversations(false);
      }
    };

    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);

    return () => {
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [roleHydrated, role]);

  const loadConversations = async (showLoading = false) => {
    if (showLoading) setLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/ai/conversations/?limit=200`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const list = Array.isArray(data) ? data : data.results || [];
        setConversations(list);
      } else if (response.status === 401) {
        toast.current?.show({
          severity: 'warn',
          summary: 'Hết phiên',
          detail: 'Vui lòng đăng nhập lại',
          life: 2500,
        });
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
      if (showLoading) {
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải danh sách hội thoại',
          life: 2500,
        });
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter((conv) => {
      const paddedId = String(conv.id).padStart(3, '0');
      const displaySessionCode = getDisplaySessionCode(conv);
      const customerName = (conv.customer_display_name || conv.user_full_name || 'Khách vãng lai').toLowerCase();

      const byId = !searchId.trim()
        || paddedId.includes(searchId.trim())
        || String(conv.id).includes(searchId.trim())
        || displaySessionCode.includes(searchId.trim())
        || conv.session_id.toLowerCase().includes(searchId.trim().toLowerCase());

      const byCustomer = !searchCustomer.trim() || customerName.includes(searchCustomer.trim().toLowerCase());

      const createdDate = getLocalDateKey(conv.created_at);
      const byFromDate = !fromDate || createdDate >= fromDate;
      const byToDate = !toDate || createdDate <= toDate;

      const bySupportAlert = !showOnlySupportAlerts || Boolean(conv.human_support_unread_for_admin);

      return byId && byCustomer && byFromDate && byToDate && bySupportAlert;
    });
  }, [conversations, searchId, searchCustomer, fromDate, toDate, showOnlySupportAlerts]);

  const supportAlertCount = useMemo(
    () => conversations.filter((item) => item.human_support_unread_for_admin).length,
    [conversations]
  );

  const loadConversationDetail = async (conversation: ConversationSession, openDialog = true) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/ai/conversations/${conversation.session_id}/get_history/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể tải chi tiết hội thoại',
          life: 2500,
        });
        return;
      }

      const data = await response.json();
      setSelectedConversation((prev) => {
        const base = prev && prev.session_id === conversation.session_id ? prev : conversation;
        return {
          ...base,
          human_support_active: Boolean(data.human_support_active),
        };
      });
      setSelectedMessages(data.messages || []);
      setDetailHumanSupportActive(Boolean(data.human_support_active));
      if (openDialog) {
        setShowDetailDialog(true);
      }
    } catch (error) {
      console.error('Error loading conversation detail:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể tải chi tiết hội thoại',
        life: 2500,
      });
    }
  };

  const sendAdminReply = async () => {
    if (!selectedConversation || !adminReply.trim()) return;

    setSendingAdminReply(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/ai/conversations/${selectedConversation.session_id}/admin_reply/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: adminReply.trim() }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: data.message || data.error || 'Không thể gửi tin nhắn admin',
          life: 2500,
        });
        return;
      }

      setAdminReply('');
      await loadConversationDetail(selectedConversation, false);
      await loadConversations(false);

      toast.current?.show({
        severity: 'success',
        summary: 'Đã gửi',
        detail: 'Tin nhắn admin đã được gửi tới khách hàng',
        life: 1800,
      });
    } catch (error) {
      console.error('Error sending admin reply:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể gửi tin nhắn admin',
        life: 2500,
      });
    } finally {
      setSendingAdminReply(false);
    }
  };

  const handleResumeAI = async () => {
    if (!selectedConversation) return;

    setResumingAI(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/ai/conversations/${selectedConversation.session_id}/resume_ai/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: data.error || 'Không thể bật lại AI',
          life: 2500,
        });
        return;
      }

      setDetailHumanSupportActive(false);
      setSelectedConversation((prev) => (prev ? { ...prev, human_support_active: false } : prev));
      await loadConversationDetail(selectedConversation, false);
      await loadConversations(false);

      toast.current?.show({
        severity: 'success',
        summary: 'Đã bật AI',
        detail: data.message || 'AI đã hoạt động trở lại',
        life: 2000,
      });
    } catch (error) {
      console.error('Error resuming AI:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể bật lại AI',
        life: 2500,
      });
    } finally {
      setResumingAI(false);
    }
  };

  const deleteConversation = async (conversation: ConversationSession) => {
    setDeletingSessionId(conversation.session_id);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

      const response = await fetch(`${apiUrl}/api/ai/conversations/${conversation.session_id}/`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        toast.current?.show({
          severity: 'error',
          summary: 'Lỗi',
          detail: 'Không thể xóa hội thoại',
          life: 2500,
        });
        return;
      }

      setConversations((prev) => prev.filter((item) => item.session_id !== conversation.session_id));
      if (selectedConversation?.session_id === conversation.session_id) {
        setShowDetailDialog(false);
        setSelectedConversation(null);
        setSelectedMessages([]);
      }

      toast.current?.show({
        severity: 'success',
        summary: 'Đã xóa',
        detail: 'Cuộc hội thoại đã được xóa',
        life: 2000,
      });
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.current?.show({
        severity: 'error',
        summary: 'Lỗi',
        detail: 'Không thể xóa hội thoại',
        life: 2500,
      });
    } finally {
      setDeletingSessionId(null);
    }
  };

  const handleDeleteConversation = (conversation: ConversationSession) => {
    const customerName = conversation.customer_display_name || conversation.user_full_name || 'Khách vãng lai';
    const paddedId = String(conversation.id).padStart(3, '0');

    confirmDialog({
      header: 'Xác nhận xóa hội thoại',
      message: `Bạn có chắc muốn xóa hội thoại ${paddedId} của ${customerName}?`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptClassName: 'p-button-danger',
      accept: () => {
        void deleteConversation(conversation);
      },
    });
  };

  const clearFilters = () => {
    setRawSearchId('');
    setRawSearchCustomer('');
    setSearchId('');
    setSearchCustomer('');
    setFromDate('');
    setToDate('');
    setShowOnlySupportAlerts(false);
  };

  const customerCell = (row: ConversationSession) => {
    const name = row.customer_display_name || row.user_full_name || 'Khách vãng lai';
    const isGuest = !row.user_id;

    return (
      <div className="flex flex-column gap-1">
        <span className="font-semibold">{name}</span>
        {isGuest ? (
          <Tag value="Khách vãng lai" severity="info" />
        ) : (
          <span className="text-xs text-500">{row.user_email}</span>
        )}
      </div>
    );
  };

  const statusCell = (row: ConversationSession) => {
    return row.is_active ? <Tag value="Đang hoạt động" severity="success" /> : <Tag value="Đã đóng" severity="warning" />;
  };

  const actionCell = (row: ConversationSession) => (
    <div className="flex gap-2">
      <Button
        icon="pi pi-eye"
        rounded
        outlined
        severity="info"
        tooltip="Xem hội thoại"
        tooltipOptions={{ position: 'top' }}
        onClick={() => loadConversationDetail(row)}
      />
      <Button
        icon="pi pi-trash"
        rounded
        outlined
        severity="danger"
        tooltip="Xóa hội thoại"
        tooltipOptions={{ position: 'top' }}
        loading={deletingSessionId === row.session_id}
        onClick={() => handleDeleteConversation(row)}
      />
    </div>
  );

  const supportCell = (row: ConversationSession) => {
    if (row.human_support_unread_for_admin) {
      const position = row.human_support_queue_position;
      return <Tag value={position ? `Cần phản hồi • #${position}` : 'Cần phản hồi'} severity="danger" />;
    }
    if (row.human_support_active) {
      const position = row.human_support_queue_position;
      return <Tag value={position ? `Đang hỗ trợ • #${position}` : 'Đang hỗ trợ'} severity="warning" />;
    }
    return <Tag value="AI" severity="info" />;
  };

  const customerMessageDisplayName =
    selectedConversation?.customer_display_name
    || selectedConversation?.user_full_name
    || 'Khách vãng lai';

  if (!roleHydrated) {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="card">
            <Skeleton height="420px" />
          </div>
        </div>
      </div>
    );
  }

  if (role !== 'admin') {
    return (
      <div className="grid">
        <div className="col-12">
          <div className="card text-center py-8">
            <i className="pi pi-lock text-5xl text-400 mb-4" />
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
            <h5 className="mb-4">Tư vấn bán hàng</h5>
            <Skeleton height="420px" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid">
      <Toast ref={toast} />
      <ConfirmDialog />

      <div className="col-12">
        <div className="card">
          <div className="flex flex-column gap-3 mb-4">
            <div className="flex justify-content-between align-items-center">
              <h5 className="m-0">Tư vấn bán hàng Admin</h5>
              <Button
                type="button"
                icon="pi pi-bell"
                label={supportAlertCount > 0 ? `Yêu cầu tư vấn viên (${supportAlertCount})` : 'Yêu cầu tư vấn viên'}
                severity={supportAlertCount > 0 ? 'danger' : 'secondary'}
                outlined={!showOnlySupportAlerts}
                onClick={() => setShowOnlySupportAlerts((prev) => !prev)}
                badge={supportAlertCount > 0 ? String(supportAlertCount) : undefined}
                badgeClassName="p-badge-danger"
              />
            </div>

            <div className="grid">
              <div className="col-12 md:col-4">
                <label className="block text-sm mb-2">Tìm kiếm theo ID</label>
                <InputText
                  value={rawSearchId}
                  onChange={(e) => setRawSearchId(e.target.value)}
                  placeholder="Ví dụ: 001 hoặc 000123"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-4">
                <label className="block text-sm mb-2">Tìm theo tên khách hàng</label>
                <InputText
                  value={rawSearchCustomer}
                  onChange={(e) => setRawSearchCustomer(e.target.value)}
                  placeholder="Ví dụ: Duy Nauy"
                  className="w-full"
                />
              </div>

              <div className="col-12 md:col-4">
                <label className="block text-sm mb-2">Lọc theo khoảng ngày</label>
                <div className="grid">
                  <div className="col-6">
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full p-inputtext p-component"
                    />
                  </div>
                  <div className="col-6">
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full p-inputtext p-component"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-content-between align-items-center">
              <span className="text-sm text-600">
                Tổng cộng: {filteredConversations.length} hội thoại
                {showOnlySupportAlerts ? ' (đang lọc yêu cầu tư vấn viên)' : ''}
              </span>
              <div className="flex gap-2">
                <Button label="Xóa bộ lọc" severity="secondary" outlined onClick={clearFilters} />
                <Button label="Làm mới" icon="pi pi-refresh" onClick={() => loadConversations(true)} />
              </div>
            </div>
          </div>

          <DataTable
            value={filteredConversations}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            responsiveLayout="scroll"
            tableStyle={{ minWidth: '64rem' }}
            emptyMessage="Không có hội thoại phù hợp"
          >
            <Column
              header="ID"
              style={{ width: '10%' }}
              body={(row: ConversationSession) => <span className="font-semibold">{String(row.id).padStart(3, '0')}</span>}
            />
            <Column header="Khách hàng" style={{ width: '28%' }} body={customerCell} />
            <Column
              header="Mã phiên"
              style={{ width: '20%' }}
              body={(row: ConversationSession) => <span className="font-medium">{getDisplaySessionCode(row)}</span>}
            />
            <Column
              header="Ngày tạo / cập nhật"
              style={{ width: '14%' }}
              body={(row: ConversationSession) => formatDateTime(row.updated_at || row.created_at)}
            />
            <Column
              header="Tin nhắn"
              style={{ width: '10%' }}
              body={(row: ConversationSession) => row.message_count || 0}
            />
            <Column header="Hỗ trợ" style={{ width: '12%' }} body={supportCell} />
            <Column header="Trạng thái" style={{ width: '13%' }} body={statusCell} />
            <Column header="Hành động" style={{ width: '15%' }} body={actionCell} />
          </DataTable>
        </div>
      </div>

      <Dialog
        visible={showDetailDialog}
        onHide={() => {
          setShowDetailDialog(false);
          setAdminReply('');
          setDetailHumanSupportActive(false);
        }}
        header={`Hội thoại #${selectedConversation ? String(selectedConversation.id).padStart(3, '0') : ''}`}
        modal
        style={{ width: '90vw', maxWidth: '900px' }}
      >
        <div className="flex flex-column gap-3">
          <div style={{ maxHeight: '55vh', overflowY: 'auto' }} className="flex flex-column gap-3">
            {selectedMessages.length > 0 ? (
              selectedMessages.map((msg, idx) => (
                <div
                  key={`${idx}-${msg.timestamp || ''}`}
                  className={`flex ${msg.role === 'user' ? 'justify-content-start' : 'justify-content-end'}`}
                >
                  <div
                    className={`p-3 border-round border-1 w-full md:w-9 ${
                      msg.role === 'user'
                        ? 'surface-100 border-300'
                        : msg.role === 'admin'
                          ? 'surface-0 border-blue-200'
                          : 'surface-0 border-purple-200'
                    }`}
                  >
                    <div className="text-xs text-600 mb-2 font-semibold">
                      {msg.role === 'user' ? customerMessageDisplayName : msg.role === 'assistant' ? 'AI' : 'Admin'}
                    </div>
                    <div className="line-height-3">{msg.content}</div>
                    {msg.timestamp && (
                      <div className="text-xs text-500 mt-2">{new Date(msg.timestamp).toLocaleString('vi-VN')}</div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-500 py-4">Chưa có tin nhắn nào</div>
            )}
          </div>

          <div className="surface-50 p-3 border-round border-1 border-200">
            <div className="flex justify-content-between align-items-center mb-2">
              <label className="block text-sm font-medium m-0">Trả lời khách hàng với vai trò Admin</label>
              {detailHumanSupportActive ? (
                <Button
                  label="Bật lại AI"
                  icon="pi pi-refresh"
                  severity="warning"
                  outlined
                  loading={resumingAI}
                  onClick={handleResumeAI}
                />
              ) : (
                <Tag value="AI đang hoạt động" severity="success" />
              )}
            </div>
            <div className="flex flex-column gap-2">
              <textarea
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                placeholder="Nhập nội dung phản hồi cho khách hàng..."
                rows={3}
                className="w-full p-inputtext p-component"
                disabled={sendingAdminReply}
              />
              <div className="flex justify-content-end">
                <Button
                  label="Gửi phản hồi"
                  icon="pi pi-send"
                  onClick={sendAdminReply}
                  loading={sendingAdminReply}
                  disabled={!adminReply.trim() || sendingAdminReply}
                />
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default ConsultationsPage;
