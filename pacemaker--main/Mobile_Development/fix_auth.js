const fs = require('fs');
const path = require('path');

const authFiles = [
  'src/app/(auth)/login.tsx',
  'src/app/(auth)/register.tsx'
];

authFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('KeyboardAvoidingView')) {
    content = content.replace(
      "import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';",
      "import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';"
    );
    
    // Replace outer <View with <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    content = content.replace(
      /<View style=\{\[styles\.container,\s*\{\s*backgroundColor:\s*colors\.background\s*\}\]\}>/,
      `<KeyboardAvoidingView style={[styles.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>`
    );
    
    // Replace the outer closing View
    content = content.replace(
      /<\/View>\n\s*<\/View>\n\s*\);\n\}/,
      `</View>\n    </KeyboardAvoidingView>\n  );\n}`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Fixed KeyboardAvoidingView in', file);
  }
});
