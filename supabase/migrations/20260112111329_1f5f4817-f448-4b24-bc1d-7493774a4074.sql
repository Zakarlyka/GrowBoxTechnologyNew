-- Create plant_journal_events table for grower's calendar
CREATE TABLE public.plant_journal_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL, -- 'watering', 'defoliation', 'nutrients', 'photo', 'issue', 'note', 'stage_change'
  title TEXT,
  description TEXT,
  photo_url TEXT,
  day_of_grow INTEGER, -- calculated day at time of event
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.plant_journal_events ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own events
CREATE POLICY "Users can manage own journal events"
ON public.plant_journal_events
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_plant_journal_events_plant_id ON public.plant_journal_events(plant_id);
CREATE INDEX idx_plant_journal_events_created_at ON public.plant_journal_events(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_plant_journal_events_updated_at
BEFORE UPDATE ON public.plant_journal_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();