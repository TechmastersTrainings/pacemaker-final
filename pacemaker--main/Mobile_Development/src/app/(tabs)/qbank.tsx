import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/api/client';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import storage from '@/utils/storage';

type Question = {
  id: number;
  text: string;
  subject?: string;
  difficulty?: string;
  tag?: string;
};

type PaginationResponse = {
  content: Question[];
  totalPages: number;
  totalElements: number;
  last: boolean;
  number: number;
};

export default function QBankScreen() {
  const insets = useSafeAreaInsets();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState('');

  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const fetchQuestions = async (pageNumber: number, query: string, isRefresh = false) => {
    if (pageNumber === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      // Offline-first approach for page 0
      if (pageNumber === 0 && !query) {
        const cachedQuestions = await storage.getItem('@cached_qbank');
        if (cachedQuestions) {
          setQuestions(JSON.parse(cachedQuestions));
          setLoading(false);
        }
      }

      const response = await apiClient.get('/qbank/questions', {
        params: {
          subject: query || undefined, // use subject as our search parameter for now
          page: pageNumber,
          size: 15
        }
      });
      
      const data: PaginationResponse = response.data;
      
      if (isRefresh) {
        setQuestions(data.content || []);
        // Cache the first page of default results
        if (!query) {
          await storage.setItem('@cached_qbank', JSON.stringify(data.content || []));
        }
      } else {
        setQuestions(prev => [...prev, ...(data.content || [])]);
      }
      
      setHasMore(!data.last);
      setError('');
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      
      if (isRefresh && questions.length === 0) {
        setError('You are offline and have no cached questions.');
        // Fallback for development if backend fails
        const mockData = Array.from({ length: 15 }).map((_, i) => ({
          id: pageNumber * 15 + i,
          text: `Sample question ${pageNumber * 15 + i + 1} about ${query || 'Medicine'}`,
          subject: query || 'General Medicine',
          difficulty: i % 3 === 0 ? 'HARD' : 'MEDIUM'
        }));
        setQuestions(mockData);
        setHasMore(pageNumber < 3); // mock 4 pages total
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchQuestions(0, searchQuery, true);
  }, []);

  const handleSearch = () => {
    Keyboard.dismiss();
    setPage(0);
    fetchQuestions(0, searchQuery, true);
  };

  const loadMore = () => {
    if (!loadingMore && hasMore && !loading) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchQuestions(nextPage, searchQuery, false);
    }
  };

  const renderQuestion = ({ item }: { item: Question }) => (
    <View style={[styles.questionCard, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.cardHeader}>
        <Text style={[styles.badge, { backgroundColor: colors.tint + '20', color: colors.tint }]}>
          {item.subject || 'QBank'}
        </Text>
        <Text style={[styles.difficulty, { color: item.difficulty === 'HARD' ? '#ff3b30' : '#ff9500' }]}>
          {item.difficulty || 'MEDIUM'}
        </Text>
      </View>
      <Text style={[styles.questionText, { color: colors.text }]}>{item.text}</Text>
      <TouchableOpacity style={[styles.solveButton, { borderColor: colors.tint }]}>
        <Text style={[styles.solveButtonText, { color: colors.tint }]}>Solve Question</Text>
      </TouchableOpacity>
    </View>
  );

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 20 }} />;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.tint} />
      </View>
    );
  };

  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>QBank</Text>
        <TouchableOpacity 
          style={[styles.mockButton, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/exam/1')}
        >
          <Text style={styles.mockButtonText}>Take Mock</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={[styles.searchInput, { backgroundColor: colors.backgroundElement, color: colors.text }]}
          placeholder="Search by subject..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={[styles.searchButton, { backgroundColor: colors.tint }]} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : error && questions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.tint }]} onPress={() => fetchQuestions(0, searchQuery, true)}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderQuestion}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={{ color: colors.text, opacity: 0.6 }}>No questions found.</Text>
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
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  mockButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  mockButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  searchButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
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
  questionCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  difficulty: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 20,
  },
  solveButton: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  solveButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
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
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  }
});
