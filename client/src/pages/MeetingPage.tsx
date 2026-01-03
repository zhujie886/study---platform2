import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

export default function MeetingPage() {
  const { roomId } = useParams<{ roomId: string }>();

  if (!roomId) return null;

  return <Navigate to={`/video/${roomId}`} replace />;
}
