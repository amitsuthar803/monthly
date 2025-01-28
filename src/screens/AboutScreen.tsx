import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const AboutScreen = () => {
  const [imageError, setImageError] = React.useState(false);

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening URL:', error);
    }
  };

  const renderProfileImage = () => {
    if (imageError) {
      return (
        <View style={[styles.profileImage, styles.fallbackContainer]}>
          <Icon name="account" size={80} color="#fff" />
        </View>
      );
    }

    return (
      <Image
        source={{
          uri: 'https://media.licdn.com/dms/image/v2/D5603AQEITu0FkD9jWg/profile-displayphoto-shrink_800_800/profile-displayphoto-shrink_800_800/0/1728227473765?e=1743638400&v=beta&t=9756xVKZYwbHP1xtfli0BhfNWEuHoEQCIJWpLQpCojs',
          cache: 'force-cache',
        }}
        style={styles.profileImage}
        onError={() => setImageError(true)}
      />
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Image */}
        {renderProfileImage()}

        {/* Developer Name */}
        <Text style={styles.name}>Amit Suthar</Text>
        <Text style={styles.title}>Mobile App Developer</Text>

        {/* Social Links */}
        <View style={styles.socialLinks}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={() => openLink('https://github.com/amitsuthar803')}>
            <Icon name="github" size={24} color="#fff" />
            <Text style={styles.socialText}>GitHub</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={() =>
              openLink('https://www.linkedin.com/in/amit-suthar-803/')
            }>
            <Icon name="linkedin" size={24} color="#fff" />
            <Text style={styles.socialText}>LinkedIn</Text>
          </TouchableOpacity>
        </View>

        {/* Credits */}
        <View style={styles.creditsContainer}>
          <Text style={styles.creditsTitle}>Monthly</Text>
          <Text style={styles.creditsText}>
            A simple and elegant EMI tracking app
          </Text>
          <Text style={styles.designedBy}>
            Designed & Developed by Amit Suthar
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E1F28',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  profileImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginVertical: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 24,
  },
  socialLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginHorizontal: 8,
  },
  socialText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  creditsContainer: {
    alignItems: 'center',
    marginTop: 32,
    paddingTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#2A2C36',
    width: '100%',
  },
  creditsTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  creditsText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginBottom: 16,
  },
  designedBy: {
    fontSize: 14,
    color: '#fff',
    fontStyle: 'italic',
  },
  fallbackContainer: {
    backgroundColor: '#2A2C36',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AboutScreen;
