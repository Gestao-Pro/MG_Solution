import React, { useState, useRef, useEffect } from 'react';
import { Agent, Message as MessageType } from '../types';
import Message from './Message';
import IconButton from './IconButton';
import { Send, Mic, Square, ArrowLeft, Paperclip, X } from 'lucide-react';
import useSpeechRecognition from '../hooks/useSpeechRecognition';
import { generateSpeech } from '../services/geminiService';
import Avatar from './Avatar';

interface ChatViewProps {
    agent: Agent;
    messages: MessageType[];
    onSendMessage: (message: string, imageFile?: File) => void;
    loading: boolean;
    onBack: () => void;
}

const ChatView: React.FC<ChatViewProps> = ({ agent, messages, onSendMessage, loading, onBack }) => {
    const [inputText, setInputText] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [messageAudios, setMessageAudios] = useState<Record<string, string>>({});
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { isListening, transcript, startListening, stopListening } = useSpeechRecognition();

    useEffect(() => {
        if (transcript) {
            setInputText(transcript);
        }
    }, [transcript]);

    useEffect(() => {
        // Cleanup object URLs to prevent memory leaks
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [imagePreviewUrl]);


    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(scrollToBottom, [messages, loading]);
    
    const handleSend = () => {
        if (inputText.trim() || imageFile) {
            onSendMessage(inputText.trim(), imageFile ?? undefined);
            setInputText('');
            setImageFile(null);
            setImagePreviewUrl(null);
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

    const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleRemoveImage = () => {
        setImageFile(null);
        setImagePreviewUrl(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handlePlayAudio = async (messageId: string, text: string, agent: Agent) => {
        if (messageAudios[messageId]) return;
        
        try {
            const audioUrl = await generateSpeech(text, agent.voice);
            setMessageAudios(prev => ({ ...prev, [messageId]: audioUrl }));
        } catch (error) {
            console.error("Failed to generate speech", error);
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

            <footer className="bg-white dark:bg-gray-900 p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                 {imagePreviewUrl && (
                    <div className="relative w-24 h-24 mb-2 p-1 border border-gray-300 dark:border-gray-600 rounded-md">
                        <img src={imagePreviewUrl} alt="Preview" className="w-full h-full object-cover rounded" />
                        <IconButton
                            icon={X}
                            onClick={handleRemoveImage}
                            tooltip="Remover Imagem"
                            size="sm"
                            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full"
                        />
                    </div>
                )}
                <div className="relative flex items-center">
                     <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/png, image/jpeg, image/webp"
                        className="hidden"
                    />
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={isListening ? "Ouvindo..." : imageFile ? "Adicione um comentário para a imagem..." : `Converse com ${agent.name}...`}
                        className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg py-3 pl-12 pr-28 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        rows={1}
                        style={{maxHeight: '100px'}}
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                        {agent.canHandleImages && (
                             <IconButton
                                icon={Paperclip}
                                onClick={() => fileInputRef.current?.click()}
                                tooltip="Anexar Imagem"
                                className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400"
                            />
                        )}
                    </div>
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
                            disabled={(!inputText.trim() && !imageFile) || loading}
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