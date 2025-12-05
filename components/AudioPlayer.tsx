
import React from 'react';

interface AudioPlayerProps {
    src: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src }) => {
    return (
        <audio controls autoPlay src={src} className="h-8 w-full max-w-[200px]">
            Your browser does not support the audio element.
        </audio>
    );
};

export default AudioPlayer;
