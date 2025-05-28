import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/useColorScheme'; // assuming this returns 'light' | 'dark'
import RenderHTML from 'react-native-render-html';

const VenueDirectionsScreen = () => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();

  const isDarkMode = colorScheme === 'dark';
  const textColor = isDarkMode ? 'white' : 'black';
  const bgColor = isDarkMode ? '#111' : '#fff';

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
          style={{
            fontSize: level === 3 ? 18 : 22,
            fontWeight: 'bold',
            marginTop: 20,
            marginBottom: 10,
            color: textColor,
          }}>
          {block.children[0].text}
        </Text>
      );
    }

    if (type === 'paragraph') {
      return (
        <Text key={index} style={{ color: textColor, fontSize: 16, marginBottom: 10 }}>
          {block.children[0].text}
        </Text>
      );
    }

    if (type === 'list') {
      return (
        <View key={index} style={{ marginBottom: 10 }}>
          {block.children.map((item: any, idx: number) => (
            <Text key={idx} style={{ color: textColor, fontSize: 16, marginLeft: 10, marginBottom: 5 }}>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: bgColor, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={isDarkMode ? 'white' : 'black'} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bgColor }}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 20,
        }}
      >
        <Text style={{ fontSize: 26, fontWeight: 'bold', color: textColor, marginBottom: 20 }}>
          Venue Directions
        </Text>
        {content.map((block, index) => renderBlock(block, index))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default VenueDirectionsScreen;
