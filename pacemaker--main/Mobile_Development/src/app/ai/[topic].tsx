import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

type Message = {
  id: string;
  sender: 'user' | 'ai';
  text: string;
};

export default function AskAIScreen() {
  const insets = useSafeAreaInsets();
  const { topic } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: `Hello ${user?.name || ''}! I'm your AI teaching assistant. How can I help you understand more about "${decodeURIComponent(topic as string)}"?`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText.trim()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    Keyboard.dismiss();
    setIsTyping(true);

    // Mock AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: `That's a great question about ${decodeURIComponent(topic as string)}! In simple terms, this concept refers to... [Mock AI Response generated from backend RAG model].`
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.sender === 'user';
    return (
      <View style={[styles.messageBubble, isUser ? styles.userBubble : [styles.aiBubble, { backgroundColor: colors.backgroundElement }]]}>
        <Text style={[styles.messageText, { color: isUser ? '#fff' : colors.text }]}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <Text style={[styles.closeButtonText, { color: colors.tint }]}>Close</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>Ask AI</Text>
        <View style={{ width: 60 }} />
      </View>

      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatContainer}
        showsVerticalScrollIndicator={false}
      />

      {isTyping && (
        <View style={styles.typingIndicator}>
          <Text style={{ color: colors.text, opacity: 0.5 }}>AI is thinking...</Text>
        </View>
      )}

      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.backgroundElement, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
          placeholder="Ask a question..."
          placeholderTextColor="#888"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendButton, { backgroundColor: inputText.trim() ? colors.tint : colors.backgroundElement }]}
          onPress={handleSend}
          disabled={!inputText.trim()}
        >
          <Text style={{ color: inputText.trim() ? '#fff' : '#888', fontWeight: 'bold' }}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  closeButton: {
    padding: 8,
    width: 60,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  chatContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
  },
  userBubble: {
    backgroundColor: '#0a7ea4',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  typingIndicator: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 12,
    fontSize: 15,
  },
  sendButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
