import { useState, useEffect, useRef, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import chatAPI from '../../api/chatApi'
import { HiOutlinePaperAirplane, HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'

export default function UserChatPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)
  const lastMsgIdRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatAPI.getList({})
      if (res.data.status === 'success') {
        const list = res.data.data || []
        setConversations(list)
        const bid = searchParams.get('booking_id')
        if (bid && !activeConvId) {
          const match = list.find(c => String(c.booking_id) === String(bid))
          if (match) {
            setActiveConvId(match.conversation_id)
          }
        }
        if (!activeConvId && !bid && list.length > 0 && !searchParams.get('booking_id')) {
          setActiveConvId(list[0].conversation_id)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [searchParams, activeConvId])

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return
    setLoadingMessages(true)
    try {
      const res = await chatAPI.getMessages({ conversation_id: convId })
      if (res.data.status === 'success') {
        const msgs = res.data.data?.messages || []
        setMessages(msgs)
        lastMsgIdRef.current = msgs.length > 0 ? msgs[msgs.length - 1].id : null
        setTimeout(scrollToBottom, 100)
        await chatAPI.markRead({ conversation_id: convId })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingMessages(false)
    }
  }, [scrollToBottom])

  useEffect(() => {
    loadConversations()
  }, [])

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId)
    }
  }, [activeConvId])

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      loadConversations()
      if (activeConvId) {
        chatAPI.getMessages({ conversation_id: activeConvId }).then(res => {
          if (res.data.status === 'success') {
            const msgs = res.data.data?.messages || []
            setMessages(msgs)
            lastMsgIdRef.current = msgs.length > 0 ? msgs[msgs.length - 1].id : null
            setTimeout(scrollToBottom, 100)
          }
        }).catch(() => {})
      }
    }, 5000)
    return () => clearInterval(pollingRef.current)
  }, [activeConvId, loadConversations, scrollToBottom])

  const handleSend = async (e) => {
    e.preventDefault()
    const text = newMessage.trim()
    if (!text || !activeConvId || sending) return
    setSending(true)
    try {
      await chatAPI.sendMessage({ conversation_id: activeConvId, message: text })
      setNewMessage('')
      await loadMessages(activeConvId)
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const selectConversation = (convId) => {
    setActiveConvId(convId)
    setSearchParams({})
  }

  const formatTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  }

  const formatPreviewTime = (dateStr) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return formatTime(dateStr)
    if (diffDays === 1) return 'Yesterday'
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  }

  const activeConv = conversations.find(c => c.conversation_id === activeConvId)

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)]">
        <div className="w-80 border-r border-divider bg-white animate-pulse p-4 space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-divider rounded-xl" />)}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-48 bg-divider rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-white rounded-card overflow-hidden border border-divider">
      <div className="w-80 border-r border-divider flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-divider">
          <h2 className="text-lg font-bold text-main-text">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-divider mb-3" />
              <p className="text-sm font-medium text-main-text">No conversations yet</p>
              <p className="text-xs text-secondary-text mt-1">Chat will be available after booking confirmation</p>
            </div>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.conversation_id}
                onClick={() => selectConversation(conv.conversation_id)}
                className={`w-full text-left p-4 border-b border-divider hover:bg-background transition-colors ${
                  activeConvId === conv.conversation_id ? 'bg-primary/5 border-l-3 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-semibold text-sm">{conv.other_name?.charAt(0) || 'H'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-main-text truncate">{conv.other_name}</span>
                      <span className="text-[10px] text-secondary-text flex-shrink-0 ml-2">{formatPreviewTime(conv.latest_message_time)}</span>
                    </div>
                    <p className="text-xs text-primary font-medium truncate mb-0.5">{conv.property_title}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-secondary-text truncate">{conv.latest_message || 'No messages yet'}</p>
                      {conv.unread_count > 0 && (
                        <span className="flex-shrink-0 ml-2 bg-primary text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {activeConv ? (
          <>
            <div className="p-4 border-b border-divider bg-background">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">{activeConv.other_name?.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-main-text">{activeConv.other_name}</p>
                  <p className="text-xs text-secondary-text">{activeConv.property_title} • Booking #{activeConv.booking_id}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full">
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-sm text-secondary-text">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isGuest = msg.sender_role === 'Guest'
                  return (
                    <div key={msg.id} className={`flex ${isGuest ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                        isGuest
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-white text-main-text border border-divider rounded-bl-md'
                      }`}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                        <p className={`text-[10px] mt-1 ${isGuest ? 'text-white/70' : 'text-secondary-text'}`}>
                          {formatTime(msg.created_at)}
                        </p>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} className="p-4 border-t border-divider bg-white">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={1000}
                  className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-divider bg-background text-main-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <HiOutlinePaperAirplane className="w-5 h-5" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center p-8">
            <div>
              <HiOutlineChatBubbleLeftRight className="w-16 h-16 text-divider mx-auto mb-4" />
              <h3 className="text-lg font-bold text-main-text mb-1">Select a conversation</h3>
              <p className="text-sm text-secondary-text">Choose a conversation from the left to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
