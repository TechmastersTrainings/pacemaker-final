import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Linking, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { apiClient } from '@/api/client';
import { Colors } from '@/constants/theme';
import { useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

type UserSubscription = {
  planName: string;
  status: 'ACTIVE' | 'EXPIRED' | 'NONE';
  endDate?: string;
  features?: string[];
};

type Badge = {
  id: string;
  icon: string;
  label: string;
  earned: boolean;
  description: string;
};

type UserStats = {
  streak: number;
  longestStreak: number;
  questionsSolved: number;
  hoursWatched: number;
  mocksTaken: number;
  rank: number;
};

const ALL_BADGES: Badge[] = [
  { id: 'first_question', icon: '🎯', label: 'First Blood',    earned: true,  description: 'Solved your first question' },
  { id: 'streak_7',       icon: '🔥', label: '7-Day Streak',   earned: true,  description: '7 days in a row' },
  { id: 'century',        icon: '💯', label: 'Century',        earned: true,  description: 'Solved 100 questions' },
  { id: 'video_10',       icon: '🎬', label: 'Binge Watcher',  earned: true,  description: 'Watched 10 videos' },
  { id: 'mock_ace',       icon: '🏆', label: 'Mock Ace',       earned: false, description: 'Score 90%+ on a mock exam' },
  { id: 'streak_30',      icon: '⚡', label: '30-Day Legend',  earned: false, description: '30 days in a row' },
  { id: 'top_100',        icon: '🌟', label: 'Top 100',        earned: false, description: 'Reach rank #100' },
  { id: 'speed_demon',    icon: '⏱️', label: 'Speed Demon',    earned: false, description: 'Finish a mock in under 20 min' },
];

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const router = useRouter();
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subRes, statsRes] = await Promise.allSettled([
          apiClient.get('/user/subscription'),
          apiClient.get('/user/stats'),
        ]);

        if (subRes.status === 'fulfilled') setSubscription(subRes.value.data);
        else throw new Error('sub failed');

        if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
        else throw new Error('stats failed');

      } catch {
        // Mock fallback
        setSubscription({
          planName: 'Free Basic Tier',
          status: 'NONE',
          features: ['Limited QBank Access', 'SD Video Quality', 'No Mock Exams'],
        });
        setStats({
          streak: 12,
          longestStreak: 21,
          questionsSolved: 1245,
          hoursWatched: 42,
          mocksTaken: 8,
          rank: 1203,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleUpgrade = async () => {
    const WEB_PAYMENT_URL = 'https://marrow-example-web.com/pricing';
    try {
      const supported = await Linking.canOpenURL(WEB_PAYMENT_URL);
      if (supported) await Linking.openURL(WEB_PAYMENT_URL);
      else Alert.alert('Error', 'Cannot open payment page in the browser.');
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while opening the payment page.');
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => await logout() },
    ]);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric', month: 'long', day: 'numeric',
    });
  };

  const earnedBadges = ALL_BADGES.filter(b => b.earned);
  const lockedBadges  = ALL_BADGES.filter(b => !b.earned);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 10 }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <Text style={[styles.headerTitle, { color: colors.text }]}>Profile</Text>

      {/* ── Profile Card ── */}
      <View style={[styles.profileCard, { backgroundColor: colors.backgroundElement }]}>
        <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Student'}</Text>
          <Text style={[styles.userEmail, { color: colors.text }]}>{user?.email}</Text>
        </View>
        <TouchableOpacity
          style={[styles.editButton, { backgroundColor: colors.tint + '20' }]}
          onPress={() => router.push('/edit-profile')}
        >
          <Text style={{ color: colors.tint, fontWeight: 'bold' }}>Edit</Text>
        </TouchableOpacity>
      </View>

      {/* ── Streak Banner ── */}
      {stats && (
        <View style={[styles.streakBanner, { backgroundColor: '#ff9500' + '20', borderColor: '#ff9500', borderWidth: 1 }]}>
          <Text style={styles.streakFire}>🔥</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.streakValue, { color: colors.text }]}>
              {stats.streak}-Day Streak
            </Text>
            <Text style={{ color: colors.text, opacity: 0.6, fontSize: 12 }}>
              Personal best: {stats.longestStreak} days
            </Text>
          </View>
          <View style={[styles.streakRing, { borderColor: '#ff9500' }]}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#ff9500' }}>{stats.streak}</Text>
          </View>
        </View>
      )}

      {/* ── Quick Stats ── */}
      {stats && (
        <>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Stats</Text>
          <View style={styles.statsGrid}>
            {[
              { label: "Questions", value: stats.questionsSolved.toLocaleString(), color: colors.tint },
              { label: "Hours",     value: `${stats.hoursWatched}h`,              color: '#34c759' },
              { label: "Mocks",     value: stats.mocksTaken.toString(),            color: '#af52de' },
              { label: "Rank",      value: `#${stats.rank.toLocaleString()}`,      color: '#ff9500' },
            ].map(s => (
              <View key={s.label} style={[styles.statBox, { backgroundColor: colors.backgroundElement }]}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: colors.text }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── Earned Badges ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Badges Earned</Text>
      <View style={styles.badgesGrid}>
        {earnedBadges.map(badge => (
          <TouchableOpacity
            key={badge.id}
            style={[styles.badgeCard, { backgroundColor: colors.backgroundElement }]}
            onPress={() => Alert.alert(badge.icon + ' ' + badge.label, badge.description)}
            activeOpacity={0.7}
          >
            <Text style={styles.badgeIcon}>{badge.icon}</Text>
            <Text style={[styles.badgeLabel, { color: colors.text }]} numberOfLines={1}>{badge.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Locked Badges ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Locked Badges</Text>
      <View style={styles.badgesGrid}>
        {lockedBadges.map(badge => (
          <TouchableOpacity
            key={badge.id}
            style={[styles.badgeCard, styles.badgeLocked, { backgroundColor: colors.backgroundElement }]}
            onPress={() => Alert.alert('🔒 Locked', badge.description)}
            activeOpacity={0.7}
          >
            <Text style={[styles.badgeIcon, { opacity: 0.25 }]}>{badge.icon}</Text>
            <Text style={[styles.badgeLabel, { color: colors.text, opacity: 0.35 }]} numberOfLines={1}>{badge.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Subscription ── */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Subscription</Text>

      {loading ? (
        <View style={[styles.subscriptionCard, { backgroundColor: colors.backgroundElement, justifyContent: 'center', alignItems: 'center', height: 180 }]}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : (
        <View style={[
          styles.subscriptionCard,
          {
            backgroundColor: subscription?.status === 'ACTIVE' ? colors.tint + '15' : colors.backgroundElement,
            borderColor: subscription?.status === 'ACTIVE' ? colors.tint : 'transparent',
            borderWidth: 1,
          }
        ]}>
          <View style={styles.planHeader}>
            <Text style={[styles.planName, { color: colors.text }]}>{subscription?.planName}</Text>
            <View style={[styles.statusBadge, { backgroundColor: subscription?.status === 'ACTIVE' ? '#34c759' : '#8e8e93' }]}>
              <Text style={styles.statusText}>{subscription?.status}</Text>
            </View>
          </View>

          <Text style={[styles.planExpiry, { color: colors.text, opacity: 0.7 }]}>
            {subscription?.status === 'ACTIVE' && subscription.endDate
              ? `Renews on ${formatDate(subscription.endDate)}`
              : 'Unlock QBank, Mock Exams, and HD Live Classes.'}
          </Text>

          <TouchableOpacity style={[styles.upgradeButton, { backgroundColor: colors.tint }]} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>
              {subscription?.status === 'ACTIVE' ? 'Manage Plan on Web' : 'Upgrade to Pro'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Log Out ── */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, },
  scrollContent:   { paddingHorizontal: 20, paddingBottom: 50 },
  headerTitle:     { fontSize: 28, fontWeight: 'bold', marginBottom: 24 },

  // Profile Card
  profileCard: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    borderRadius: 16, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  avatar:     { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  avatarText: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  userInfo:   { flex: 1 },
  userName:   { fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  userEmail:  { fontSize: 14, opacity: 0.7 },
  editButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginLeft: 10 },

  // Streak
  streakBanner: {
    flexDirection: 'row', alignItems: 'center', padding: 16,
    borderRadius: 16, marginBottom: 28, gap: 12,
  },
  streakFire:  { fontSize: 30 },
  streakValue: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  streakRing: {
    width: 56, height: 56, borderRadius: 28, borderWidth: 3,
    justifyContent: 'center', alignItems: 'center',
  },

  // Stats
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28,
  },
  statBox: {
    flex: 1, minWidth: '40%', padding: 16, borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  statLabel: { fontSize: 12, opacity: 0.7, fontWeight: '600' },

  // Badges
  badgesGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28,
  },
  badgeCard: {
    width: '21%', paddingVertical: 14, borderRadius: 14,
    alignItems: 'center', gap: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  badgeLocked: { opacity: 0.8 },
  badgeIcon:   { fontSize: 28 },
  badgeLabel:  { fontSize: 11, fontWeight: '600', textAlign: 'center', paddingHorizontal: 4 },

  // Subscription
  subscriptionCard: {
    padding: 24, borderRadius: 16, marginBottom: 28,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
  },
  planHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  planName:     { fontSize: 20, fontWeight: 'bold' },
  statusBadge:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText:   { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  planExpiry:   { fontSize: 14, marginBottom: 20 },
  upgradeButton:{ paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  upgradeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Logout
  logoutButton: {
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: '#ff3b30', borderRadius: 12,
  },
  logoutText: { color: '#ff3b30', fontSize: 16, fontWeight: 'bold' },
});
