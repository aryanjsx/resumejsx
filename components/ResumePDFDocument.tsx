import React from 'react';
import { Document, Page, Text, View, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData, ResumeTemplateStyle } from '../types';
import type { SectionKey } from '../services/resumeStorage';

type Props = {
  resumeData: ResumeData;
  templateStyle: ResumeTemplateStyle;
  sectionOrder: SectionKey[];
};

const ResumePDFDocument: React.FC<Props> = ({ resumeData, templateStyle, sectionOrder }) => {
  const { personalInfo, summary, experience, education, projects, certifications, skills } = resumeData;
  const colors = templateStyle.colorScheme;
  const headingSize = templateStyle.fontStyle.headingSize === 'large' ? 16 : templateStyle.fontStyle.headingSize === 'small' ? 12 : 14;
  const sectionSpacing = templateStyle.sectionStyle.sectionSpacing === 'compact' ? 8 : templateStyle.sectionStyle.sectionSpacing === 'spacious' ? 16 : 12;

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: 'Helvetica',
      fontSize: 10,
    },
    header: {
      marginBottom: 16,
      textAlign: templateStyle.headerStyle === 'centered' || templateStyle.headerStyle === 'banner' ? 'center' : 'left',
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 4,
    },
    contact: {
      fontSize: 9,
      color: colors.secondary,
    },
    sectionTitle: {
      fontSize: headingSize,
      fontWeight: 'bold',
      color: colors.primary,
      marginBottom: 6,
      marginTop: sectionSpacing,
      borderBottomWidth: templateStyle.sectionStyle.dividerType === 'none' ? 0 : 1,
      borderBottomColor: colors.primary,
      paddingBottom: 2,
    },
    sectionContent: {
      marginBottom: 4,
      color: colors.text,
    },
    bulletItem: {
      flexDirection: 'row',
      marginBottom: 2,
      paddingLeft: 8,
    },
    bullet: {
      width: 4,
      marginRight: 6,
      marginTop: 4,
    },
    bulletText: {
      flex: 1,
    },
    roleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    roleTitle: {
      fontWeight: 'bold',
      color: colors.text,
    },
    roleMeta: {
      fontSize: 9,
      color: colors.secondary,
    },
    link: {
      color: '#2563eb',
      textDecoration: 'none',
      fontSize: 9,
      marginTop: 2,
    },
    linkRow: {
      marginTop: 2,
    },
  });

  const renderBullets = (text: string) =>
    text
      .split('\n')
      .filter((line) => line.trim())
      .map((line, i) => (
        <View key={i} style={styles.bulletItem}>
          <View style={[styles.bullet, { backgroundColor: colors.primary }]} />
          <Text style={styles.bulletText}>{line.replace(/^- /, '').trim()}</Text>
        </View>
      ));

  const renderSection = (title: string, children: React.ReactNode) => (
    <View wrap={false}>
      <Text style={styles.sectionTitle}>{title.toUpperCase()}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.name}>{personalInfo.name}</Text>
          <Text style={styles.contact}>
            {[personalInfo.location, personalInfo.phone, personalInfo.email]
              .filter(Boolean)
              .join(' | ')}
          </Text>
          {(personalInfo.linkedin || personalInfo.portfolio) && (
            <Text style={[styles.contact, styles.linkRow]}>
              {personalInfo.linkedin && <Link src={personalInfo.linkedin}>LinkedIn</Link>}
              {personalInfo.linkedin && personalInfo.portfolio && ' | '}
              {personalInfo.portfolio && <Link src={personalInfo.portfolio}>Portfolio</Link>}
            </Text>
          )}
        </View>

        {sectionOrder.map((section) => {
          switch (section) {
            case 'summary':
              return summary ? renderSection('Summary', <Text>{summary}</Text>) : null;
            case 'experience':
              return experience.length > 0
                ? renderSection(
                    'Experience',
                    experience.map((exp) => (
                      <View key={exp.id} style={{ marginBottom: 10 }}>
                        <View style={styles.roleRow}>
                          <Text style={styles.roleTitle}>
                            {exp.role} | {exp.company}, {exp.location}
                          </Text>
                          <Text style={styles.roleMeta}>
                            {exp.startDate} – {exp.endDate}
                          </Text>
                        </View>
                        {renderBullets(exp.description)}
                      </View>
                    ))
                  )
                : null;
            case 'education':
              return education.length > 0
                ? renderSection(
                    'Education',
                    education.map((edu) => (
                      <View key={edu.id} style={{ marginBottom: 6 }}>
                        <View style={styles.roleRow}>
                          <Text style={styles.roleTitle}>
                            {edu.institution}, {edu.location}
                          </Text>
                          <Text style={styles.roleMeta}>
                            {edu.startDate} – {edu.endDate}
                          </Text>
                        </View>
                        <Text>
                          {edu.degree}
                          {edu.gpa ? ` | CGPA: ${edu.gpa}` : ''}
                        </Text>
                      </View>
                    ))
                  )
                : null;
            case 'projects':
              return projects.length > 0
                ? renderSection(
                    'Projects',
                    projects.map((proj) => (
                      <View key={proj.id} style={{ marginBottom: 10 }}>
                        <View style={styles.roleRow}>
                          <Text style={styles.roleTitle}>
                            {proj.title} | {proj.technologies}
                          </Text>
                          <Text style={styles.roleMeta}>
                            {proj.startDate} – {proj.endDate}
                          </Text>
                        </View>
                        {renderBullets(proj.description)}
                        {(proj.liveLink || proj.githubLink) && (
                          <Text style={[styles.link, { marginTop: 4 }]}>
                            {proj.liveLink && <Link src={proj.liveLink}>Live</Link>}
                            {proj.liveLink && proj.githubLink && ' | '}
                            {proj.githubLink && <Link src={proj.githubLink}>GitHub</Link>}
                          </Text>
                        )}
                      </View>
                    ))
                  )
                : null;
            case 'certifications':
              return certifications.length > 0
                ? renderSection(
                    'Certifications',
                    certifications.map((cert) => (
                      <View key={cert.id} style={{ marginBottom: 4 }}>
                        <View style={styles.roleRow}>
                          <Text style={styles.roleTitle}>
                            {cert.name} - {cert.issuer}
                          </Text>
                          <Text style={styles.roleMeta}>{cert.date}</Text>
                        </View>
                      </View>
                    ))
                  )
                : null;
            case 'skills':
              return skills.length > 0
                ? renderSection(
                    'Skills',
                    skills.map((skill) => (
                      <View key={skill.id} style={{ marginBottom: 2 }}>
                        <Text style={{ fontWeight: 'bold', color: colors.secondary }}>
                          {skill.category}:{' '}
                        </Text>
                        <Text>{skill.skills}</Text>
                      </View>
                    ))
                  )
                : null;
            default:
              return null;
          }
        })}
      </Page>
    </Document>
  );
};

export default ResumePDFDocument;
