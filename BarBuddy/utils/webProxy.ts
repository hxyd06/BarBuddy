import { Platform } from 'react-native';

/**
 * Web proxy for API calls to avoid CORS issues
 */
export const fetchWithProxy = async (url: string): Promise<Response> => {
  // Only use proxy for web platform
  if (Platform.OS === 'web') {
    // CORS proxies for development (needs to replace in future with own proxy maybe)
    const corsProxies = [
      'https://cors-anywhere.herokuapp.com/',
      'https://api.allorigins.win/raw?url=',
      'https://cors-proxy.htmldriven.com/?url='
    ];
    
    // Try to use the first proxy by default
    try {
      const proxyUrl = `${corsProxies[0]}${url}`;
      return await fetch(proxyUrl);
    } catch (error) {
      console.error('Primary proxy failed, trying alternative', error);
      
      // If the first proxy fails, try alternatives
      for (let i = 1; i < corsProxies.length; i++) {
        try {
          const proxyUrl = `${corsProxies[i]}${encodeURIComponent(url)}`;
          return await fetch(proxyUrl);
        } catch (innerError) {
          console.error(`Alternative proxy ${i} failed`, innerError);
        }
      }
      
      // If all proxies fail, throw an error
      throw new Error('All proxies failed');
    }
  } else {
    // For native platforms, use the URL directly
    return await fetch(url);
  }
};