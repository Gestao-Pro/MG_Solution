import React, { useState, useRef, useEffect } from 'react';
import { Agent, Message as MessageType } from '../types';
import Message from './Message';
import IconButton from './IconButton';
import { Send, Mic, Square, ArrowLeft, Paperclip, X, Image as ImageIcon, FileSpreadsheet, FileText } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { generateSpeech } from '../services/geminiService';
import { getPreferredVoice, getFallbackVoice } from '../utils/voiceConfig';
import Avatar from './Avatar';

interface ChatViewProps {
    agent: Agent;
    messages: MessageType[];
    onSendMessage: (message: string, imageFiles?: File[], dataFile?: File, documentFile?: File) => void;
    loading: boolean;
    onBack: () => void;
    onClearConversation: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ agent, messages, onSendMessage, loading, onBack, onClearConversation }) => {
    const [inputText, setInputText] = useState('');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [dataFile, setDataFile] = useState<File | null>(null);
    const [dataFileName, setDataFileName] = useState<string | null>(null);
    const [documentFile, setDocumentFile] = useState<File | null>(null);
    const [documentFileName, setDocumentFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [messageAudios, setMessageAudios] = useState<Record<string, string>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setInputText(transcript);
        }
    }, [transcript]);

    // Automatically manage image preview URLs based on imageFiles
    useEffect(() => {
        // Create new URLs for current files
        const newUrls = imageFiles.map(file => URL.createObjectURL(file));
        setImagePreviewUrls(newUrls);

        // Cleanup function to revoke URLs when imageFiles changes or component unmounts
        return () => {
            newUrls.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imageFiles]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, loading]);
    
    const handleSend = () => {
        // Avoid concurrent sends that can trigger API 429s
        if (loading) return;
        if (inputText.trim() || imageFiles.length > 0 || dataFile || documentFile) {
            onSendMessage(
                inputText.trim(),
                imageFiles.length > 0 ? imageFiles : undefined,
                dataFile ?? undefined,
                documentFile ?? undefined
            );
            setInputText('');
            setImageFiles([]);
            // setImagePreviewUrls is handled by useEffect
            setDataFile(null);
            setDataFileName(null);
            setDocumentFile(null);
            setDocumentFileName(null);
        }
    };
    
    const handleVoiceToggle = () => {
        if (isListening) {
            stopListening();
        } else {
            setInputText('');
            startListening();
        }
    };

    const detectFileKind = (file: File): 'image' | 'document' | 'data' => {
        const mime = (file.type || '').toLowerCase();
        const name = (file.name || '').toLowerCase();
        const ext = name.substring(name.lastIndexOf('.') + 1);
        const isImage = mime.startsWith('image/') || ['png','jpg','jpeg','webp'].includes(ext);
        const isDocument = mime === 'application/pdf' || mime === 'application/msword' || mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || ['pdf','doc','docx'].includes(ext);
        const isData = (
            mime === 'text/csv' || mime === 'text/tab-separated-values' ||
            mime === 'application/json' || mime === 'application/vnd.ms-excel' ||
            mime === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
            ['csv','tsv','json','xls','xlsx'].includes(ext)
        );
        if (isImage) return 'image';
        if (isDocument) return 'document';
        return 'data';
    };

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files?.length) return;
        
        const isFile = (obj: unknown): obj is File =>
            obj instanceof File || (!!obj && typeof (obj as any).name === 'string' && typeof (obj as any).type === 'string');
        const toFiles = (list: FileList | null): File[] => list ? Array.from(list).filter(isFile) : [];
        const files: File[] = toFiles(event.target.files);
        if (files.length === 0) return;
        
        const firstFile: File = files[0];
        const kind = detectFileKind(firstFile);
        
        if (kind === 'image') {
            const newImages: File[] = files.filter((f: File) => detectFileKind(f) === 'image');
            if (newImages.length > 0) {
                setImageFiles(prev => [...prev, ...newImages]);
                setDataFile(null);
                setDataFileName(null);
                setDocumentFile(null);
                setDocumentFileName(null);
            }
        } else if (kind === 'document') {
            const file: File = firstFile;
            setDocumentFile(file);
            setDocumentFileName(file.name);
            setImageFiles([]);
            setDataFile(null);
            setDataFileName(null);
        } else {
            const file: File = firstFile;
            setDataFile(file);
            setDataFileName(file.name);
            setImageFiles([]);
            setDocumentFile(null);
            setDocumentFileName(null);
        }
        
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragging(false);
        
        const isFile = (obj: unknown): obj is File =>
            obj instanceof File || (!!obj && typeof (obj as any).name === 'string' && typeof (obj as any).type === 'string');
        const toFiles = (list: FileList | null): File[] => list ? Array.from(list).filter(isFile) : [];
        const files: File[] = toFiles(event.dataTransfer?.files || null);
        if (files.length === 0) return;
        const firstFile: File = files[0];
        const kind = detectFileKind(firstFile);

        if (kind === 'image') {
            const newImages: File[] = files.filter((f: File) => detectFileKind(f) === 'image');
             if (newImages.length > 0) {
                setImageFiles(prev => [...prev, ...newImages]);
                setDataFile(null);
                setDataFileName(null);
                setDocumentFile(null);
                setDocumentFileName(null);
            }
        } else if (kind === 'document') {
            setDocumentFile(firstFile);
            setDocumentFileName(firstFile.name);
            setImageFiles([]);
            setDataFile(null);
            setDataFileName(null);
        } else {
            setDataFile(firstFile);
            setDataFileName(firstFile.name);
            setImageFiles([]);
            setDocumentFile(null);
            setDocumentFileName(null);
        }
    };
    
    const handleRemoveImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        // URLs managed by useEffect
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleRemoveData = () => {
        setDataFile(null);
        setDataFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleRemoveDocument = () => {
        setDocumentFile(null);
        setDocumentFileName(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handlePlayAudio = async (messageId: string, text: string, agent: Agent) => {
        const cacheKey = `audio_${agent.id}_${messageId}`;
        const cachedAudioUrl = localStorage.getItem(cacheKey);

        // Use cache only if it points to a valid generated URL (blob/data)
        if (cachedAudioUrl) {
            const isValidGenerated = /^blob:/.test(cachedAudioUrl) || /^data:/.test(cachedAudioUrl);
            const isKnownBad = /simulated-speech-audio\.mp3/i.test(cachedAudioUrl);
            if (isKnownBad || !isValidGenerated) {
                // Clear invalid/legacy cache entry to force regeneration
                localStorage.removeItem(cacheKey);
            } else {
                setMessageAudios(prev => ({ ...prev, [messageId]: cachedAudioUrl }));
                return;
            }
        }
        
        try {
            const preferred = getPreferredVoice(agent);
            const fallback = getFallbackVoice(agent);
            const audioUrl = await generateSpeech(text, preferred, fallback);
            localStorage.setItem(cacheKey, audioUrl);
            setMessageAudios(prev => ({ ...prev, [messageId]: audioUrl }));
        } catch (error) {
            console.error("Failed to generate speech", error);
        }
    };

    const handleClearConversationClick = () => {
        const confirmed = window.confirm(
            'Deseja iniciar uma nova conversa? Isso limpará o histórico deste agente.'
        );
        if (confirmed) {
            onClearConversation();
        }
    };

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-100 dark:bg-gray-800">
            <header className="bg-white dark:bg-gray-900 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center shadow-md flex-shrink-0">
                <IconButton icon={ArrowLeft} onClick={onBack} tooltip="Voltar" className="mr-2 bg-transparent hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" />
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 flex-shrink-0">
                        <Avatar agent={agent} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{agent.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{agent.specialty}</p>
                    </div>
                </div>
                <div className="ml-auto">
                    <button
                        onClick={handleClearConversationClick}
                        className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Nova Conversa
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((msg) => (
                    <Message 
                        key={msg.id} 
                        message={msg} 
                        onPlayAudio={handlePlayAudio}
                        audioUrl={messageAudios[msg.id]}
                    />
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="flex items-center space-x-2">
                           <div className="w-10 h-10"><Avatar agent={agent} /></div>
                           <div className="bg-white dark:bg-gray-700 rounded-lg p-4 max-w-lg flex items-center shadow space-x-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <footer
                className={`bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 ${isDragging ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-gray-800' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                 {imagePreviewUrls.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                        {imagePreviewUrls.map((url, index) => (
                            <div key={index} className="relative w-24 h-24 p-1 border border-gray-300 dark:border-gray-600 rounded-md flex-shrink-0">
                                <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded" />
                                <IconButton
                                    icon={X}
                                    onClick={() => handleRemoveImage(index)}
                                    tooltip="Remover Imagem"
                                    size="sm"
                                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full"
                                />
                            </div>
                        ))}
                    </div>
                )}
                {dataFileName && (
                    <div className="flex items-center gap-2 mb-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 max-w-xs">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="truncate">Arquivo anexado: {dataFileName}</span>
                        <IconButton
                            icon={X}
                            onClick={handleRemoveData}
                            tooltip="Remover Arquivo"
                            size="sm"
                            className="ml-auto bg-red-600 hover:bg-red-700 text-white"
                        />
                    </div>
                )}
                {documentFileName && (
                    <div className="flex items-center gap-2 mb-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-200 max-w-xs">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">Documento anexado: {documentFileName}</span>
                        <IconButton
                            icon={X}
                            onClick={handleRemoveDocument}
                            tooltip="Remover Documento"
                            size="sm"
                            className="ml-auto bg-red-600 hover:bg-red-700 text-white"
                        />
                    </div>
                )}
                <div className="relative flex items-center">
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple // Enable multiple file selection
                        accept={(agent.canHandleImages ? 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp' : '') +
                                (agent.canHandleDataFiles ? (agent.canHandleImages ? ',' : '') + '.csv,.tsv,.json,.xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json' : '') +
                                (agent.canHandleDocuments ? (agent.canHandleImages || agent.canHandleDataFiles ? ',' : '') + '.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document' : '')
                        }
                        className="hidden"
                    />
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                if (!loading) handleSend();
                            }
                        }}
                        placeholder={isListening ? "Ouvindo..." : imageFiles.length > 0 ? `Adicione um comentário para as ${imageFiles.length} imagens...` : documentFile ? "Adicione um comentário para o documento..." : `Converse com ${agent.name}...`}
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 pl-12 pr-28 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        rows={1}
                        style={{maxHeight: '100px'}}
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                        {(agent.canHandleImages || agent.canHandleDataFiles || agent.canHandleDocuments) && (
                             <IconButton
                                icon={Paperclip}
                                onClick={() => fileInputRef.current?.click()}
                                tooltip={agent.canHandleImages ? (agent.canHandleDataFiles ? (agent.canHandleDocuments ? "Anexar Imagem, Dados ou Documento" : "Anexar Imagem ou Dados") : (agent.canHandleDocuments ? "Anexar Imagem ou Documento" : "Anexar Imagem")) : (agent.canHandleDataFiles ? (agent.canHandleDocuments ? "Anexar Dados ou Documento" : "Anexar Dados") : (agent.canHandleDocuments ? "Anexar Documento" : "Anexar Arquivo"))}
                            />
                        )}
                    </div>
                    {isDragging && (
                        <div className="absolute left-14 right-28 top-1/2 -translate-y-1/2 pointer-events-none text-sm text-blue-700 dark:text-blue-400">
                            Solte o arquivo aqui para anexar
                        </div>
                    )}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
                         <IconButton
                            icon={isListening ? Square : Mic}
                            onClick={handleVoiceToggle}
                            className={isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-blue-600 hover:bg-blue-700'}
                            tooltip={isListening ? "Parar Gravação" : "Gravar Voz"}
                         />
                         <IconButton
                            icon={Send}
                            onClick={handleSend}
                            disabled={(!inputText.trim() && imageFiles.length === 0 && !dataFile && !documentFile) || loading}
                            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-500"
                            tooltip="Enviar Mensagem"
                         />
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ChatView;
