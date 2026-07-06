const router = require('express').Router()
const axios = require('axios')

const SYSTEM_PROMPT = `Tôi là trợ lý ảo của hệ thống đặt vé tàu hỏa KLN Train. 
Chúng tôi có thể giúp bạn:
- Hướng dẫn đặt vé, thanh toán, tra cứu vé
- Thông tin về các ga tàu, tuyến đường sắt Việt Nam
- Chính sách trả vé, đổi vé, hành lý
- Thông tin chung về du lịch bằng tàu hỏa
Nếu câu hỏi không liên quan đến tàu hỏa/du lịch, lịch sự từ chối và gợi ý hỏi về đặt vé.
Không trả lời quá 150 từ.`

router.post('/ask', async (req, res) => {
  try {
    const { message, history = [] } = req.body
    if (!message) return res.json({ success: false, message: 'Thiếu nội dung' })

    const apiKey = process.env.AI_API_KEY

    if (!apiKey) {
      return res.json({ success: true, data: { reply: 'Chatbot AI chưa được cấu hình. Vui lòng thử các câu hỏi gợi ý!' } })
    }

    const resp = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-3.5-turbo',
      max_tokens: 300,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...history.slice(-6).map(m => ({
          role: m.from === 'user' ? 'user' : 'assistant',
          content: m.text,
        })),
        { role: 'user', content: message },
      ],
    }, {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 15000,
    })
    const reply = resp.data.choices?.[0]?.message?.content || 'Không nhận được phản hồi.'

    res.json({ success: true, data: { reply } })
  } catch (err) {
    console.error('❌ Chatbot AI error:', err.response?.data?.error?.message || err.message)
    res.json({ success: true, data: { reply: 'Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại sau!' } })
  }
})

module.exports = router