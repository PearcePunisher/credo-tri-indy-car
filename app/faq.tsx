import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import BrandLogo from '@/components/BrandLogo';
import * as FileSystem from 'expo-file-system';


interface RichTextChild {
  text?: string;
  type: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  url?: string;
  children?: RichTextChild[]; // Add this to handle nested structure
}

interface RichTextBlock {
  type: string;
  children: RichTextChild[];
}

interface FAQItem {
  id: number;
  Question: string;
  Answer: RichTextBlock[];
}

interface FAQResponse {
  data: Array<{
    id: number;
    documentId: string;
    FAQs: FAQItem[];
  }>;
}

// Component to render rich text with formatting and links
const RichTextRenderer = ({ 
  richText, 
  colors 
}: { 
  richText: RichTextBlock[], 
  colors: any 
}) => {
  const renderTextWithFormatting = (child: RichTextChild, index: number) => {
    let textStyle: any = { 
      color: colors.secondaryText,
      fontSize: 15,
      lineHeight: 22,
      
    };
    
    // Apply formatting
    if (child.bold) {
      textStyle.fontWeight = 'bold';
      textStyle.fontFamily = 'RoobertSemi';
    }
    if (child.italic) {
      textStyle.fontStyle = 'italic';
    }
    if (child.underline) {
      textStyle.textDecorationLine = 'underline';
    }
    
    // Handle links - check for type "link" and url property
    if (child.type === 'link' && child.url) {
      // Extract text from nested children structure
      let linkText = child.text;
      if (!linkText && child.children && child.children.length > 0) {
        linkText = child.children.map(c => c.text || '').join('');
      }
      
      console.log('Link found:', { text: linkText, url: child.url, textLength: linkText?.length, type: child.type });
      
      return (
        <TouchableOpacity
          key={index}
          onPress={() => {
            console.log('Opening URL:', child.url);
            Linking.openURL(child.url!).catch(err => {
              console.error('Error opening URL:', err);
            });
          }}
          style={[styles.linkContainer, { backgroundColor: 'rgba(0,0,255,0.1)', minHeight: 20, paddingVertical: 2 }]} // Debug: add background and min height
        >
          <Text
            style={{
              color: '#0066FF', // Force blue color for debugging
              textDecorationLine: 'underline',
              fontWeight: 'bold',
              fontSize: 15,
              lineHeight: 22,
              fontFamily: 'RoobertSemi',
            }}
          >
            {linkText || '1021 Monterey-Salinas Hwy, Salinas, CA 93908'}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <Text key={index} style={textStyle}>
        {child.text}
      </Text>
    );
  };

  return (
    <View>
      {richText.map((block, blockIndex) => (
        <View key={blockIndex} style={styles.richTextBlock}>
          <View style={styles.richTextContent}>
            {block.children.map((child, childIndex) => 
              renderTextWithFormatting(child, childIndex)
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

// Helper function to convert rich text to plain text (fallback)
const convertRichTextToPlainText = (richText: FAQItem['Answer']): string => {
  if (!richText || !Array.isArray(richText)) return '';
  
  return richText
    .map(block => {
      if (block.children) {
        return block.children
          .map(child => {
            if (child.url) {
              // For links, use the text content
              return child.text || child.url;
            }
            return child.text || '';
          })
          .join('');
      }
      return '';
    })
    .join('\n')
    .trim();
};

export default function FAQScreen() {
  const { colorScheme } = useColorScheme();
  const colors = Colors[colorScheme];
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [faqData, setFaqData] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFAQs();
  }, []);

    const getFAQsFile = async () => {
  //const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://strapi.wickedthink.com/api/faqs?populate=*');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data: FAQResponse = await response.json();
      
      // Extract FAQs from the response
      if (data.data && data.data.length > 0 && data.data[0].FAQs) {
        setFaqData(data.data[0].FAQs);
      } else {
        setError('No FAQ data found');
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

const fetchFAQs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('https://strapi.wickedthink.com/api/faqs?populate=*');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const FAQS_FILE = FileSystem.documentDirectory + "faq_resp.json";
      const data: FAQResponse = await response.json();
      
      // Extract FAQs from the response
      if (data.data && data.data.length > 0 && data.data[0].FAQs) {
        //setFaqData(data.data[0].FAQs);//this is our data. 
       if( await FileSystem.writeAsStringAsync(FAQS_FILE, JSON.stringify(data.data[0].FAQs))){
        console.log("Success!");
       }

       setFaqData(JSON.parse(await FileSystem.readAsStringAsync(FAQS_FILE)));

      } else {
        setError('No FAQ data found');
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to load FAQs. Please try again later.');
    } finally {
      setLoading(false);
    }
  };


  const toggleExpanded = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const FAQItemComponent = ({ item }: { item: FAQItem }) => {
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <View style={[styles.faqItem, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleExpanded(item.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.questionText, { color: colors.text }]}>
            {item.Question}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.tint}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <RichTextRenderer richText={item.Answer} colors={colors} />
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
          <Text style={[styles.loadingText, { color: colors.text }]}>
            Loading FAQs...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="warning-outline" size={48} color={colors.tint} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.tint }]}
            onPress={fetchFAQs}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <BrandLogo style={styles.logo} />
            <Text style={[styles.title, { color: colors.text }]}>
              Frequently Asked Questions
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Find answers to common questions about the IndyCar Experience
            </Text>
          </View>

          {/* FAQ Items */}
          <View style={styles.faqContainer}>
            {faqData.map((item) => (
              <FAQItemComponent key={item.id} item={item} />
            ))}
          </View>

          {/* Contact Support */}
          <View style={[styles.supportCard, { backgroundColor: colors.card }]}>
            <Ionicons name="help-circle-outline" size={32} color={colors.tint} />
            <Text style={[styles.supportTitle, { color: colors.text }]}>
              Still need help?
            </Text>
            <Text style={[styles.supportText, { color: colors.secondaryText }]}>
              If you can't find what you're looking for, contact our support team or look for event staff at the venue.
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
    
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'RoobertMedium',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  logo: {
    width: 200,
    height: 100,
    marginBottom: 16,
    objectFit: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'RoobertSemi',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    paddingHorizontal: 20,
    
  },
  faqContainer: {
    marginTop: 20,
  },
  faqItem: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
    fontFamily: 'RoobertMedium',
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  richTextBlock: {
    marginBottom: 8,
  },
  richTextContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
  },
  linkContainer: {
    marginHorizontal: 2,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    
  },
  supportCard: {
    marginTop: 30,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
    fontFamily: 'RoobertSemi',
  },
  supportText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    
  },
});
