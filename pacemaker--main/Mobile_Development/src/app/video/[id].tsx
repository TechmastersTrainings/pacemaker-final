import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Dimensions, ScrollView, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { apiClient } from '@/api/client';
import Video, { VideoRef } from 'react-native-video';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

type VideoDetails = {
  id: number;
  title: string;
  description: string;
  muxPlaybackId?: string;
  videoUrl?: string;
  topic?: string;
};

type Comment = {
  id: number;
  userId: number;
  userName: string;
  content: string;
  timestamp: string;
};

export default function VideoPlayerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [video, setVideo] = useState<VideoDetails | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const videoRef = useRef<VideoRef>(null);
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchVideoData = async () => {
      try {
        const response = await apiClient.get(`/videos/${id}`);
        setVideo(response.data);
        
        // Try fetching comments if the backend supports it
        try {
          const commentsRes = await apiClient.get(`/videos/${id}/comments`);
          setComments(commentsRes.data || []);
        } catch (e) {
          loadMockComments();
        }
      } catch (err: any) {
        console.error('Failed to fetch video details:', err);
        setError('Could not load video details.');
        
        // Fallback for development
        setVideo({
          id: Number(id),
          title: 'Sample Video for Development',
          description: 'This is a sample video playing a public stream since the backend is unreachable.',
          muxPlaybackId: 'qxb01i6T202018GFS00tbVObOqc5sq018ZNVsKRB9jG2r9IQ',
          topic: 'React Native Basics'
        });
        loadMockComments();
      } finally {
        setLoading(false);
      }
    };

    fetchVideoData();
  }, [id]);

  const loadMockComments = () => {
    setComments([
      { id: 1, userId: 2, userName: 'Jane Doe', content: 'This explanation was exactly what I needed. Thanks!', timestamp: new Date(Date.now() - 3600000).toISOString() },
      { id: 2, userId: 3, userName: 'Dr. Smith', content: 'Can we get more examples on this specific mechanism?', timestamp: new Date(Date.now() - 7200000).toISOString() }
    ]);
  };

  const handlePostComment = () => {
    if (!newComment.trim()) return;
    
    // Optimistic UI update
    const commentObj: Comment = {
      id: Date.now(),
      userId: user?.id || 0,
      userName: user?.name || 'You',
      content: newComment,
      timestamp: new Date().toISOString()
    };
    
    setComments([commentObj, ...comments]);
    setNewComment('');
    Keyboard.dismiss();
    
    // In production, we would await apiClient.post(`/videos/${id}/comments`, { content: newComment })
  };

  const handleAskAI = () => {
    const topic = video?.topic || video?.title || 'General';
    router.push(`/ai/${encodeURIComponent(topic)}`);
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  if (error && !video) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: colors.tint }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const videoSource = video?.muxPlaybackId 
    ? `https://stream.mux.com/${video.muxPlaybackId}.m3u8` 
    : video?.videoUrl;

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>
      
      {videoSource ? (
        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoSource }}
            style={styles.videoPlayer}
            controls={true}
            resizeMode="contain"
            onError={(e) => console.error('Video Player Error:', e)}
          />
        </View>
      ) : (
        <View style={[styles.videoContainer, styles.centerContainer]}>
          <Text style={styles.errorText}>Video source not available.</Text>
        </View>
      )}

      <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.text }]}>{video?.title}</Text>
          <TouchableOpacity 
            style={[styles.aiButton, { backgroundColor: colors.tint + '15', borderColor: colors.tint }]} 
            onPress={handleAskAI}
          >
            <Text style={[styles.aiButtonText, { color: colors.tint }]}>✨ Ask AI</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.description, { color: colors.text }]}>{video?.description}</Text>
        
        <View style={[styles.divider, { backgroundColor: colors.backgroundElement }]} />
        
        <Text style={[styles.commentsTitle, { color: colors.text }]}>Discussion ({comments.length})</Text>
        
        {comments.map(comment => (
          <View key={comment.id} style={styles.commentCard}>
            <View style={styles.commentAvatar}>
              <Text style={styles.avatarText}>{comment.userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.commentBody}>
              <View style={styles.commentHeader}>
                <Text style={[styles.commentUser, { color: colors.text }]}>{comment.userName}</Text>
                <Text style={{ color: colors.text, opacity: 0.5, fontSize: 12 }}>
                  {new Date(comment.timestamp).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[styles.commentContent, { color: colors.text }]}>{comment.content}</Text>
            </View>
          </View>
        ))}
        
        {/* Padding for bottom input */}
        <View style={{ height: 80 }} /> 
      </ScrollView>

      {/* Sticky Comment Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.backgroundElement, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TextInput
          style={[styles.input, { backgroundColor: colors.backgroundElement, color: colors.text }]}
          placeholder="Add a comment..."
          placeholderTextColor="#888"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity 
          style={[styles.postButton, { backgroundColor: newComment.trim() ? colors.tint : colors.backgroundElement }]}
          onPress={handlePostComment}
          disabled={!newComment.trim()}
        >
          <Text style={{ color: newComment.trim() ? '#fff' : '#888', fontWeight: 'bold' }}>Post</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: width,
    height: width * (9 / 16),
    backgroundColor: '#000',
    marginTop: 40,
  },
  videoPlayer: {
    ...StyleSheet.absoluteFillObject,
  },
  detailsContainer: {
    padding: 20,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
  },
  aiButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  description: {
    fontSize: 15,
    opacity: 0.8,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  commentCard: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  commentBody: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  commentUser: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  commentContent: {
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    width: '100%',
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
  postButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
