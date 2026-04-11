import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import { ExamBlueprint } from '../types/blueprint';
import { BlueprintPreview } from './BlueprintPreview';
import { useQuizSessionStore } from '../stores/useQuizSessionStore';
import { Question } from '../types';
import { CookingLoader } from './CookingLoader';
import { useNotification } from '../../../stores/useNotificationStore';
import { useAuth } from '../../auth/context/AuthContext';

export const BlueprintPreviewWrapper: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const { user } = useAuth();
  const [blueprint, setBlueprint] = useState<ExamBlueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const startQuiz = useQuizSessionStore(state => state.startQuiz);

  useEffect(() => {
    const fetchBlueprint = async () => {
      if (!id || !user) return;
      try {
        const { data, error } = await supabase
          .from('user_exam_blueprints')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setBlueprint({
            id: data.id,
            name: data.name,
            totalQuestions: data.config.totalQuestions,
            nodes: data.config.nodes
          });
        }
      } catch (err: any) {
        showToast({ title: 'Error', message: 'Could not load blueprint', variant: 'error' });
        navigate('/quiz/config');
      } finally {
        setLoading(false);
      }
    };

    fetchBlueprint();
  }, [id, user, navigate, showToast]);

  const handleStartExam = (questions: Question[]) => {
    // Launching in native God Mode for strict exam simulation
    startQuiz(questions, { subject: [], topic: [], subTopic: [], difficulty: [], isGodMode: true } as any, 'god');
    navigate('/quiz/session/god');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><CookingLoader progress={1} syncedItems={1} totalItems={1} /></div>;
  }

  if (!blueprint) {
    return <div className="text-white text-center mt-20">Blueprint not found.</div>;
  }

  return (
    <BlueprintPreview
      blueprint={blueprint}
      onBack={() => navigate('/quiz/config')}
      onStartExam={handleStartExam}
    />
  );
};
