import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { messageAPI } from '../../services/api';
import { onNewMessage, offNewMessage } from '../../services/socket';
import { useAuth } from '../../hooks/useAuth';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ChatScreenProps {
  route: {
    params: {
      conversationId?: string;
      userId: string;
      userName?: string;
    };
  };
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { conversationId, userId } = route.params;
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    } else {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    const handleNewMessage = (message: Message) => {
      if (
        message.sender_id === userId ||
        message.receiver_id === userId
      ) {
        setMessages((prev) => [message, ...prev]);
      }
    };

    onNewMessage(handleNewMessage);
    return () => {
      offNewMessage(handleNewMessage as any);
    };
  }, [userId]);

  const loadMessages = async () => {
    if (!conversationId) return;
    try {
      const response = await messageAPI.getMessages(conversationId);
      setMessages(response.data);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const content = inputText.trim();
    setInputText('');
    try {
      const response = await messageAPI.sendMessage(userId, content);
      setMessages((prev) => [response.data, ...prev]);
    } catch {
      // handle error
      setInputText(content);
    }
  };

  const isMyMessage = (message: Message) => message.sender_id === user?.id;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = isMyMessage(item);
    return (
      <View style={[styles.messageBubble, isMine ? styles.myMessage : styles.otherMessage]}>
        <Text style={[styles.messageText, isMine ? styles.myMessageText : styles.otherMessageText]}>
          {item.content}
        </Text>
        <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        inverted
        contentContainerStyle={styles.messagesList}
      />
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} activeOpacity={0.7}>
          <Text style={styles.sendButtonText}>{t('common.send')}</Text>
        </TouchableOpacity>
        <TextInput
          style={styles.textInput}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t('messages.typeMessage')}
          placeholderTextColor="#9E9E9E"
          multiline
          textAlign="right"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 16,
    padding: 12,
    marginVertical: 4,
  },
  myMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#00897B',
    borderBottomLeftRadius: 4,
  },
  otherMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'right',
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#212121',
  },
  messageTime: {
    fontSize: 10,
    color: '#BDBDBD',
    marginTop: 4,
    textAlign: 'left',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 48,
    textAlign: 'right',
  },
  sendButton: {
    backgroundColor: '#00897B',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
    minHeight: 48,
    justifyContent: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default ChatScreen;
