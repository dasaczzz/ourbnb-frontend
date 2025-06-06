import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store/store';
import { ChatList } from './ChatList';
import { ChatWindow } from './ChatWindow';
import { toggleChatModal, addMessage, setConversations } from '../../store/slices/chatSlice';
import { database, ref, onValue, off } from '../../lib/firebase';
import { FaXmark, FaComments } from 'react-icons/fa6';

export const ChatModal = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector((state: RootState) => state.chat.isModalOpen);
  const activeConversation = useSelector((state: RootState) => state.chat.activeConversation);
  const conversations = useSelector((state: RootState) => state.chat.conversations);
  const currentUser = useSelector((state: RootState) => state.user);

  useEffect(() => {
    if (!currentUser.id) return;

    // Listen for new messages in all conversations
    const userChatsRef = ref(database, `userChats/${currentUser.id}`);
    onValue(userChatsRef, (snapshot) => {
      const chats = snapshot.val();
      if (chats) {
        const conversationsArray = Object.entries(chats).map(([id, chat]: [string, any]) => ({
          id,
          participantId: chat.participantId,
          participantName: chat.participantName,
          participantPhoto: chat.participantPhoto,
          lastMessage: chat.lastMessage,
          unreadCount: chat.unreadCount || 0
        }));
        dispatch(setConversations(conversationsArray));
      }
    });

    // Cleanup listener on unmount
    return () => {
      off(userChatsRef);
    };
  }, [currentUser.id, dispatch]);

  useEffect(() => {
    if (!activeConversation || !currentUser.id) return;

    // Listen for new messages in active conversation
    const messagesRef = ref(database, `chats/${activeConversation}/messages`);
    onValue(messagesRef, (snapshot) => {
      const messages = snapshot.val();
      if (messages) {
        Object.entries(messages).forEach(([id, message]: [string, any]) => {
          dispatch(addMessage({
            conversationId: activeConversation,
            message: {
              id,
              ...message
            }
          }));
        });
      }
    });

    return () => {
      off(messagesRef);
    };
  }, [activeConversation, currentUser.id, dispatch]);

  const activeChat = conversations.find(c => c.id === activeConversation);

  if (!currentUser.id) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={() => dispatch(toggleChatModal())}
        className="fixed bottom-4 right-4 bg-primary-400 text-white rounded-full p-4 shadow-lg hover:bg-primary-500 transition-colors z-50"
      >
        <FaComments className="w-8 h-8" />
      </button>

      {/* Chat Modal */}
      <div
        className={`fixed bottom-20 right-4 w-[450px] h-[500px] bg-white rounded-t-lg shadow-xl transition-all duration-300 ${
          isOpen ? 'flex' : 'hidden'
        } flex-col z-50`}
      >
        {/* Header */}
        <div 
          className="flex items-center justify-between px-4 py-3 bg-primary-400 text-white cursor-pointer"
          onClick={() => dispatch(toggleChatModal())}
        >
          <h3 className="font-semibold">Mensajes</h3>
          <FaXmark className="w-4 h-4" />
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-y-auto">
          <div className={`${activeChat ? 'w-1/2' : 'w-1/2'} border-r border-gray-200`}>
            <ChatList />
          </div>
          
          {activeChat ? (
            <div className="w-1/2">
              <div className="h-full">
                <ChatWindow
                  conversationId={activeChat.id}
                  participantPhoto={activeChat.participantPhoto}
                />
              </div>
            </div>
          ) : (
            <div className="w-1/2 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p className="mb-2">Puedes empezar una conversación desde el perfil de un Host</p>
                <p>Selecciona una conversación para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};