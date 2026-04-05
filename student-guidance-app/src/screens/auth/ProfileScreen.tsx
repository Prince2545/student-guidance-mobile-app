import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '../../components/ScreenContainer';
import { Card } from '../../components/Card';
import { colors, spacing, typography, radii } from '../../theme';
import { getCurrentUser, logOut, updateUserProfile } from '../../storage/auth';
import { clearCareerDiscoveryState } from '../../storage/careerDiscovery';
import { clearAllTaskDataForUser } from '../../storage/tasks';
import { useAppState } from '../../state/appState';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { refresh } = useAppState();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [avatarHue, setAvatarHue] = useState(220);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setUserId(user.id);
      setName(user.name);
      setEmail(user.email);
      setSecurityQuestion(user.securityQuestion);
      setAvatarHue(user.avatarHue);
    })();
  }, []);

  const handleSave = async () => {
    if (!userId) return;
    try {
      await updateUserProfile(userId, {
        name: name.trim(),
        avatarHue,
        securityQuestion: securityQuestion.trim(),
        securityAnswerHash: securityAnswer
          ? securityAnswer
          : undefined,
      });
      Alert.alert('Profile updated', 'Your profile changes are saved.');
    } catch (e: any) {
      Alert.alert('Update failed', e.message ?? 'Something went wrong.');
    }
  };

  const handleLogout = async () => {
    try {
      await logOut();
      await refresh();
      if (navigation.canGoBack()) {
        navigation.goBack();
      }
    } catch (e: any) {
      Alert.alert('Logout failed', e?.message ?? 'Something went wrong.');
    }
  };

  const performResetAccount = async () => {
    if (!userId) return;
    try {
      await Promise.all([
        clearCareerDiscoveryState(userId),
        clearAllTaskDataForUser(userId),
      ]);
      await logOut();
      await refresh();
    } catch (e: any) {
      Alert.alert('Reset failed', e?.message ?? 'Something went wrong.');
    }
  };

  const handleResetAccount = () => {
    Alert.alert(
      'Reset account',
      'This will reset all your progress. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => void performResetAccount() },
      ],
    );
  };

  return (
    <ScreenContainer>
      <Card style={styles.card}>
        <Text style={styles.title}>Profile</Text>

        <View style={styles.avatarPreview}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: `hsl(${avatarHue}, 80%, 55%)` },
            ]}
          >
            <Text style={styles.avatarInitial}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.valueText}>{email || '—'}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Avatar Color (Hue 0–360)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={String(avatarHue)}
            onChangeText={(text) => {
              const value = Number(text);
              if (!Number.isNaN(value)) {
                setAvatarHue(Math.min(360, Math.max(0, value)));
              }
            }}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Security Question</Text>
          <TextInput
            style={styles.input}
            value={securityQuestion}
            onChangeText={setSecurityQuestion}
            placeholder="A question only you know"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>New Security Answer (optional)</Text>
          <TextInput
            style={styles.input}
            value={securityAnswer}
            onChangeText={setSecurityAnswer}
            placeholder="Update your answer"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <Pressable style={styles.primaryButton} onPress={handleSave}>
          <Text style={styles.primaryLabel}>Save changes</Text>
        </Pressable>

        <Pressable style={styles.secondaryButton} onPress={handleLogout}>
          <Text style={styles.secondaryLabel}>Logout</Text>
        </Pressable>

        <Pressable style={styles.dangerButton} onPress={handleResetAccount}>
          <Text style={styles.dangerLabel}>Reset Account</Text>
        </Pressable>
      </Card>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.lg,
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  avatarPreview: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.meta,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    borderRadius: radii.md,
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
  },
  valueText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  primaryButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.primaryGradientStart,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  primaryLabel: {
    ...typography.subtitle,
    color: colors.textPrimary,
  },
  secondaryButton: {
    marginTop: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  secondaryLabel: {
    ...typography.subtitle,
    color: colors.textSecondary,
  },
  dangerButton: {
    marginTop: spacing.sm,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  dangerLabel: {
    ...typography.subtitle,
    color: colors.danger,
  },
});

