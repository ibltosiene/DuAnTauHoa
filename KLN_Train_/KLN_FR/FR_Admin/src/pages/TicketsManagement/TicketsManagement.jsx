import React, { useState, useEffect } from 'react';
import { FiSearch, FiFilter, FiDownload, FiEye, FiCheckCircle, FiXCircle, FiPrinter } from 'react-icons/fi';
import DataTable from '../../components/Common/DataTable';
import Modal from '../../components/Common/Modal';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import AlertDialog from '../../components/Common/AlertDialog';
import { ticketAPI } from '../../services/api';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import './TicketsManagement.scss';

const TicketsManagement = () => {
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [actionType, setActionType] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', type: 'success' });

  const showAlert = (message, type = 'error', title = type === 'error' ? 'Lỗi' : type === 'warning' ? 'Lưu ý' : 'Thành công') => {
    setAlertDialog({ isOpen: true, title, message, type });
  };

  useEffect(() => {
    loadTickets();
  }, []);

const loadTickets = async () => {
  setLoading(true);
  try {
    const res = await ticketAPI.getAll();
    console.log('📦 API Response:', res.data); // Debug - xem dữ liệu trả về
    
    // Lấy dữ liệu từ API
    let ticketsData = res.data.data || [];
    
    // Nếu không có dữ liệu, hiển thị thông báo thay vì mock data
    if (ticketsData.length === 0) {
      console.log('⚠️ Không có dữ liệu vé từ database');
      setTickets([]);
      setLoading(false);
      return;
    }
    
    // Format dữ liệu
    ticketsData = ticketsData.map(ticket => ({
      ma_ve: ticket.id_ve || ticket.ma_ve,
      hanh_khach: ticket.ho_ten || ticket.hanh_khach,
      chuyen_tau: ticket.so_hieu || ticket.chuyen_tau,
      ga_len: ticket.ga_di || ticket.ga_len,
      ga_xuong: ticket.ga_den || ticket.ga_xuong,
      ngay_di: ticket.ngay_chay || ticket.ngay_di,
      gio_di: ticket.gio_di,
      so_toa: ticket.so_toa_thu_tu,
      so_ghe: ticket.so_ghe_trong_toa,
      gia_ve: ticket.gia_ve,
      trang_thai: ticket.trang_thai === 'da_xac_nhan' ? 'hieu_luc' : ticket.trang_thai,
      ngay_dat: ticket.ngay_xuat_ve?.split('T')[0]
    }));
    
    setTickets(ticketsData);
  } catch (error) {
    console.error('❌ Lỗi tải vé:', error);
    setTickets([]); // Không dùng mock data nữa
  } finally {
    setLoading(false);
  }
};

  const handleConfirmTicket = (ticket) => {
    if (ticket.trang_thai !== 'hieu_luc') {
      showAlert('Vé không ở trạng thái có hiệu lực để xác nhận', 'warning');
      return;
    }
    setSelectedTicket(ticket);
    setActionType('confirm');
    setShowConfirmDialog(true);
  };

  const handleCancelTicket = (ticket) => {
    if (ticket.trang_thai !== 'hieu_luc') {
      showAlert('Không thể hủy vé này', 'warning');
      return;
    }
    setSelectedTicket(ticket);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const processConfirmTicket = async () => {
    try {
      await ticketAPI.confirm(selectedTicket.ma_ve);
      setShowConfirmDialog(false);
      showAlert(`Đã xác nhận vé ${selectedTicket.ma_ve} đã được sử dụng`, 'success');
      await loadTickets();
    } catch (error) {
      console.error('Lỗi xác nhận vé:', error);
      setShowConfirmDialog(false);
      showAlert('Có lỗi xảy ra khi xác nhận vé', 'error');
    } finally {
      setSelectedTicket(null);
      setActionType(null);
    }
  };

  const processCancelTicket = async () => {
    if (!cancelReason.trim()) {
      showAlert('Vui lòng nhập lý do hủy vé', 'warning');
      return;
    }

    try {
      await ticketAPI.cancel(selectedTicket.ma_ve, { ly_do: cancelReason });
      setShowCancelModal(false);
      showAlert(`Đã hủy vé ${selectedTicket.ma_ve}`, 'success');
      await loadTickets();
    } catch (error) {
      console.error('Lỗi hủy vé:', error);
      setShowCancelModal(false);
      showAlert('Có lỗi xảy ra khi hủy vé', 'error');
    } finally {
      setSelectedTicket(null);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '---';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const generateBookingCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handlePrintTicket = (ticket) => {
  const bookingCode = generateBookingCode();
  const currentDate = new Date().toLocaleDateString('vi-VN');
  const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  
  // Format dữ liệu từ ticket
  const ticketCode = ticket.ma_ve || '---';
  const passengerName = ticket.hanh_khach || '---';
  const trainCode = ticket.chuyen_tau || '---';
  const fromStation = ticket.ga_len || '---';
  const toStation = ticket.ga_xuong || '---';
  const departDate = ticket.ngay_di ? new Date(ticket.ngay_di).toLocaleDateString('vi-VN') : '---';
  const departTime = ticket.gio_di || '---';
  const coachId = ticket.so_toa || '--';
  const seatNumber = ticket.so_ghe || '--';
  const coachType = ticket.loai_ghe || 'Ngồi mềm điều hòa';
  const price = ticket.gia_ve || 0;
  const isChild = ticket.loai_ve === 'tre_em';
  const idCard = ticket.so_cccd || ticket.giay_to || '---';
  
  // Tạo QR data
  const qrData = `${ticketCode}|${passengerName}|${trainCode}|${fromStation}-${toStation}`;
  
  // Lấy thời gian hiện tại
  const now = () => {
    const d = new Date();
    return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
  };

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Vé tàu - ${trainCode}</title>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          background: #e9ecef;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
        }
        .ticket-card {
          background: white;
          border: 1px solid #ccc;
          max-width: 400px;
          width: 100%;
          margin: 0 auto;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        /* Header */
        .ticket-header {
          text-align: center;
          border-bottom: 1px solid #ccc;
          padding: 12px 16px;
          background: #f8f9fa;
        }
        .ticket-header p {
          font-weight: bold;
          line-height: 1.4;
          font-size: 13px;
        }
        .ticket-header .title {
          font-size: 15px;
          margin-top: 4px;
          letter-spacing: 1px;
        }
        /* QR */
        .qr-section {
          display: flex;
          justify-content: center;
          padding: 12px;
          border-bottom: 1px solid #ccc;
        }
        .qr-section svg {
          width: 80px;
          height: 80px;
        }
        /* Ticket code */
        .ticket-code {
          text-align: center;
          padding: 6px 12px;
          border-bottom: 1px solid #ccc;
          background: #f8f9fa;
          font-size: 13px;
        }
        .ticket-code strong {
          font-family: 'Courier New', monospace;
          letter-spacing: 1px;
        }
        /* Stations */
        .stations {
          display: flex;
          justify-content: space-between;
          padding: 12px 20px;
          border-bottom: 1px solid #ccc;
        }
        .station-box {
          text-align: center;
        }
        .station-box .label {
          font-size: 11px;
          color: #666;
        }
        .station-box .name {
          font-size: 20px;
          font-weight: 900;
          line-height: 1.2;
          text-transform: uppercase;
        }
        /* Details table */
        .details-table {
          width: 100%;
          border-collapse: collapse;
        }
        .details-table tr {
          border-bottom: 1px solid #f0f0f0;
        }
        .details-table tr:last-child {
          border-bottom: none;
        }
        .details-table td {
          padding: 4px 16px;
          font-size: 13px;
        }
        .details-table .label-cell {
          color: #666;
          white-space: nowrap;
          font-weight: normal;
          width: 40%;
        }
        .details-table .value-cell {
          font-weight: bold;
        }
        /* Footer */
        .ticket-footer {
          border-top: 1px solid #ccc;
          padding: 8px 16px;
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #666;
          background: #fafafa;
        }
        .ticket-footer .booking-code {
          color: #8C1D19;
          font-weight: bold;
        }
        .price-highlight {
          color: #b12a2a;
        }
        @media print {
          body { background: white; padding: 0; }
          .ticket-card { box-shadow: none; border: 1px solid #999; border-radius: 0; }
        }
      </style>
    </head>
    <body>
      <div class="ticket-card">
        <!-- Header -->
        <div class="ticket-header">
          <p>CÔNG TY CỔ PHẦN VẬN TẢI</p>
          <p>ĐƯỜNG SẮT KLN</p>
          <p class="title">THẺ LÊN TÀU HỎA / BOARDING PASS</p>
        </div>

        <!-- QR Code -->
        <div class="qr-section">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrData)}" alt="QR Code" />
        </div>

        <!-- Ticket Code -->
        <div class="ticket-code">
          Mã vé/TicketID: <strong>${ticketCode}</strong>
        </div>

        <!-- Stations -->
        <div class="stations">
          <div class="station-box">
            <div class="label">Ga đi</div>
            <div class="name">${(fromStation || '--').toUpperCase()}</div>
          </div>
          <div class="station-box">
            <div class="label">Ga đến</div>
            <div class="name">${(toStation || '--').toUpperCase()}</div>
          </div>
        </div>

        <!-- Details -->
        <table class="details-table">
          <tbody>
            <tr>
              <td class="label-cell">Tàu/Train:</td>
              <td class="value-cell">${trainCode || '--'}</td>
            </tr>
            <tr>
              <td class="label-cell">Ngày đi/Date:</td>
              <td class="value-cell">${departDate}</td>
            </tr>
            <tr>
              <td class="label-cell">Giờ đi/Time:</td>
              <td class="value-cell">${departTime || '--'}</td>
            </tr>
            <tr>
              <td class="label-cell">Toa/Coach:</td>
              <td class="value-cell">${coachId || '--'}</td>
            </tr>
            <tr>
              <td class="label-cell">Chỗ/Seat:</td>
              <td class="value-cell">${seatNumber || '--'}</td>
            </tr>
            <tr>
              <td class="label-cell">Loại chỗ/Class:</td>
              <td class="value-cell">${coachType}</td>
            </tr>
            <tr>
              <td class="label-cell">Loại vé/Ticket:</td>
              <td class="value-cell">${isChild ? 'Trẻ em (-25%)' : 'Người lớn'}</td>
            </tr>
            <tr>
              <td class="label-cell">Họ tên/Name:</td>
              <td class="value-cell">${passengerName}</td>
            </tr>
            ${idCard !== '---' ? `
            <tr>
              <td class="label-cell">Giấy tờ/Passport:</td>
              <td class="value-cell">${idCard}</td>
            </tr>
            ` : ''}
            ${price > 0 ? `
            <tr>
              <td class="label-cell">Giá/Price:</td>
              <td class="value-cell price-highlight">${new Intl.NumberFormat('vi-VN').format(price)} VNĐ</td>
            </tr>
            ` : ''}
          </tbody>
        </table>

        <!-- Footer -->
        <div class="ticket-footer">
          <span>Mã đặt chỗ: <span class="booking-code">${bookingCode}</span></span>
          <span>${now()}</span>
        </div>
      </div>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.print();
}

  const getStatusText = (status) => {
    const statuses = {
      hieu_luc: { text: 'Có hiệu lực', class: 'badge-success' },
      da_su_dung: { text: 'Đã sử dụng', class: 'badge-info' },
      da_huy: { text: 'Đã hủy', class: 'badge-danger' },
      da_xac_nhan: { text: 'Đã xác nhận', class: 'badge-success' },
      cho_xac_nhan: { text: 'Chờ xác nhận', class: 'badge-warning' }
    };
    return statuses[status] || { text: status, class: 'badge-secondary' };
  };

  const stats = {
    total: tickets.length,
    hieu_luc: tickets.filter(t => t.trang_thai === 'hieu_luc' || t.trang_thai === 'da_xac_nhan').length,
    da_su_dung: tickets.filter(t => t.trang_thai === 'da_su_dung').length,
    da_huy: tickets.filter(t => t.trang_thai === 'da_huy').length,
    cho_xac_nhan: tickets.filter(t => t.trang_thai === 'cho_xac_nhan').length
  };

  const columns = [
    { title: 'Mã vé', key: 'ma_ve', width: '80px' },
    { title: 'Khách hàng', key: 'hanh_khach', width: '170px' },
    { title: 'Chuyến tàu', key: 'chuyen_tau', width: '100px' },
    { title: 'Hành trình', key: 'ga_len', width: '200px', render: (_, row) => `${row.ga_len} → ${row.ga_xuong}` },
    { title: 'Ngày đi', key: 'ngay_di', width: '100px', render: (v) => formatDate(v) },
    { title: 'Giá vé', key: 'gia_ve', render: (v) => formatCurrency(v) },
    { title: 'Trạng thái', key: 'trang_thai', render: (v) => {
      const status = getStatusText(v);
      return <span className={`status-badge ${status.class}`}>{status.text}</span>;
    }},
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, row) => (
        <div className="action-buttons">
          <button className="btn-view" onClick={() => { setSelectedTicket(row); setShowDetailModal(true); }} title="Xem chi tiết"><FiEye /></button>
          <button className="btn-print" onClick={() => handlePrintTicket(row)} title="In vé"><FiPrinter /></button>
        </div>
      )
    }
  ];

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.ma_ve?.toString().includes(searchTerm) || 
                          ticket.hanh_khach?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.trang_thai === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) return <LoadingSpinner />;

  return (
    <div className="tickets-management">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý vé</h1>
        </div>
        <button className="btn-primary" onClick={() => window.location.href = '/admin/reports'}>
          <FiDownload /> Xuất báo cáo
        </button>
      </div>

      <div className="stats-summary">
        <div className="stat-box primary"><span className="stat-label">Tổng số vé</span><span className="stat-value">{stats.total}</span></div>
        <div className="stat-box success"><span className="stat-label">Có hiệu lực</span><span className="stat-value">{stats.hieu_luc}</span></div>
        <div className="stat-box info"><span className="stat-label">Đã sử dụng</span><span className="stat-value">{stats.da_su_dung}</span></div>
        <div className="stat-box danger"><span className="stat-label">Đã hủy</span><span className="stat-value">{stats.da_huy}</span></div>
      </div>

      <div className="filter-bar">
        <div className="search-input"><FiSearch /><input type="text" placeholder="Tìm kiếm theo mã vé, tên KH..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div>
        <div className="filter-group"><FiFilter /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">Tất cả trạng thái</option>
          <option value="hieu_luc">Có hiệu lực</option>
          <option value="da_su_dung">Đã sử dụng</option>
          <option value="da_huy">Đã hủy</option>
        </select></div>
      </div>

      <DataTable columns={columns} data={filteredTickets} />


      {/* Cancel Ticket Modal - nhập lý do hủy */}
      <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title="Hủy vé" size="sm">
        <div className="cancel-ticket-form">
          <p>Bạn có chắc chắn muốn hủy vé <strong>{selectedTicket?.ma_ve}</strong>?</p>
          <div className="form-group">
            <label>Lý do hủy vé *</label>
            <textarea rows="3" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="Nhập lý do hủy vé..." />
          </div>
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowCancelModal(false)}>Đóng</button>
            <button type="button" className="btn-danger" onClick={processCancelTicket}>Xác nhận hủy</button>
          </div>
        </div>
      </Modal>

      <AlertDialog isOpen={alertDialog.isOpen} onClose={() => setAlertDialog({ ...alertDialog, isOpen: false })} title={alertDialog.title} message={alertDialog.message} type={alertDialog.type} />

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết vé" size="md">
        {selectedTicket && (
          <div className="ticket-detail">
            <div className="ticket-header">
              <div className="ticket-code"><span>Mã vé</span><h2>{selectedTicket.ma_ve}</h2></div>
              <div className={`ticket-status ${getStatusText(selectedTicket.trang_thai).class}`}>{getStatusText(selectedTicket.trang_thai).text}</div>
            </div>
            <div className="ticket-info">
              <div className="info-row"><span className="label">Khách hàng:</span><span className="value">{selectedTicket.hanh_khach}</span></div>
              <div className="info-row"><span className="label">Chuyến tàu:</span><span className="value">{selectedTicket.chuyen_tau}</span></div>
              <div className="info-row"><span className="label">Ngày khởi hành:</span><span className="value">{formatDate(selectedTicket.ngay_di)}</span></div>
              <div className="info-row"><span className="label">Ga lên tàu:</span><span className="value">{selectedTicket.ga_len}</span></div>
              <div className="info-row"><span className="label">Ga xuống tàu:</span><span className="value">{selectedTicket.ga_xuong}</span></div>
              <div className="info-row"><span className="label">Toa:</span><span className="value">{selectedTicket.so_toa || '---'}</span></div>
              <div className="info-row"><span className="label">Ghế:</span><span className="value">{selectedTicket.so_ghe || '---'}</span></div>
              <div className="info-row"><span className="label">Loại ghế:</span><span className="value">{selectedTicket.loai_ghe || 'Ghế ngồi điều hòa'}</span></div>
              <div className="info-row"><span className="label">Giá vé:</span><span className="value price">{formatCurrency(selectedTicket.gia_ve)}</span></div>
            </div>
            {(selectedTicket.trang_thai === 'hieu_luc' || selectedTicket.trang_thai === 'da_xac_nhan') && (
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => { setShowDetailModal(false); handleCancelTicket(selectedTicket); }}><FiXCircle /> Hủy vé</button>
                <button className="btn-print" onClick={() => handlePrintTicket(selectedTicket)}><FiPrinter /> In vé</button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TicketsManagement;