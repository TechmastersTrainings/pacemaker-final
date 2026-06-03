const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(tabs)/index.tsx',
  'src/app/(tabs)/explore.tsx',
  'src/app/(tabs)/qbank.tsx',
  'src/app/(tabs)/profile.tsx',
  'src/app/(tabs)/notes.tsx',
  'src/app/(tabs)/community.tsx',
  'src/app/exam/[id].tsx',
  'src/app/edit-profile.tsx',
  'src/app/ai/[topic].tsx'
];

files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 1. Add import if not present
  if (!content.includes('useSafeAreaInsets')) {
    content = content.replace(
      "import { useColorScheme } from 'react-native';",
      "import { useColorScheme } from 'react-native';\nimport { useSafeAreaInsets } from 'react-native-safe-area-context';"
    );
  }
  
  // 2. Add hook inside the default export function if not present
  if (!content.includes('const insets = useSafeAreaInsets();')) {
    content = content.replace(
      /(export default function [A-Za-z]+\([^)]*\) \{)/,
      "$1\n  const insets = useSafeAreaInsets();"
    );
  }
  
  // 3. Remove hardcoded paddingTop: 60 or 50 from styles.container
  // Look for container block in styles
  content = content.replace(/container:\s*\{[^}]*paddingTop:\s*(60|50),?\s*/g, (match) => {
    return match.replace(/paddingTop:\s*(60|50),?\s*/, '');
  });
  
  // 4. Inject dynamic padding into the inline style of the container View
  // Looks like: <View style={[styles.container, { backgroundColor: colors.background }]}
  // Or: <ScrollView style={[styles.container, { backgroundColor: colors.background }]}
  content = content.replace(
    /(<(?:View|ScrollView|KeyboardAvoidingView)[^>]*style=\{\[styles\.container,\s*\{[^}]*backgroundColor:\s*colors\.background)\s*\}\]/g,
    "$1, paddingTop: insets.top + 10 }]"
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', file);
});
