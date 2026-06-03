import React, { useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Linking, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function CommunityScreen() {
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];
  const [loading, setLoading] = useState(true);

  // A placeholder community forum link
  const COMMUNITY_URL = 'https://discord.com/';

  const openExternalLink = () => {
    Linking.openURL(COMMUNITY_URL).catch((err) => console.error("Couldn't load page", err));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: colors.background, borderBottomColor: colors.backgroundElement }]}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Community</Text>
          <Text style={[styles.headerSubtitle, { color: colors.text + '80' }]}>Connect with peers & instructors</Text>
        </View>
        <TouchableOpacity 
          style={[styles.externalButton, { backgroundColor: colors.backgroundElement }]} 
          onPress={openExternalLink}
          activeOpacity={0.7}
        >
          <Ionicons name="open-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={[styles.webviewContainer, { backgroundColor: colors.background }]}>
        {loading && (
          <View style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={{ color: colors.text, marginTop: 12, fontSize: 16, fontWeight: '500' }}>Loading Community...</Text>
          </View>
        )}
        <WebView
          source={{ uri: COMMUNITY_URL }}
          onLoadEnd={() => setLoading(false)}
          style={{ flex: 1, backgroundColor: 'transparent' }}
          startInLoadingState={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  externalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webviewContainer: {
    flex: 1,
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  }
});
