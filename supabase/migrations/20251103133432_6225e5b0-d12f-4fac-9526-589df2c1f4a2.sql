-- Створюємо нову таблицю 'custom_strains'
-- Тут користувачі зберігають свої власні сорти
CREATE TABLE IF NOT EXISTS public.custom_strains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    type TEXT, -- 'autoflower', 'photoperiod', 'clone'
    start_date DATE,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT now(),
    
    -- Користувач не може мати два сорти з однаковою назвою
    UNIQUE(user_id, name)
);

-- Коментар
COMMENT ON TABLE public.custom_strains IS 'Сорти, додані користувачами для їхніх особистих журналів.';

-- Вмикаємо RLS (Безпеку)
ALTER TABLE public.custom_strains ENABLE ROW LEVEL SECURITY;

-- 1. Політика SELECT: Користувач може бачити ТІЛЬКИ свої кастомні сорти
CREATE POLICY "Users can view their own custom strains"
ON public.custom_strains
FOR SELECT USING (auth.uid() = user_id);

-- 2. Політика INSERT: Користувач може додавати сорти ТІЛЬКИ для себе
CREATE POLICY "Users can insert their own custom strains"
ON public.custom_strains
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Політика UPDATE: Користувач може оновлювати ТІЛЬКИ свої кастомні сорти
CREATE POLICY "Users can update their own custom strains"
ON public.custom_strains
FOR UPDATE USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Політика DELETE: Користувач може видаляти ТІЛЬКИ свої кастомні сорти
CREATE POLICY "Users can delete their own custom strains"
ON public.custom_strains
FOR DELETE USING (auth.uid() = user_id);