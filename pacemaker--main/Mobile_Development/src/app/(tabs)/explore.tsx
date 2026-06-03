import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Linking, Alert } from 'react-native';
import { apiClient } from '@/api/client';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LiveClass = {
  id: number;
  title: string;
  classDateTime: string;
  zoomJoinUrl: string;
  zoomMeetingId?: string;
  trainerName?: string;
  topic?: string;
  description?: string;
};

type ClassStatus = 'LIVE' | 'UPCOMING' | 'COMPLETED';

export default function LiveClassScreen() {
  const insets = useSafeAreaInsets();
  const [liveClasses, setLiveClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const getClassStatus = (isoString: string): ClassStatus => {
    const classTime = new Date(isoString).getTime();
    const now = Date.now();
    const duration = 1000 * 60 * 120; // Assume 2hr max class time

    if (now >= classTime && now <= classTime + duration) return 'LIVE';
    if (now > classTime + duration) return 'COMPLETED';
    return 'UPCOMING';
  };

  const sortClassesByStatus = (classes: LiveClass[]) => {
    return classes.sort((a, b) => {
      const statusA = getClassStatus(a.classDateTime);
      const statusB = getClassStatus(b.classDateTime);
      
      const weight = { LIVE: 1, UPCOMING: 2, COMPLETED: 3 };
      if (weight[statusA] !== weight[statusB]) {
        return weight[statusA] - weight[statusB];
      }
      
      // If same status, sort by date
      return new Date(a.classDateTime).getTime() - new Date(b.classDateTime).getTime();
    });
  };

  const fetchLiveClasses = async () => {
    try {
      const response = await apiClient.get('/live-classes');
      setLiveClasses(sortClassesByStatus(response.data));
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch live classes:', err);
      setError('Could not load live classes.');
      
      // Fallback data for dev
      const mockData: LiveClass[] = [
        {
          id: 0,
          title: 'Emergency Medicine Protocols',
          topic: 'Emergency Med',
          trainerName: 'Dr. Alan Grant',
          classDateTime: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
          description: 'Live trauma assessment and management protocols.',
          zoomJoinUrl: 'https://zoom.us/j/1112223333',
          zoomMeetingId: '111 222 3333'
        },
        {
          id: 1,
          title: 'Advanced Cardiology Masterclass',
          topic: 'Cardiology',
          trainerName: 'Dr. Sarah Jenkins',
          classDateTime: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(), // 2 hours from now
          description: 'A deep dive into advanced cardiology concepts for the upcoming exam.',
          zoomJoinUrl: 'https://zoom.us/j/1234567890?pwd=abc',
          zoomMeetingId: '123 456 7890'
        },
        {
          id: 2,
          title: 'Neurology Q&A Session',
          topic: 'Neurology',
          trainerName: 'Dr. Michael Chen',
          classDateTime: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
          description: 'Interactive Q&A covering the most challenging neurology topics.',
          zoomJoinUrl: 'https://zoom.us/j/0987654321',
          zoomMeetingId: '098 765 4321'
        }
      ];
      setLiveClasses(sortClassesByStatus(mockData));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLiveClasses();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLiveClasses(); // Re-fetches and naturally re-evaluates statuses
  };

  const handleJoinClass = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Cannot open this URL. Please make sure Zoom is installed.");
      }
    } catch (error) {
      console.error("Error opening URL:", error);
      Alert.alert("Error", "An unexpected error occurred while trying to open the link.");
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString(undefined, { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const renderClassItem = ({ item }: { item: LiveClass }) => {
    const status = getClassStatus(item.classDateTime);

    return (
      <View style={[styles.classCard, { backgroundColor: colors.backgroundElement }]}>
        <View style={styles.cardHeader}>
          <Text style={[styles.topicBadge, { backgroundColor: colors.tint + '20', color: colors.tint }]}>
            {item.topic || 'General'}
          </Text>
          
          {status === 'LIVE' && (
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE NOW</Text>
            </View>
          )}
          {status === 'UPCOMING' && (
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#ff9500' }}>UPCOMING</Text>
          )}
          {status === 'COMPLETED' && (
            <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#8e8e93' }}>COMPLETED</Text>
          )}
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
        <Text style={[styles.trainer, { color: colors.text, opacity: 0.8 }]}>By {item.trainerName || 'Expert Faculty'}</Text>
        
        <Text style={[styles.dateTime, { color: colors.text, opacity: 0.6 }]}>
          {formatDateTime(item.classDateTime)}
        </Text>
        
        {item.description && (
          <Text style={[styles.description, { color: colors.text, opacity: 0.7 }]} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <TouchableOpacity 
          style={[
            styles.joinButton, 
            { backgroundColor: status === 'LIVE' ? '#ff3b30' : status === 'UPCOMING' ? colors.tint : colors.backgroundElement },
            status === 'COMPLETED' && { borderWidth: 1, borderColor: colors.text + '30' }
          ]} 
          onPress={() => status === 'LIVE' ? handleJoinClass(item.zoomJoinUrl) : null}
          activeOpacity={status === 'LIVE' ? 0.8 : 1}
        >
          <Text style={[
            styles.joinButtonText, 
            { color: status === 'COMPLETED' ? colors.text : '#fff' }
          ]}>
            {status === 'LIVE' ? 'Join Now via Zoom' : status === 'UPCOMING' ? 'Link Available Soon' : 'Watch Recording'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Live Classes</Text>
      
      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : error && liveClasses.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={fetchLiveClasses}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={liveClasses}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderClassItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.tint} />
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.text }]}>No upcoming live classes.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginHorizontal: 16,
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
  classCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ff3b3020',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ff3b30',
    marginRight: 6,
  },
  liveText: {
    color: '#ff3b30',
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trainer: {
    fontSize: 15,
    marginBottom: 8,
  },
  dateTime: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  joinButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  emptyContainer: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    opacity: 0.6,
  }
});
