import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
 
export default function PlaceholderScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.title}>My Profile</Text>
 
        <Text style={styles.description}>
          This section is connected and ready for development.
        </Text>
 
        <Pressable
          onPress={() => router.back()}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Back to Dashboard</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
 
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4ECDD',
  },
 
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
 
  title: {
    color: '#263A24',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
 
  description: {
    color: '#6D6A60',
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
 
  button: {
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#8A4F17',
    paddingHorizontal: 24,
  },
 
  buttonText: {
    color: '#FFFDF8',
    fontSize: 16,
    fontWeight: '800',
  },
});