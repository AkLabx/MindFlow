-- 1. Exam Categories
CREATE TABLE public.exam_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Test Series
CREATE TABLE public.test_series (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID REFERENCES public.exam_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    is_premium BOOLEAN DEFAULT false,
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tests
CREATE TABLE public.tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    series_id UUID REFERENCES public.test_series(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    duration_minutes INTEGER DEFAULT 60,
    total_marks NUMERIC DEFAULT 0,
    passing_marks NUMERIC DEFAULT 0,
    negative_marks NUMERIC DEFAULT 0,
    question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT false,
    release_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. User Test Attempts
CREATE TABLE public.user_test_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    time_taken_seconds INTEGER,
    score NUMERIC DEFAULT 0,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'in_progress',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indices
CREATE INDEX idx_test_series_category ON public.test_series(category_id);
CREATE INDEX idx_tests_series ON public.tests(series_id);
CREATE INDEX idx_user_attempts_test ON public.user_test_attempts(test_id);
CREATE INDEX idx_user_attempts_user ON public.user_test_attempts(user_id);
CREATE INDEX idx_leaderboard ON public.user_test_attempts(test_id, score DESC, time_taken_seconds ASC);

-- RLS setup (Row Level Security)

-- Exam Categories
ALTER TABLE public.exam_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for active categories" ON public.exam_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Allow admin all exam categories" ON public.exam_categories FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mindflow.com');

-- Test Series
ALTER TABLE public.test_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for published series" ON public.test_series FOR SELECT USING (is_published = true);
CREATE POLICY "Allow admin all test series" ON public.test_series FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mindflow.com');

-- Tests
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read for published tests" ON public.tests FOR SELECT USING (is_published = true);
CREATE POLICY "Allow admin all tests" ON public.tests FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mindflow.com');

-- User Test Attempts
ALTER TABLE public.user_test_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own attempts" ON public.user_test_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON public.user_test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own attempts" ON public.user_test_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Public read for leaderboard if completed" ON public.user_test_attempts FOR SELECT USING (status = 'completed');
CREATE POLICY "Allow admin all user attempts" ON public.user_test_attempts FOR ALL USING (auth.jwt() ->> 'email' = 'admin@mindflow.com');

-- Triggers to auto-update the 'updated_at' column
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exam_categories_modtime
BEFORE UPDATE ON public.exam_categories FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_test_series_modtime
BEFORE UPDATE ON public.test_series FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_tests_modtime
BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION update_modified_column();

CREATE TRIGGER update_user_test_attempts_modtime
BEFORE UPDATE ON public.user_test_attempts FOR EACH ROW EXECUTE FUNCTION update_modified_column();
