import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import BrandLogo from '@/components/BrandLogo';

const VenueDirectionsScreen = () => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('https://timely-actor-10dfb03957.strapiapp.com/api/venue-directions');
        const json = await res.json();
        const blocks = json.data[0].venue_direction_description;
        setContent(blocks);
      } catch (error) {
        console.error('Failed to load directions', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderBlock = (block: any, index: number) => {
    const { type } = block;

    if (type === 'heading') {
      const level = block.level || 2;
      return (
        <Text
          key={index}
          style={[
            level === 3 ? styles.heading3 : styles.heading2,
            { color: colors.text }
          ]}>
          {block.children[0].text}
        </Text>
      );
    }

    if (type === 'paragraph') {
      return (
        <Text key={index} style={[styles.paragraph, { color: colors.text }]}>
          {block.children[0].text}
        </Text>
      );
    }

    if (type === 'list') {
      return (
        <View key={index} style={styles.listContainer}>
          {block.children.map((item: any, idx: number) => (
            <Text key={idx} style={[styles.listItem, { color: colors.text }]}>
              • {item.children[0].text}
            </Text>
          ))}
        </View>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Branding */}
        <BrandLogo style={styles.brand} />
        
        {/* Title */}
        <Text style={[styles.title, { color: colors.text }]}>
          Venue Directions
        </Text>
        
        {/* Content */}
        {content.map((block, index) => renderBlock(block, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: 20,
    paddingBottom: 40,
  },
  brand: {
    width: 250,
    height: 120,
    alignSelf: 'center',
    marginBottom: 10,
    objectFit: 'contain',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'RoobertSemi',
  },
  heading2: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'RoobertMedium',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'RoobertMedium',
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 24,
    
  },
  listContainer: {
    marginBottom: 10,
  },
  listItem: {
    fontSize: 16,
    marginLeft: 10,
    marginBottom: 5,
    lineHeight: 24,
    
  },
});

export default VenueDirectionsScreen;
