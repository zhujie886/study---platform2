import React from 'react';
import { useAuthStore } from '../store/authStore';
import UserProfileModal from './UserProfileModal';

interface PersonalCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PersonalCenter({ isOpen, onClose }: PersonalCenterProps) {
  const { user } = useAuthStore();
  return <UserProfileModal isOpen={isOpen} onClose={onClose} user={user} />;
}
