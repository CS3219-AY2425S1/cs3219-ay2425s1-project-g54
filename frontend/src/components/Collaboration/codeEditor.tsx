import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Editor from '@monaco-editor/react';
import LanguageSelector from './languageSelector';
import { CODE_SNIPPETS } from './languageSelector';
import Stack from '@mui/material/Stack';
import Output from './console';
import { useSocket } from '../../contexts/SocketContext';
import { useParams } from 'react-router-dom';

export const MONACOLANGUAGES: Record<string, string> = {
    "C++": "cpp",
    "Java": "java",
    "Python 3": "python",
    "Javascript": "javascript",
    "C#": "csharp",
    "SQL": "sql"
};

const CodeEditor = ({ qid }: { qid: Number }) => {
    const { roomId } = useParams();
    const { collabSocket } = useSocket();
    const editorRef = useRef();
    const [value, setValue] = useState(CODE_SNIPPETS["Python 3"]);
    const [language, setLanguage] = useState("Python 3");

    const onMount = (editor: any) => {
        editorRef.current = editor;
        editor.focus();
    }
    const onSelect = (language: string) => {
        setLanguage(language);
        setValue(CODE_SNIPPETS[language]);
        collabSocket?.emit("language-change", roomId, language);
    };

    useEffect(() => {
        if (!collabSocket) {
            return;
        }

        collabSocket.on("sync-code", (edittedCode: string) => {
            console.log("to sync");
            setValue(edittedCode);
        });

        collabSocket.on("sync-language", (language: string) => {
            setLanguage(language);
            setValue(CODE_SNIPPETS[language]);
        });

        return () => {
            if (collabSocket && collabSocket!.connected) {
                collabSocket.disconnect();
            }
        }

    }, [collabSocket])

    return (
        <Box height="100%" width="100%">
            <Stack direction="column" spacing={1} height="100%" width="100%">
                <LanguageSelector language={language} onSelect={onSelect} />
                <Editor
                    options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                    }}
                    height="50%"
                    width="100%"
                    theme="vs-dark"
                    defaultLanguage={MONACOLANGUAGES[language]}
                    defaultValue={CODE_SNIPPETS[language]}
                    language={MONACOLANGUAGES[language]}
                    onMount={onMount}
                    value={value}
                    onChange={(value) => {
                        if (value !== undefined) {
                            setValue(value);
                            collabSocket!.emit("edit-code", roomId, value);
                        }
                    }}
                />
                <Output editorRef={editorRef} language={language} qid={qid} />
            </Stack>
        </Box>
    );
}

export default CodeEditor;
