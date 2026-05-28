/**
 * @fileoverview LessonContent — parses AI-generated lesson text into rich,
 * luxury-styled sections. Handles:
 *  - **Heading:** sections  → bold green section header + body paragraph
 *  - [IMAGE: description]   → soft image placeholder card
 *  - Lines starting with -  → bullet list items
 *  - Plain paragraphs       → body text with generous line height
 */

import { Image as ImageIcon } from 'lucide-react-native';
import { Fragment } from 'react';
import { Text, View } from 'react-native';

type Block =
  | { type: 'heading'; heading: string; body: string }
  | { type: 'image'; description: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'paragraph'; text: string };

function parseContent(raw: string): Block[] {
  const blocks: Block[] = [];
  // Split on double newline or single newline before a **Heading
  const lines = raw.split(/\n/);
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // Skip blank lines
    if (!line) { i++; continue; }

    // IMAGE placeholder [IMAGE: ...]
    const imageMatch = line.match(/^\[IMAGE:\s*(.*?)\]$/i);
    if (imageMatch) {
      blocks.push({ type: 'image', description: imageMatch[1] });
      i++;
      continue;
    }

    // Heading: **Heading text:** body text OR just **Heading:**
    const headingMatch = line.match(/^\*\*(.+?)\*\*:?\s*(.*)/);
    if (headingMatch) {
      const heading = headingMatch[1].replace(/:$/, '').trim();
      let body = headingMatch[2].trim();
      // Collect subsequent non-heading, non-blank lines as part of the body
      i++;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !lines[i].match(/^\*\*/) &&
        !lines[i].match(/^\[IMAGE:/) &&
        !lines[i].trim().startsWith('- ')
      ) {
        body += ' ' + lines[i].trim();
        i++;
      }
      blocks.push({ type: 'heading', heading, body: body.trim() });
      continue;
    }

    // Bullet list — collect consecutive bullet lines
    if (line.startsWith('- ') || line.startsWith('• ')) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('• '))
      ) {
        items.push(lines[i].trim().replace(/^[-•]\s+/, ''));
        i++;
      }
      blocks.push({ type: 'bullets', items });
      continue;
    }

    // Plain paragraph — collect consecutive non-special lines
    let text = line;
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().match(/^\*\*/) &&
      !lines[i].trim().match(/^\[IMAGE:/) &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('• ')
    ) {
      text += ' ' + lines[i].trim();
      i++;
    }
    blocks.push({ type: 'paragraph', text: text.trim() });
  }

  return blocks;
}

interface LessonContentProps {
  content: string;
}

export function LessonContent({ content }: LessonContentProps) {
  if (!content?.trim()) {
    return (
      <Text style={{ color: '#a8a29e', fontSize: 14, fontWeight: '300', fontStyle: 'italic' }}>
        No lesson content yet.
      </Text>
    );
  }

  const blocks = parseContent(content);

  return (
    <View>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <View key={index} style={{ marginBottom: 20 }}>
              {/* Section header */}
              <View style={{
                flexDirection: 'row', alignItems: 'center', marginBottom: 8,
              }}>
                <View style={{
                  width: 3, height: 16, borderRadius: 2,
                  backgroundColor: '#16a34a', marginRight: 10,
                }} />
                <Text style={{
                  color: '#166534', fontSize: 13, fontWeight: '600',
                  letterSpacing: 0.3, flex: 1,
                }}>
                  {block.heading.toUpperCase()}
                </Text>
              </View>
              {/* Body */}
              {block.body ? (
                <Text style={{
                  color: '#292524', fontSize: 15, fontWeight: '300',
                  lineHeight: 26, paddingLeft: 13,
                }}>
                  {block.body}
                </Text>
              ) : null}
            </View>
          );
        }

        if (block.type === 'image') {
          return (
            <View key={index} style={{
              backgroundColor: 'rgba(22,163,74,0.06)',
              borderWidth: 1, borderColor: 'rgba(22,163,74,0.15)',
              borderRadius: 14, padding: 14,
              flexDirection: 'row', alignItems: 'center',
              marginBottom: 20,
            }}>
              <View style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: 'rgba(22,163,74,0.1)',
                alignItems: 'center', justifyContent: 'center',
                marginRight: 12, flexShrink: 0,
              }}>
                <ImageIcon size={18} color="#16a34a" strokeWidth={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#166534', fontSize: 10, fontWeight: '600', letterSpacing: 1.5, marginBottom: 2 }}>
                  ILLUSTRATION
                </Text>
                <Text style={{ color: '#78716c', fontSize: 12, fontWeight: '300', lineHeight: 18 }}>
                  {block.description}
                </Text>
              </View>
            </View>
          );
        }

        if (block.type === 'bullets') {
          return (
            <View key={index} style={{ marginBottom: 20, paddingLeft: 4 }}>
              {block.items.map((item, bi) => (
                <View key={bi} style={{
                  flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10,
                }}>
                  <View style={{
                    width: 6, height: 6, borderRadius: 3,
                    backgroundColor: '#16a34a', marginTop: 9, marginRight: 12, flexShrink: 0,
                  }} />
                  <Text style={{
                    flex: 1, color: '#292524', fontSize: 15,
                    fontWeight: '300', lineHeight: 26,
                  }}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          );
        }

        // paragraph
        return (
          <Text key={index} style={{
            color: '#292524', fontSize: 15, fontWeight: '300',
            lineHeight: 28, marginBottom: 16,
          }}>
            {block.text}
          </Text>
        );
      })}
    </View>
  );
}
