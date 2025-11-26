import React, { useState } from 'react';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/lib/auth';

const AuthPage = () => {
  const [isSigningIn, setIsSigningIn] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const toggleAuthMode = () => {
    setIsSigningIn(!isSigningIn);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSigningIn) {
        await signInWithEmail({ email, password });
      } else {
        await signUpWithEmail({ email, password });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-center text-gray-900">
          {isSigningIn ? 'Sign In' : 'Sign Up'}
        </h2>
        {error && <p className="text-sm text-center text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md"
          />
          <button
            type="submit"
            className="w-full px-4 py-2 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            {isSigningIn ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>
        <button
          onClick={() => signInWithGoogle()}
          className="w-full px-4 py-2 font-bold text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Sign In with Google
        </button>
        <div className="text-sm text-center">
          <button onClick={toggleAuthMode} className="font-medium text-indigo-600 hover:text-indigo-500">
            {isSigningIn ? 'Need an account? Sign Up' : 'Have an account? Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
