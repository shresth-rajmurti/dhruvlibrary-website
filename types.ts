import React from 'react';

export type SectionId = 'home' | 'about' | 'facilities' | 'gallery' | 'contact';

export interface Facility {
  title: string;
  description: string;
  icon: React.ElementType;
}

export interface GalleryImage {
  id: string;
  url: string;
  caption: string;
  size: 'small' | 'large' | 'tall';
}

export interface Book {
  title: string;
  coverColor: string;
  author: string;
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isError?: boolean;
}

export interface StatData {
  name: string;
  value: number;
  fullMark?: number;
}