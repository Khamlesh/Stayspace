import { useState, useEffect, useRef, useCallback } from 'react'
import chatAPI from '../../api/chatApi'
import { formatMessageTime, formatPreviewTime } from '../../utils/chatTimestamp'
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
} from 'react-icons/hi2'

export default function AdminChatPage() {
  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const messagesEndRef = useRef(null)
  const pollingRef = useRef(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const loadConversations = useCallback(async () => {
    try {
      const res = await chatAPI.adminGetConversations({ search })
      if (res.data.status === 'success') setConversations(res.data.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search])

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return
    setLoadingMessages(true)
    try {
      const res = await chatAPI.getMessages({ conversation_id: convId })
      if (res.data.status === 'success') {
        setMessages(res.data.data?.messages || [])
        setTimeout(scrollToBottom, 100)
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
    if (activeConvId) loadMessages(activeConvId)
  }, [activeConvId])

  useEffect(() => {
    pollingRef.current = setInterval(() => {
      loadConversations()
      if (activeConvId) {
        chatAPI.getMessages({ conversation_id: activeConvId }).then(res => {
          if (res.data.status === 'success') {
            setMessages(res.data.data?.messages || [])
            setTimeout(scrollToBottom, 100)
          }
        }).catch(() => {})
      }
    }, 5000)
    return () => clearInterval(pollingRef.current)
  }, [activeConvId, loadConversations, scrollToBottom])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
  }

  const activeConv = conversations.find(c => c.conversation_id === activeConvId)

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-5rem)]">
        <div className="w-80 border-r border-divider bg-white animate-pulse p-4 space-y-3">
          <div className="h-10 bg-divider rounded-xl mb-4" />
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-divider rounded-xl" />)}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-48 bg-divider rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-main-text">Conversations</h1>
          <p className="text-sm text-secondary-text mt-1">View-only access to all guest-host conversations</p>
        </div>
        <button onClick={loadConversations} className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 transition-colors">
          <HiOutlineArrowPath className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex h-[calc(100vh-12rem)] bg-white rounded-card overflow-hidden border border-divider">
        <div className="w-80 border-r border-divider flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-divider">
            <form onSubmit={handleSearch} className="relative">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-text" />
              <input
                type="text"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search by guest, host, property, booking..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-divider bg-background text-main-text placeholder:text-secondary-text focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
              />
            </form>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6">
                <HiOutlineChatBubbleLeftRight className="w-12 h-12 text-divider mb-3" />
                <p className="text-sm font-medium text-main-text">No conversations</p>
              </div>
            ) : (
              conversations.map(conv => (
                <button
                  key={conv.conversation_id}
                  onClick={() => setActiveConvId(conv.conversation_id)}
                  className={`w-full text-left p-4 border-b border-divider hover:bg-background transition-colors ${
                    activeConvId === conv.conversation_id ? 'bg-primary/5 border-l-3 border-l-primary' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                      <HiOutlineChatBubbleLeftRight className="w-5 h-5 text-secondary-text" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-semibold text-primary">#{conv.booking_id}</span>
                        <span className="text-[10px] text-secondary-text flex-shrink-0 ml-2">{formatPreviewTime(conv.latest_message_time)}</span>
                      </div>
                      <p className="text-xs text-secondary-text truncate mb-0.5">
                        {conv.guest_name} → {conv.host_name}
                      </p>
                      <p className="text-xs text-primary font-medium truncate mb-0.5">{conv.property_title}</p>
                      <p className="text-xs text-secondary-text truncate">{conv.latest_message || 'No messages yet'}</p>
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
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-main-text">
                      Booking #{activeConv.booking_id} — {activeConv.property_title}
                    </p>
                    <p className="text-xs text-secondary-text">
                      Guest: {activeConv.guest_name} | Host: {activeConv.host_name}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-secondary-text bg-gray-100 px-3 py-1 rounded-full">
                    Admin View — Read Only
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {loadingMessages ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-sm text-secondary-text">No messages in this conversation</p>
                  </div>
                ) : (
                  messages.map(msg => {
                    const isGuest = msg.sender_role === 'Guest'
                    const isHost = msg.sender_role === 'Host'
                    return (
                      <div key={msg.id} className={`flex ${isGuest ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                          isGuest
                            ? 'bg-blue-50 text-main-text border border-blue-200 rounded-br-md'
                            : isHost
                              ? 'bg-emerald-50 text-main-text border border-emerald-200 rounded-bl-md'
                              : 'bg-gray-100 text-main-text border border-gray-200 rounded-bl-md'
                        }`}>
                          <p className={`text-[10px] font-semibold mb-1 ${
                            isGuest ? 'text-blue-600' : isHost ? 'text-emerald-600' : 'text-gray-600'
                          }`}>
                            {msg.sender_role}
                          </p>
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                          <p className="text-[10px] text-secondary-text mt-1">{formatMessageTime(msg.created_at)}</p>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center p-8">
              <div>
                <HiOutlineChatBubbleLeftRight className="w-16 h-16 text-divider mx-auto mb-4" />
                <h3 className="text-lg font-bold text-main-text mb-1">Select a conversation</h3>
                <p className="text-sm text-secondary-text">Choose a conversation to view messages (read-only)</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
