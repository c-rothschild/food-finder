import React from 'react';
import type { AppProps } from 'next/app';
import '../styles/App.css'; // Import your global CSS here

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
