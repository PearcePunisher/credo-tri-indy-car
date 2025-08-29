import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView,
  Text,
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import BrandLogo from '@/components/BrandLogo';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40; // 20px margin on each side

const VenueDirectionsScreen = () => {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  // Track which URLs we've rendered to avoid duplicate buttons
  const renderedUrlsRef = useRef<Set<string>>(new Set());

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

  // Clear seen URLs whenever content changes
  useEffect(() => {
    renderedUrlsRef.current.clear();
  }, [content]);

  const extractText = (node: any): string => {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (typeof node.text === 'string') return node.text;
    if (Array.isArray(node.children)) return node.children.map(extractText).join('');
    return '';
  };

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
      // Check if this paragraph contains links
      const hasLinks = block.children.some((child: any) => child.type === 'link');
      
      if (hasLinks) {
        return (
          <View key={index} style={styles.linkContainer}>
            {block.children.map((child: any, childIndex: number) => {
              if (child.type === 'link' && child.url) {
                const linkText = extractText(child).trim();
                // Skip if no label text
                if (!linkText) return null;
                // Deduplicate by URL across the whole page
                if (renderedUrlsRef.current.has(child.url)) return null;
                renderedUrlsRef.current.add(child.url);
                // Render map button for links using their provided label
                return (
                  <TouchableOpacity
                    key={childIndex}
                    style={[styles.mapButton, { backgroundColor: colors.tint }]}
                    onPress={() => handleMapPress(child.url)}
                  >
                    <View style={styles.buttonContent}>
                      <Ionicons 
                        name="map" 
                        size={20} 
                        color={colors.textOnGreen} 
                        style={styles.buttonIcon}
                      />
                      <Text style={[styles.mapButtonText, { color: colors.textOnGreen }]}>
                        {linkText}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              }
              // Render regular text if it's not empty
              if (child.text && child.text.trim()) {
                return (
                  <Text key={childIndex} style={[styles.paragraph, { color: colors.text }]}>
                    {child.text}
                  </Text>
                );
              }
              return null;
            })}
          </View>
        );
      }
      
      // Regular paragraph without links
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

  const handleMapPress = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        console.warn(`Cannot open URL: ${url}`);
      }
    } catch (error) {
      console.error(`Error opening map URL: ${error}`);
    }
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
    width: CARD_WIDTH,
    minHeight: 40,
    alignSelf: "center",
    objectFit: "contain",
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
  linkContainer: {
    marginBottom: 15,
  },
  mapButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default VenueDirectionsScreen;
