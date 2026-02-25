import React from 'react';
import { Document, Page, Text, View, Link, StyleSheet } from '@react-pdf/renderer';
import type { ResumeData, ResumeTemplateStyle } from '../types';
import type { SectionKey } from '../services/resumeStorage';

type Props = {
  resumeData: ResumeData;
  templateStyle: ResumeTemplateStyle;
  sectionOrder: SectionKey[];
};

const mapFont = (font: string): string => {
  const f = (font || '').toLowerCase();
  if (f.includes('georgia') || f.includes('times') || f.includes('serif')) return 'Times-Roman';
  if (f.includes('courier') || f.includes('mono')) return 'Courier';
  return 'Helvetica';
};

const ResumePDFDocument: React.FC<Props> = ({ resumeData, templateStyle, sectionOrder }) => {
  const { personalInfo, summary, experience, education, projects, certifications, skills } = resumeData;
  const colors = templateStyle.colorScheme;
  const headingFont = mapFont(templateStyle.fontStyle.headingFont);
  const bodyFont = mapFont(templateStyle.fontStyle.bodyFont);
  const headingSize = templateStyle.fontStyle.headingSize === 'large' ? 16 : templateStyle.fontStyle.headingSize === 'small' ? 12 : 14;
  const sectionSpacing = templateStyle.sectionStyle.sectionSpacing === 'compact' ? 8 : templateStyle.sectionStyle.sectionSpacing === 'spacious' ? 16 : 12;
  const isBanner = templateStyle.headerStyle === 'banner';
  const isCentered = templateStyle.headerStyle === 'centered' || templateStyle.headerStyle === 'banner';
  const dividerWidth = templateStyle.sectionStyle.dividerType === 'thick-line' ? 2 : templateStyle.sectionStyle.dividerType === 'none' ? 0 : 1;
  const dividerStyle = templateStyle.sectionStyle.dividerType === 'dots' ? 'dashed' : 'solid';
  const isTwoColumn = templateStyle.layout === 'two-column' || templateStyle.layout === 'sidebar-left' || templateStyle.layout === 'sidebar-right';
  const isLeftSidebar = templateStyle.layout === 'sidebar-left';

  const sidebarSections: SectionKey[] = ['skills', 'certifications', 'education'];
  const mainSections: SectionKey[] = ['summary', 'experience', 'projects'];
  const orderedSidebar = sectionOrder.filter((s) => sidebarSections.includes(s));
  const orderedMain = sectionOrder.filter((s) => mainSections.includes(s));

  const styles = StyleSheet.create({
    page: {
      padding: 40,
      fontFamily: bodyFont,
      fontSize: 10,
      backgroundColor: colors.background,
    },
    header: {
      marginBottom: 16,
      textAlign: isCentered ? 'center' : 'left',
      padding: isBanner ? 12 : 0,
      backgroundColor: isBanner ? colors.primary : 'transparent',
    },
    name: {
      fontSize: 24,
      fontWeight: 'bold',
      fontFamily: headingFont,
      color: isBanner ? '#ffffff' : colors.primary,
      marginBottom: 4,
    },
    contact: {
      fontSize: 9,
      color: isBanner ? 'rgba(255,255,255,0.9)' : colors.secondary,
    },
    sectionTitle: {
      fontSize: headingSize,
      fontWeight: 'bold',
      fontFamily: headingFont,
      color: colors.primary,
      marginBottom: 6,
      marginTop: sectionSpacing,
      borderBottomWidth: dividerWidth,
      borderBottomStyle: dividerStyle,
      borderBottomColor: colors.primary,
      paddingBottom: 2,
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
      color: colors.text,
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
    linkRow: { marginTop: 2 },
    sidebar: {
      width: '35%',
      paddingRight: 16,
      borderRightWidth: isLeftSidebar ? 1 : 0,
      borderLeftWidth: isLeftSidebar ? 0 : 1,
      borderColor: colors.accent,
    },
    main: {
      width: '65%',
      paddingLeft: isLeftSidebar ? 16 : 0,
      paddingRight: isLeftSidebar ? 0 : 16,
    },
    twoCol: {
      flexDirection: 'row',
      marginTop: 8,
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
      <View style={{ marginBottom: 4 }}>{children}</View>
    </View>
  );

  const renderSectionContent = (section: SectionKey) => {
    switch (section) {
      case 'summary':
        return summary ? renderSection('Summary', <Text style={{ color: colors.text }}>{summary}</Text>) : null;
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
                  <Text style={{ color: colors.text }}>
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
                <View key={skill.id} style={{ marginBottom: 4, flexDirection: 'row' }}>
                  <Text style={{ fontWeight: 'bold', color: colors.secondary, marginRight: 4 }}>{skill.category}: </Text>
                  <Text style={{ color: colors.text, flex: 1 }}>{skill.skills}</Text>
                </View>
              ))
            )
          : null;
      default:
        return null;
    }
  };

  const headerBlock = (
    <View style={styles.header}>
      <Text style={styles.name}>{personalInfo.name}</Text>
      <Text style={styles.contact}>
        {[personalInfo.location, personalInfo.phone, personalInfo.email].filter(Boolean).join(' | ')}
      </Text>
      {(personalInfo.linkedin || personalInfo.portfolio) && (
        <Text style={[styles.contact, styles.linkRow]}>
          {personalInfo.linkedin && <Link src={personalInfo.linkedin} style={{ color: isBanner ? '#ffffff' : colors.accent }}>LinkedIn</Link>}
          {personalInfo.linkedin && personalInfo.portfolio && ' | '}
          {personalInfo.portfolio && <Link src={personalInfo.portfolio} style={{ color: isBanner ? '#ffffff' : colors.accent }}>Portfolio</Link>}
        </Text>
      )}
    </View>
  );

  if (isTwoColumn) {
    const sidebarContent = orderedSidebar.map((s) => renderSectionContent(s)).filter(Boolean);
    const mainContent = orderedMain.map((s) => renderSectionContent(s)).filter(Boolean);
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {headerBlock}
          <View style={styles.twoCol}>
            {isLeftSidebar ? (
              <>
                <View style={styles.sidebar}>{sidebarContent}</View>
                <View style={styles.main}>{mainContent}</View>
              </>
            ) : (
              <>
                <View style={styles.main}>{mainContent}</View>
                <View style={styles.sidebar}>{sidebarContent}</View>
              </>
            )}
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {headerBlock}
        {sectionOrder.map((s) => renderSectionContent(s))}
      </Page>
    </Document>
  );
};

export default ResumePDFDocument;
