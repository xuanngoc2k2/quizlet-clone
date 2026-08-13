import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Noto Sans KR for Korean and Vietnamese support
Font.register({
  family: 'Noto Sans KR',
  src: 'https://cdn.jsdelivr.net/npm/noto-sans-kr@0.1.1/fonts/NotoSansKR-Regular.ttf',
});

const styles = StyleSheet.create({
  page: { 
    fontFamily: 'Noto Sans KR', 
    padding: 40, 
    fontSize: 11,
    lineHeight: 1.5,
  },
  header: { 
    marginBottom: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb', 
    paddingBottom: 10 
  },
  title: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#1e3a8a',
    marginBottom: 5,
  },
  description: {
    fontSize: 12,
    color: '#4b5563',
  },
  section: { 
    marginTop: 15, 
    marginBottom: 10, 
  },
  sectionTitle: { 
    fontSize: 14,
    fontWeight: 'bold', 
    marginBottom: 10,
    backgroundColor: '#f3f4f6',
    padding: 5,
  },
  questionContainer: { 
    marginBottom: 12,
    breakInside: 'avoid',
  },
  questionText: { 
    marginBottom: 6,
    fontWeight: 'medium',
  },
  optionsContainer: { 
    marginLeft: 15, 
    marginBottom: 5 
  },
  optionText: {
    marginBottom: 3,
  },
  answerKeyHeader: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    marginBottom: 15,
    color: '#1e3a8a',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 5,
  },
  answerSection: { 
    marginBottom: 15 
  },
  answerSectionTitle: { 
    fontWeight: 'bold', 
    marginBottom: 8,
    color: '#374151',
  },
  answerItem: { 
    marginVertical: 4,
    breakInside: 'avoid',
  },
  answerCorrect: {
    fontWeight: 'bold',
    color: '#047857', // emerald-700
  },
  explanation: { 
    color: '#6b7280', 
    fontSize: 10,
    marginTop: 2,
    marginLeft: 10,
  },
});

type Question = {
  id: number;
  question: string;
  type: string;
  options?: string[];
  correctAnswer?: string;
  explanation?: string;
};

type Section = {
  name: string;
  instruction: string;
  questions: Question[];
};

export type TestData = {
  title: string;
  description: string;
  sections: Section[];
};

export const TopikPdfDocument = ({ testData }: { testData: TestData }) => (
  <Document>
    {/* Page 1+: Test Paper */}
    <Page style={styles.page} wrap>
      <View style={styles.header}>
        <Text style={styles.title}>{testData.title || "Bài Kiểm Tra"}</Text>
        {testData.description ? <Text style={styles.description}>{testData.description}</Text> : null}
      </View>
      
      {testData.sections?.map((section, idx) => (
        <View key={idx} style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>{section.name || `Phần ${idx + 1}`}</Text>
          {section.instruction ? (
            <Text style={{ marginBottom: 10, color: '#6b7280' }}>{section.instruction}</Text>
          ) : null}
          
          {section.questions?.map((q, qIdx) => (
            <View key={qIdx} style={styles.questionContainer} wrap={false}>
              <Text style={styles.questionText}>{q.id}. {q.question || ""}</Text>
              
              {q.options && q.options.length > 0 && (
                <View style={styles.optionsContainer}>
                  {q.options.map((opt, optIdx) => (
                    <Text key={optIdx} style={styles.optionText}>({optIdx + 1}) {opt || ""}</Text>
                  ))}
                </View>
              )}
              
              {/* For translation or blank questions without options */}
              {(!q.options || q.options.length === 0) && (
                <View style={{ marginTop: 10, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#d1d5db', borderBottomStyle: 'dashed', height: 20 }} />
              )}
            </View>
          ))}
        </View>
      ))}
    </Page>

    {/* Last Page(s): Answer Key & Explanations */}
    <Page style={styles.page} wrap>
      <View>
        <Text style={styles.answerKeyHeader}>ĐÁP ÁN & GIẢI THÍCH CHI TIẾT</Text>
        
        {testData.sections?.map((section, idx) => (
          <View key={idx} style={styles.answerSection} wrap={false}>
            <Text style={styles.answerSectionTitle}>{section.name || `Phần ${idx + 1}`}</Text>
            
            {section.questions?.map((q, qIdx) => (
              <View key={qIdx} style={styles.answerItem} wrap={false}>
                <Text>
                  Câu {q.id}: <Text style={styles.answerCorrect}>{q.correctAnswer || "Xem giải thích"}</Text>
                </Text>
                {q.explanation ? (
                  <Text style={styles.explanation}>Giải thích: {q.explanation}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ))}
      </View>
    </Page>
  </Document>
);
