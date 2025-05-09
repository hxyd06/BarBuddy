import React from 'react';
import MapNative from './MapNative';

interface MapImplementationProps {
  apiKey: string;
}

export default function MapImplementation({ apiKey }: MapImplementationProps) {
  return <MapNative apiKey={apiKey} />;
}