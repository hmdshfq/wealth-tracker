'use client';
import React from 'react';
import { PriceCard } from '@/components/ui';

interface DraggableTickerCardProps {
  ticker: string;
  name: string;
  price: string;
  change: string;
  changeType: 'positive' | 'negative';
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragEnd: () => void;
}

export const DraggableTickerCard: React.FC<DraggableTickerCardProps> = ({
  ticker,
  name,
  price,
  change,
  changeType,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
}) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ticker);
    onDragStart();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    onDragOver();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onDragEnd={onDragEnd}
    >
      <PriceCard
        ticker={ticker}
        name={name}
        price={price}
        change={change}
        changeType={changeType}
        isDragging={isDragging}
        isDragOver={false}
        draggable={true}
      />
    </div>
  );
};

export default DraggableTickerCard;
