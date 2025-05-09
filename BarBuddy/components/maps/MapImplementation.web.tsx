import React from 'react';
import MapWeb from './MapWeb';

interface MapImplementationProps {
  apiKey: string;
}

export default function MapImplementation({ apiKey }: MapImplementationProps) {
  return <MapWeb apiKey={apiKey} />;
}