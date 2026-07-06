import React, { useState, useRef, useEffect } from 'react'
import { FaCommentDots, FaXmark, FaPaperPlane, FaTrain, FaRobot } from 'react-icons/fa6'
import { getStations } from '../api/trains'
import { askChatbot } from '../api/chatbot'

// ─── Dữ liệu hướng dẫn ──────────────────────────────────────────

const GUIDES = [
  {
    keywords: ['đặt vé', 'dat ve', 'mua vé', 'mua ve', 'cách đặt', 'cach dat', 'hướng dẫn', 'huong dan', 'làm sao', 'lam sao'],
    answer: `📋 **Hướng dẫn đặt vé tàu KLN Train:**

1️⃣ Vào trang **Tìm vé** trên thanh menu
2️⃣ Chọn **ga đi**, **ga đến**, **ngày đi** và số lượng hành khách
3️⃣ Bấm **Tìm chuyến** → chọn chuyến tàu phù hợp
4️⃣ Chọn **toa** và **chỗ ngồi** trên sơ đồ ghế
5️⃣ Điền **thông tin hành khách** (họ tên, ngày sinh, CCCD)
6️⃣ Điền **SĐT** và **email** nhận vé
7️⃣ Bấm **Tiếp tục thanh toán** → quét mã QR chuyển khoản
8️⃣ Sau khi thanh toán, vé điện tử sẽ gửi qua email!

💡 Mẹo: Đặt vé khứ hồi sẽ chọn ghế cho cả chiều đi và chiều về.`
  },
  {
    keywords: ['thanh toán', 'thanh toan', 'trả tiền', 'tra tien', 'chuyển khoản', 'chuyen khoan', 'qr', 'payment'],
    answer: `💳 **Phương thức thanh toán:**

• **Chuyển khoản QR** — quét mã QR để chuyển khoản qua app ngân hàng
• **Thẻ tín dụng** — Visa, Master, JCB
• **Ví MoMo** — thanh toán qua ví điện tử
• **Thẻ ATM nội địa** — chuyển khoản ATM

⏰ Bạn có **15 phút** để thanh toán sau khi đặt vé, nếu không ghế sẽ được giải phóng.`
  },
  {
    keywords: ['tra cứu', 'tra cuu', 'kiểm tra', 'kiem tra', 'xem vé', 'xem ve', 'tìm vé', 'tim ve', 'đặt chỗ', 'dat cho'],
    answer: `🔍 **Tra cứu đơn đặt vé:**

1. Vào menu **Thông tin đặt chỗ**
2. Nhập **mã đặt chỗ** (6 ký tự, ví dụ: PH3DVY)
3. Nhập **email** và **SĐT** đã dùng khi đặt
4. Bấm **Tra cứu**

Tại đây bạn có thể xem chi tiết, in vé, hoặc tiếp tục thanh toán nếu chưa thanh toán.`
  },
  {
    keywords: ['hủy vé', 'huy ve', 'hoàn vé', 'hoan ve', 'trả vé', 'tra ve', 'đổi vé', 'doi ve'],
    answer: `🔄 **Chính sách trả/đổi vé:**

**Trả vé:**
• Trước 3 ngày: hoàn **90%**
• 1–3 ngày: hoàn **75%**
• 4h–1 ngày: hoàn **50%**
• Dưới 4h: **không hoàn**

**Đổi vé:**
• Đổi sang chuyến khác cùng tuyến
• Nếu giá mới cao hơn → trả thêm chênh lệch
• Vào menu **Đổi vé** để thực hiện`
  },
  {
    keywords: ['giá vé', 'gia ve', 'bao nhiêu', 'bao nhieu', 'giảm giá', 'giam gia', 'khuyến mãi', 'khuyen mai'],
    answer: `💰 **Thông tin giá vé:**

Giá vé phụ thuộc vào **loại ghế/giường** và **quãng đường**:
• Ghế ngồi mềm điều hòa: từ ~300.000đ
• Giường nằm khoang 6: từ ~500.000đ
• Giường nằm khoang 4: từ ~700.000đ

**Giảm giá theo đối tượng:**
• 🧒 Trẻ em (dưới 10 tuổi): **-25%**
• 👴 Người cao tuổi (60+): **-15%**
• 🎓 Sinh viên: **-10%**`
  },
  {
    keywords: ['giờ tàu', 'gio tau', 'lịch tàu', 'lich tau', 'chuyến tàu', 'chuyen tau', 'mấy giờ', 'may gio'],
    answer: `🕐 **Xem lịch tàu:**

Vào menu **Lịch tàu – Giá vé** để xem:
• Tất cả chuyến tàu đang chạy
• Giờ khởi hành, giờ đến dự kiến
• Số ghế trống từng toa
• Giá vé theo loại ghế

Hoặc vào **Tìm vé** → chọn ga đi/đến + ngày → xem danh sách chuyến.`
  },
  {
    keywords: ['cccd', 'cmnd', 'giấy tờ', 'giay to', 'hộ chiếu', 'ho chieu'],
    answer: `🪪 **Giấy tờ khi lên tàu:**

• Mang theo **CCCD/CMND** hoặc **Hộ chiếu** khi lên tàu
• Thông tin trên vé phải khớp với giấy tờ
• Trẻ em đi cùng người lớn không cần giấy tờ riêng
• Có mặt tại ga trước giờ khởi hành ít nhất **30 phút**`
  },
]

