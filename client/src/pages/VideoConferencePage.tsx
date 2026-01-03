import React, { useState } from 'react';
import {
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  MicrophoneIcon,
  PhoneXMarkIcon,
  VideoCameraIcon,
  VideoCameraSlashIcon
} from '@heroicons/react/24/solid';

const VideoConferencePage = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);

  const toggleMute = () => setIsMuted(!isMuted);
  const toggleCamera = () => setIsCameraOff(!isCameraOff);
  const toggleScreenShare = () => setIsSharingScreen(!isSharingScreen);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Main Video Grid */}
      <div className="flex-1 grid grid-cols-2 gap-2 p-2">
        {/* Placeholder for video streams */}
        <div className="bg-gray-800 rounded-lg flex items-center justify-center">
          <p>Participant 1</p>
        </div>
        <div className="bg-gray-800 rounded-lg flex items-center justify-center">
          <p>Participant 2</p>
        </div>
        <div className="bg-gray-800 rounded-lg flex items-center justify-center">
          <p>Participant 3</p>
        </div>
        <div className="bg-gray-800 rounded-lg flex items-center justify-center">
          <p>You</p>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4">
        <div className="flex items-center space-x-4 bg-gray-800 p-4 rounded-full">
          <button onClick={toggleMute} className={`p-3 rounded-full ${isMuted ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {isMuted ? <MicrophoneIcon className="h-6 w-6" /> : <MicrophoneIcon className="h-6 w-6" />}
          </button>
          <button onClick={toggleCamera} className={`p-3 rounded-full ${isCameraOff ? 'bg-red-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
            {isCameraOff ? <VideoCameraSlashIcon className="h-6 w-6" /> : <VideoCameraIcon className="h-6 w-6" />}
          </button>
          <button onClick={toggleScreenShare} className={`p-3 rounded-full ${isSharingScreen ? 'bg-blue-500' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <ComputerDesktopIcon className="h-6 w-6" />
          </button>
          <button className="p-3 bg-red-500 rounded-full hover:bg-red-600">
            <PhoneXMarkIcon className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Chat */}
      <div className="w-80 bg-gray-800 p-4">
        <h2 className="text-xl font-bold mb-4">Chat</h2>
        {/* Chat messages */}
        <div className="flex-1 space-y-4">
          {/* Message */}
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
            <div>
              <p className="font-bold">Alice</p>
              <p className="text-sm text-gray-400">Hello everyone!</p>
            </div>
          </div>
          {/* Message */}
          <div className="flex items-start space-x-2">
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
            <div>
              <p className="font-bold">Bob</p>
              <p className="text-sm text-gray-400">Hey Alice!</p>
            </div>
          </div>
        </div>
        {/* Chat input */}
        <div className="mt-4">
          <input
            type="text"
            placeholder="Type a message..."
            className="w-full bg-gray-700 rounded-full px-4 py-2"
          />
        </div>
      </div>
    </div>
  );
};

export default VideoConferencePage;
