'use client';
import React, { useEffect } from 'react';

export default function OauthCallback() {
  useEffect(() => {
    try {
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const token = params.get('access_token');
      const error = params.get('error');
      if (window.opener) {
        window.opener.postMessage({ type: 'oauth_token', token, error }, window.location.origin);
      }
    } catch (e) {
      if (window.opener) window.opener.postMessage({ type: 'oauth_token', error: 'Failed to read token' }, window.location.origin);
    }
  }, []);

  return <div style={{padding:20}}>Signing in... You can close this window.</div>;
}
