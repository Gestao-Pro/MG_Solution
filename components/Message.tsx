
import React from 'react';
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
                        {!isUser && ( // Only show download for agent images
                            <IconButton
                                icon={Download}
                                onClick={handleDownload}
                                tooltip="Baixar Imagem"
                                size="sm"
                                className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white hover:bg-opacity-75 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            />
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
                    </div>
                )}
            </div>
        </div>
    );
};

export default Message;
