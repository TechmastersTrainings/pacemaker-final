import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, StyleSheet, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/api/client';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import storage from '@/utils/storage';

const { width } = Dimensions.get('window');

type Video = {
  id: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const { user } = useAuth();

  const fetchVideos = async () => {
    try {
      // 1. Try to load cached data first for offline-first approach
      const cachedVideos = await storage.getItem('@cached_videos');
      if (cachedVideos) {
        setVideos(JSON.parse(cachedVideos));
        setLoading(false);
      }

      // 2. Fetch fresh data from API
      const response = await apiClient.get('/videos');
      const fetchedVideos = response.data;
      setVideos(fetchedVideos);
      setError('');
      
      // 3. Update cache
      await storage.setItem('@cached_videos', JSON.stringify(fetchedVideos));
    } catch (err: any) {
      console.error('Failed to fetch videos:', err);
      
      if (videos.length === 0) {
        setError('You are offline and have no cached videos.');
        // Fallback data for dev
        setVideos([
          { id: 1, title: 'Introduction to React Native', description: 'Learn the basics of React Native development.', thumbnailUrl: 'https://picsum.photos/seed/1/400/225' },
          { id: 2, title: 'Advanced State Management', description: 'Deep dive into Context API and Redux.', thumbnailUrl: 'https://picsum.photos/seed/2/400/225' },
          { id: 3, title: 'Mastering Mux Video', description: 'How to integrate HLS streams seamlessly.', thumbnailUrl: 'https://picsum.photos/seed/3/400/225' },
        ]);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const renderDashboardHeader = () => (
    <View style={styles.dashboardContainer}>
      <Text style={[styles.greeting, { color: colors.text }]}>
        Good Morning, {user?.name || 'Student'}!
      </Text>
      <Text style={{ color: colors.text, opacity: 0.6, marginBottom: 20 }}>Ready to crush your goals today?</Text>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.statValue, { color: colors.tint }]}>1,245</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Q's Solved</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.statValue, { color: '#34c759' }]}>42h</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Watched</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: colors.backgroundElement }]}>
          <Text style={[styles.statValue, { color: '#ff9500' }]}>#1,203</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Rank</Text>
        </View>
      </View>

      {/* Continue Watching Card */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Continue Watching</Text>
      <TouchableOpacity 
        style={[styles.continueCard, { backgroundColor: colors.backgroundElement }]}
        onPress={() => router.push('/video/1')}
        activeOpacity={0.8}
      >
        <Image 
          source={{ uri: 'https://picsum.photos/seed/1/400/225' }} 
          style={styles.continueThumbnail} 
        />
        <View style={styles.continueOverlay}>
          <View style={styles.playIconContainer}>
            <Text style={{ color: '#fff', fontSize: 24, marginLeft: 4 }}>▶</Text>
          </View>
        </View>
        <View style={styles.continueInfo}>
          <Text style={[styles.continueTitle, { color: colors.text }]} numberOfLines={1}>
            Introduction to React Native
          </Text>
          <Text style={{ color: colors.text, opacity: 0.7, fontSize: 12, marginBottom: 8 }}>
            14 mins left
          </Text>
          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBarFill, { backgroundColor: colors.tint, width: '65%' }]} />
          </View>
        </View>
      </TouchableOpacity>

      <Text style={[styles.headerTitle, { color: colors.text }]}>Featured Courses</Text>
    </View>
  );

  const renderVideoItem = ({ item }: { item: Video }) => (
    <TouchableOpacity 
      style={[styles.videoCard, { backgroundColor: colors.backgroundElement }]} 
      onPress={() => router.push(`/video/${item.id}`)}
      activeOpacity={0.7}
    >
      <Image 
        source={{ uri: item.thumbnailUrl || 'https://via.placeholder.com/400x225?text=No+Thumbnail' }} 
        style={styles.thumbnail} 
        resizeMode="cover"
      />
      <View style={styles.cardContent}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>{item.title}</Text>
        <Text style={[styles.description, { color: colors.text, opacity: 0.7 }]} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : error && videos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={fetchVideos}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderDashboardHeader}
          renderItem={renderVideoItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    },
  dashboardContainer: {
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  continueCard: {
    borderRadius: 16,
    marginBottom: 30,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  continueThumbnail: {
    width: '100%',
    height: 160,
  },
  continueOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    height: 160,
  },
  playIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  continueInfo: {
    padding: 16,
  },
  continueTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  videoCard: {
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  thumbnail: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  errorText: {
    color: '#ff3b30',
    marginBottom: 16,
    fontSize: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  }
});
