import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Linking, Alert } from 'react-native';
import { apiClient } from '@/api/client';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type StudyMaterial = {
  id: number;
  subjectName: string;
  chapterName: string;
  fileName: string;
  fileType: string;
};

export default function NotesScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await apiClient.get('/study-materials');
        setMaterials(response.data);
      } catch (error) {
        console.warn('Failed to fetch study materials, using mock data.');
        setMaterials([
          { id: 1, subjectName: 'Anatomy', chapterName: 'Upper Limb', fileName: 'upper_limb_notes.pdf', fileType: 'application/pdf' },
          { id: 2, subjectName: 'Physiology', chapterName: 'Cardiovascular System', fileName: 'cvs_review.pdf', fileType: 'application/pdf' },
          { id: 3, subjectName: 'Pathology', chapterName: 'Cell Injury', fileName: 'cell_injury_slides.pdf', fileType: 'application/pdf' },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  const handleDownload = async (id: number) => {
    // In production, the base URL should come from env config
    const baseUrl = apiClient.defaults.baseURL || 'http://localhost:8080/api';
    const downloadUrl = `${baseUrl}/v1/study-materials/download/${id}`;
    
    try {
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
      } else {
        Alert.alert('Error', 'Cannot open the download link.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'An unexpected error occurred while trying to download the file.');
    }
  };

  const renderMaterial = ({ item }: { item: StudyMaterial }) => (
    <View style={[styles.card, { backgroundColor: colors.backgroundElement }]}>
      <View style={styles.iconContainer}>
        <Text style={styles.iconText}>PDF</Text>
      </View>
      <View style={styles.contentContainer}>
        <Text style={[styles.subjectName, { color: colors.text }]}>{item.subjectName}</Text>
        <Text style={[styles.chapterName, { color: colors.text }]}>{item.chapterName}</Text>
      </View>
      <TouchableOpacity 
        style={[styles.downloadButton, { backgroundColor: colors.tint + '15' }]} 
        onPress={() => handleDownload(item.id)}
      >
        <Text style={[styles.downloadText, { color: colors.tint }]}>Get</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Study Notes</Text>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <FlatList
          data={materials}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMaterial}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <Text style={{ color: colors.text, opacity: 0.6 }}>No study materials available.</Text>
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
    marginHorizontal: 20,
    marginBottom: 20,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  contentContainer: {
    flex: 1,
  },
  subjectName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  chapterName: {
    fontSize: 14,
    opacity: 0.7,
  },
  downloadButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginLeft: 10,
  },
  downloadText: {
    fontWeight: 'bold',
    fontSize: 14,
  }
});
