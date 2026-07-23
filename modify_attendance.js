const fs = require('fs');
let code = fs.readFileSync('src/components/AttendanceTab.tsx', 'utf8');

// Replace Message interface
code = code.replace(/interface Message \{[\s\S]*?\}/, `export interface ChatMessage {
  id: string;
  sender: 'teacher' | 'system';
  text?: string;
  type?: 'text' | 'confirmation' | 'success';
  found?: { rollNumber: string; name: string; studentId: string }[];
  notFound?: string[];
  confirmed?: boolean;
  timestamp: string;
}`);

// Replace state
code = code.replace(/const \[messages, setMessages\] = useState<Message\[\]>\(\[\]\);/, `const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);`);

fs.writeFileSync('src/components/AttendanceTab.tsx', code);
