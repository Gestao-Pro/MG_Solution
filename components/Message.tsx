
import { Copy, FileSpreadsheet, FileText } from 'lucide-react';
import React, { useState } from 'react';
import { Message as MessageType } from '../types';
import Avatar from './Avatar';
import AudioPlayer from './AudioPlayer';
import IconButton from './IconButton';
import { Volume2, Download } from 'lucide-react';

interface MessageProps {
    message: MessageType;
    onPlayAudio: (messageId: string, text: string, agent: any) => void;
    audioUrl?: string;
}

const Message: React.FC<MessageProps> = ({ message, onPlayAudio, audioUrl }) => {
    const isUser = message.sender === 'user';
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (message.text) {
            navigator.clipboard.writeText(message.text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    const handleDownload = () => {
        if (message.imageUrl) {
            const link = document.createElement('a');
            link.href = message.imageUrl;
            // Provide a generic filename for the download
            link.download = `gestaopro-criativo-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <div className={`flex items-start gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
            {!isUser && message.agent && (
                <div className="w-10 h-10 flex-shrink-0">
                    <Avatar agent={message.agent} />
                </div>
            )}
            <div className={`rounded-lg p-3 max-w-lg shadow ${isUser ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
                {message.imageUrl && (
                    <div className="relative group">
                        <img
                            src={message.imageUrl}
                            alt="Conteúdo da mensagem"
                            className="rounded-md max-w-full h-auto mb-2"
                        />
                        {!isUser && ( // Apenas mostra o download para imagens do agente
                            <div className="absolute bottom-2 right-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300">
                                <IconButton
                                    icon={Download}
                                    onClick={handleDownload}
                                    tooltip="Baixar Imagem"
                                    size="sm"
                                    className="bg-black bg-opacity-50 text-white hover:bg-opacity-75"
                                />
                            </div>
                        )}
                    </div>
                )}
                {message.dataFileName && (
                    <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FileSpreadsheet className="w-4 h-4" />
                        <span className="truncate">Arquivo anexado: {message.dataFileName}</span>
                        {message.dataUrl && (
                            <a
                                href={message.dataUrl}
                                download={message.dataFileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline"
                            >
                                Abrir
                            </a>
                        )}
                    </div>
                )}
                {message.documentFileName && (
                    <div className="mb-2 text-sm text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span className="truncate">Documento anexado: {message.documentFileName}</span>
                        {message.documentUrl && (
                            <a
                                href={message.documentUrl}
                                download={message.documentFileName}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 underline"
                            >
                                Abrir
                            </a>
                        )}
                    </div>
                )}
                {message.text && <div className="whitespace-pre-wrap">{message.text}</div>}

                {!isUser && message.agent && message.text && (
                    <div className="mt-2 flex items-center justify-end">
                        {audioUrl ? (
                            <AudioPlayer src={audioUrl} />
                        ) : (
                             <IconButton
                                icon={Volume2}
                                onClick={() => onPlayAudio(message.id, message.text, message.agent)}
                                tooltip="Ouvir Resposta"
                                size="sm"
                                className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200"
                            />
                        )}
                        {!isUser && message.text && (
                            <IconButton
                                icon={Copy}
                                onClick={handleCopy}
                                tooltip={copied ? "Copiado!" : "Copiar Texto"}
                                size="sm"
                                className="ml-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200"
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Message;
