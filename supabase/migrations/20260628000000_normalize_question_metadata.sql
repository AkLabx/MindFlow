-- Fix difficulty case fragmentation
UPDATE public.questions
SET
  difficulty = initcap(difficulty),
  updated_at = now()
WHERE difficulty != initcap(difficulty)
  AND lower(difficulty) IN ('hard', 'medium', 'easy');

-- Normalize examDateShift (remove redundant 'Shift' word)
UPDATE public.questions
SET
  "examDateShift" = replace("examDateShift", ', Shift ', ', '),
  updated_at = now()
WHERE "examDateShift" LIKE '%, Shift %';