const GREETING = `Xin chào! 👋 Tôi là trợ lý KLN Train.

Tôi có thể giúp bạn:
• Hướng dẫn **đặt vé** tàu
• Tìm **ga tàu** theo tỉnh/thành phố
• Thông tin **giá vé**, **thanh toán**
• Chính sách **trả vé**, **đổi vé**

Hãy nhắn hoặc chọn câu hỏi bên dưới!`

const QUICK_QUESTIONS = [
  'Cách đặt vé',
  'Thanh toán',
  'Tra cứu vé',
  'Trả/đổi vé',
  'Giá vé',
]

// ─── Component ───────────────────────────────────────────────────

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'bot', text: GREETING }
  ])
  const [input, setInput] = useState('')
  const [stations, setStations] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const endRef = useRef(null)

  useEffect(() => {
    getStations()
      .then(res => setStations(res.data || res || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const addBotMessage = (text) => {
    setIsTyping(true)
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text }])
      setIsTyping(false)
    }, 500)
  }

  // Thay vì cố tách "tên địa danh" ra khỏi câu (dễ vỡ với câu tự nhiên kiểu
  // "tôi muốn đi Đà Nẵng thì nên tới ga nào"), so khớp ngược lại: tìm xem câu
  // có CHỨA tên tỉnh/thành hoặc tên ga nào đã biết hay không.
  const findStationsByProvince = (query) => {
    const q = query.toLowerCase()

    const provinces = [...new Set(stations.map(s => s.tinh_thanh).filter(Boolean))]
    const matchedProvince = provinces.find(p => q.includes(p.toLowerCase()))
    if (matchedProvince) {
      return stations
        .filter(s => s.tinh_thanh === matchedProvince)
        .sort((a, b) => (b.do_uu_tien ?? 0) - (a.do_uu_tien ?? 0))
    }

    const matchedByName = stations.filter(s => {
      const ten = s.ten_ga?.toLowerCase().replace(/^ga\s+/, '')
      return ten && q.includes(ten)
    })
    return matchedByName.length ? matchedByName : null
  }

  const handleSend = (text = input.trim()) => {
    if (!text) return
    setMessages(prev => [...prev, { from: 'user', text }])
    setInput('')

    const lower = text.toLowerCase()

    // 1. Tìm ga theo tỉnh
    const isStationQuery = /ga|tỉnh|thành phố|ở đâu|có ga|ga nào|ga tàu/.test(lower)
    if (isStationQuery) {
      const matched = findStationsByProvince(lower)
      if (matched) {
        const grouped = {}
        matched.forEach(s => {
          const key = s.tinh_thanh || 'Khác'
          if (!grouped[key]) grouped[key] = []
          grouped[key].push(s.ten_ga)
        })
        let reply = `🚉 **Tìm thấy ${matched.length} ga:**\n\n`
        Object.entries(grouped).forEach(([province, names]) => {
          reply += `📍 **${province}:**\n`
          names.forEach(n => { reply += `  • ${n}\n` })
          reply += '\n'
        })
        reply += 'Bạn có thể chọn ga khi đặt vé tại trang **Tìm vé**.'
        addBotMessage(reply)
        return
      }
    }

    // 2. Tìm câu trả lời theo keyword
    for (const guide of GUIDES) {
      if (guide.keywords.some(kw => lower.includes(kw))) {
        addBotMessage(guide.answer)
        return
      }
    }

    // 3. Tìm ga (fallback nếu không match keyword nào)
    const stationMatch = findStationsByProvince(lower)
    if (stationMatch) {
      const names = stationMatch.map(s => `• ${s.ten_ga} (${s.tinh_thanh || '--'})`).join('\n')
      addBotMessage(`🚉 **Các ga tìm thấy:**\n\n${names}\n\nVào **Tìm vé** để đặt vé từ các ga này!`)
      return
    }

    // 4. Không khớp luật nào → hỏi AI (OpenAI/Claude qua notification-service)
    setIsTyping(true)
    askChatbot(text, messages)
      .then(res => {
        const reply = res?.data?.reply || 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!'
        setMessages(prev => [...prev, { from: 'bot', text: reply }])
      })
      .catch(() => {
        setMessages(prev => [...prev, { from: 'bot', text: 'Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau!' }])
      })
      .finally(() => setIsTyping(false))
  }

  // Render markdown đơn giản (bold)
  const renderText = (text) => {
    return text.split('\n').map((line, i) => (
      <span key={i}>
        {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
          part.startsWith('**') && part.endsWith('**')
            ? <strong key={j}>{part.slice(2, -2)}</strong>
            : part
        )}
        {i < text.split('\n').length - 1 && <br />}
      </span>
    ))
  }

  return (
    <>
      {/* Nút mở chat */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#8C1D19] text-white rounded-full shadow-lg hover:bg-[#6a1613] transition-all hover:scale-110 flex items-center justify-center"
        >
          <FaCommentDots className="text-xl" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Header */}
          <div className="bg-[#8C1D19] px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 text-white">
              <FaTrain className="text-lg" />
              <div>
                <p className="font-bold text-sm">KLN Train Assistant</p>
                <p className="text-[10px] text-white/70">Hỗ trợ đặt vé & tra cứu ga</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <FaXmark className="text-lg" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                {msg.from === 'bot' && (
                  <div className="w-7 h-7 rounded-full bg-[#8C1D19] flex items-center justify-center shrink-0 mr-2 mt-1">
                    <FaRobot className="text-white text-xs" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                  msg.from === 'user'
                    ? 'bg-[#8C1D19] text-white rounded-br-sm'
                    : 'bg-white text-gray-700 border border-gray-200 rounded-bl-sm shadow-sm'
                }`}>
                  {renderText(msg.text)}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#8C1D19] flex items-center justify-center">
                  <FaRobot className="text-white text-xs" />
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Quick questions */}
          {messages.length <= 2 && (
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t bg-white shrink-0">
              {QUICK_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => handleSend(q)}
                  className="text-xs px-3 py-1.5 bg-[#8C1D19]/10 text-[#8C1D19] rounded-full hover:bg-[#8C1D19]/20 transition-colors font-medium">
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="px-3 py-2 border-t bg-white flex gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Nhập câu hỏi..."
              className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-full outline-none focus:border-[#8C1D19] focus:ring-1 focus:ring-[#8C1D19]/20"
            />
            <button onClick={() => handleSend()}
              disabled={!input.trim()}
              className="w-9 h-9 bg-[#8C1D19] text-white rounded-full flex items-center justify-center hover:bg-[#6a1613] disabled:bg-gray-300 transition-colors shrink-0">
              <FaPaperPlane className="text-xs" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot