import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import BrandLogo from '@/components/BrandLogo';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    id: '1',
    question: 'What is the NTT INDYCAR SERIES?',
    answer: 'The NTT INDYCAR SERIES is the premier level of open-wheel racing in North America, featuring world-class drivers, cutting-edge engineering, and high-speed competition on a mix of road, street, and oval tracks.',
  },
  {
    id: '2',
    question: 'Where is WeatherTech Raceway Laguna Seca located?',
answer: 'The track is located in Monterey County, California, near Salinas and Monterey. The exact address is:\n1021 Monterey-Salinas Hwy, Salinas, CA 93908',
  },
  {
    id: '3',
    question: 'What is an invitation code and where do I find it?',
    answer: 'Your invitation code is provided with your VIP ticket purchase or event invitation. Check your email confirmation, ticket, or contact the event organizer if you can\'t locate it.',
  },
  {
    id: '4',
    question: 'How do I upload my signed waiver?',
    answer: 'During registration, you\'ll be prompted to upload your signed waiver. You can take a photo of the document or upload a PDF file. Make sure the document is clearly visible and all signatures are legible.',
  },
  {
    id: '5',
    question: 'Can I bring guests to the event?',
    answer: 'Yes, if your ticket allows guests, you can register them during the sign-up process. You\'ll need to provide their full name, date of birth, and phone number. Each guest must also have a signed waiver.',
  },
  {
    id: '6',
    question: 'How do I access my QR code?',
    answer: 'Once registered, your QR code will be generated automatically. You can view it on your Account page or tap "View Full QR Code" for a larger version. This code is required for event entry.',
  },
  {
    id: '7',
    question: 'What if I lose my QR code or my phone dies?',
    answer: 'Your QR code is stored in the app and linked to your account. If your phone dies, you can use any device to log into the app and access your code. For backup, you can also screenshot your QR code.',
  },
  {
    id: '8',
    question: 'How do I enable notifications?',
    answer: 'The app will ask for notification permissions when you first open it. You can also enable them in your device settings. Notifications keep you updated on schedule changes and important event information.',
  },
  {
    id: '9',
    question: 'What kind of notifications will I receive?',
    answer: 'You\'ll receive notifications about schedule changes, event reminders, exclusive content updates, and important announcements. You can customize which notifications you want to receive in the app settings.',
  },
  {
    id: '10',
    question: 'How do I view the event schedule?',
    answer: 'Tap the "Schedule" tab at the bottom of the app to view the full event schedule. You can see race times, practice sessions, and special events. The schedule is personalized based on your ticket type.',
  },
  {
    id: '11',
    question: 'Can I view directions to the venue?',
    answer: 'Yes, the app includes venue information and directions. You can find this in the "Getting to the Circuit" section on the home page or by tapping the directions button on specific event details.',
  },
  {
    id: '12',
    question: 'What if I have technical issues with the app?',
    answer: 'If you experience technical issues, try restarting the app first. If problems persist, contact support through the app or reach out to the event organizer. Make sure you have the latest version installed.',
  },
  {
    id: '13',
    question: 'Is my personal information secure?',
    answer: 'Yes, we take privacy seriously. Your personal information is encrypted and stored securely. We only collect necessary information for event access and communication. Review our privacy policy for complete details.',
  },
  {
    id: '14',
    question: 'Can I modify my registration information?',
    answer: 'Currently, you can view your registration information in the Account section. To make changes, please contact the event organizer or support team with your updated information.',
  },
  {
    id: '15',
    question: 'What happens if I miss my scheduled experience?',
    answer: 'Experiences are typically scheduled for specific times. If you miss your scheduled time, contact event staff on-site to see if alternative arrangements can be made, though this isn\'t guaranteed.',
  },
  {
    id: '16',
    question: 'How do I know what experiences are included with my ticket?',
    answer: 'Your personalized schedule shows only the experiences you\'re invited to based on your ticket type. The app automatically filters content to show what\'s relevant to you.',
  },
  {
    id: '17',
    question: 'Can I share my QR code with others?',
    answer: 'No, your QR code is unique to you and should not be shared. Each person needs their own registration and QR code for event access. Sharing codes may result in access being denied.',
  },
  {
    id: '18',
    question: 'What should I do if my QR code won\'t scan?',
    answer: 'Ensure your screen brightness is turned up and the QR code is clearly visible. Clean your screen and try again. If it still doesn\'t work, show your registration information to event staff who can assist you.',
  },
  {
    id: '19',
    question: 'How early should I arrive at the venue?',
    answer: 'Arrive at least 30-60 minutes before your first scheduled experience to allow time for parking, security checks, and finding your way around the venue. Check your schedule for specific timing recommendations.',
  },
  {
    id: '20',
    question: 'Who do I contact for support during the event?',
    answer: 'For immediate assistance during the event, look for event staff wearing official credentials. You can also contact support through the app or use the emergency contact information provided in your registration confirmation.',
  },
];

export default function FAQScreen() {
  const colorScheme = useColorScheme() || 'light';
  const colors = Colors[colorScheme];
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const FAQItem = ({ item }: { item: FAQItem }) => {
    const isExpanded = expandedItems.has(item.id);
    
    return (
      <View style={[styles.faqItem, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={styles.questionContainer}
          onPress={() => toggleExpanded(item.id)}
          activeOpacity={0.7}
        >
          <Text style={[styles.questionText, { color: colors.text }]}>
            {item.question}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.tint}
          />
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={[styles.answerText, { color: colors.secondaryText }]}>
              {item.answer}
            </Text>
          </View>
        )}
      </View>
    );
  };

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
              Find answers to common questions about the IndyCar Experience App
            </Text>
          </View>

          {/* FAQ Items */}
          <View style={styles.faqContainer}>
            {faqData.map((item) => (
              <FAQItem key={item.id} item={item} />
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
    fontFamily: 'Roobert',
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
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    fontFamily: 'Roobert',
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
    fontFamily: 'Roobert',
  },
});
