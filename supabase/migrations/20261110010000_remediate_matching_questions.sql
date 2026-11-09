-- Remediation of flattened and OCR-mangled matching/table questions in public.questions

-- 1. POL1115
UPDATE public.questions
SET 
  question = 'Match the following Constitutional Articles (List I) with their provisions (List II) and select the correct option:

| List I (Articles) | List II (Provisions) |
| :--- | :--- |
| I. Article 140 | 1. Formation of the Finance Commission |
| II. Article 280 | 2. Provision for President''s Rule |
| III. Article 356 | 3. Ancillary powers of the Supreme Court |',
  question_hi = 'निम्नलिखित संवैधानिक अनुच्छेदों (सूची I) का उनके प्रावधानों (सूची II) के साथ मिलान करें और सही विकल्प का चयन करें:

| सूची I (अनुच्छेद) | सूची II (प्रावधान) |
| :--- | :--- |
| I. अनुच्छेद 140 | 1. वित्त आयोग का गठन |
| II. अनुच्छेद 280 | 2. राष्ट्रपति शासन का प्रावधान |
| III. अनुच्छेद 356 | 3. उच्चतम न्यायालय की आनुषंगिक शक्तियां |',
  options = ARRAY['I-1, II-2, III-3', 'I-3, II-1, III-2', 'I-2, II-3, III-1', 'I-3, II-2, III-1'],
  options_hi = ARRAY['I-1, II-2, III-3', 'I-3, II-1, III-2', 'I-2, II-3, III-1', 'I-3, II-2, III-1'],
  correct = 'I-3, II-1, III-2',
  updated_at = NOW()
WHERE v1_id = 'POL1115';

-- 2. GEO1423
UPDATE public.questions
SET 
  question = 'Match the following rivers with their originating states:

| List I (River) | List II (State) |
| :--- | :--- |
| A. Mahanadi | 1. Karnataka |
| B. Kaveri | 2. Madhya Pradesh |
| C. Krishna | 3. Chhattisgarh |
| D. Narmada | 4. Maharashtra |',
  question_hi = 'निम्नलिखित नदियों को उनके उद्गम राज्यों से सुमेलित कीजिए:

| सूची I (नदी) | सूची II (राज्य) |
| :--- | :--- |
| A. महानदी | 1. कर्नाटक |
| B. कावेरी | 2. मध्य प्रदेश |
| C. कृष्णा | 3. छत्तीसगढ़ |
| D. नर्मदा | 4. महाराष्ट्र |',
  options = ARRAY['A-3, B-1, C-4, D-2', 'A-2, B-3, C-1, D-4', 'A-3, B-1, C-2, D-4', 'A-4, B-2, C-3, D-1'],
  options_hi = ARRAY['A-3, B-1, C-4, D-2', 'A-2, B-3, C-1, D-4', 'A-3, B-1, C-2, D-4', 'A-4, B-2, C-3, D-1'],
  correct = 'A-3, B-1, C-4, D-2',
  updated_at = NOW()
WHERE v1_id = 'GEO1423';

-- 3. POL941
UPDATE public.questions
SET 
  question = 'Match the following Schedules with their subject matter:

| Column A (Schedule) | Column B (Subject Matter) |
| :--- | :--- |
| A. Seventh Schedule | 1. Languages recognized by the Constitution |
| B. Eighth Schedule | 2. Distribution of powers between Union and States |
| C. Eleventh Schedule | 3. Municipalities: Functional items |
| D. Twelfth Schedule | 4. Panchayats: Functional items |',
  question_hi = 'निम्नलिखित सूचियों (अनुसूचियों) को उनके विषय से सुमेलित कीजिए:

| कॉलम A (अनुसूची) | कॉलम B (विषय) |
| :--- | :--- |
| A. सातवीं अनुसूची | 1. संविधान द्वारा मान्यता प्राप्त भाषाएँ |
| B. आठवीं अनुसूची | 2. केंद्र और राज्यों के बीच शक्तियों का विभाजन |
| C. ग्यारहवीं अनुसूची | 3. नगरपालिकाएं: कार्यात्मक वस्तुएं |
| D. बारहवीं अनुसूची | 4. पंचायतें: कार्यात्मक वस्तुएं |',
  options = ARRAY['A-1, B-2, C-3, D-4', 'A-2, B-1, C-4, D-3', 'A-4, B-3, C-1, D-2', 'A-3, B-4, C-2, D-1'],
  options_hi = ARRAY['A-1, B-2, C-3, D-4', 'A-2, B-1, C-4, D-3', 'A-4, B-3, C-1, D-2', 'A-3, B-4, C-2, D-1'],
  correct = 'A-2, B-1, C-4, D-3',
  updated_at = NOW()
WHERE v1_id = 'POL941';

-- 4. CHE382
UPDATE public.questions
SET 
  question = 'Match List-I with List-II and select the correct answer using the codes given below the lists:

| List-I | List-II |
| :--- | :--- |
| (a) RhCl(PPh3)3 | (1) Vaska''s compound |
| (b) trans-[Rh(CO)]H(PPh3)3 | (2) Swartz reagent |
| (c) trans-[IrCl(CO)] | (3) Hydroformylation |
| (d) SbF3 | (4) Wilkinson catalyst |',
  updated_at = NOW()
WHERE v1_id = 'CHE382';

-- 5. CUR294
UPDATE public.questions
SET 
  question = 'Match List-I with List-II and select the correct answer using the codes given below:

| List-I (Space Mission) | List-II (Exploration) |
| :--- | :--- |
| A. Cassini-Huygens | 1. Jupiter |
| B. Juno | 2. Saturn and its rings |
| C. Artemis | 3. Venus |
| D. VERITAS | 4. Human Spaceflight-Moon to Mars |',
  updated_at = NOW()
WHERE v1_id = 'CUR294';

-- 6. ECO1006
UPDATE public.questions
SET 
  question = 'Match the following states and schemes:

| State | Scheme |
| :--- | :--- |
| (a) Maharashtra | (1) Kudumbashree |
| (b) Kerala | (2) Participatory Irrigation Management (PIM) |
| (c) Haryana | (3) The Rural Technology Action Group (RuTAGE) |',
  updated_at = NOW()
WHERE v1_id = 'ECO1006';

-- 7. HIS2123
UPDATE public.questions
SET 
  question = 'Match List-I with List-II and choose the correct answer from the codes given below:

| List-I (Women Sports Person) | List-II (Games) |
| :--- | :--- |
| (a) Divya Deshmukh | (1) Pistol shooting |
| (b) Suruchi Phogat | (2) Archery |
| (c) Ankita Bhakat | (3) Wrestling |
| (d) Antim Panghal | (4) Chess |',
  updated_at = NOW()
WHERE v1_id = 'HIS2123';

-- 8. PHY498
UPDATE public.questions
SET 
  question = 'Match List-I with List-II and select the correct answer using the codes given below the lists:

| List-I | List-II |
| :--- | :--- |
| (a) A dice | (1) Cone |
| (b) A football | (2) Cylinder |
| (c) A new pencil | (3) Cube |
| (d) An ice-cream cone | (4) Sphere |',
  updated_at = NOW()
WHERE v1_id = 'PHY498';

-- 9. SGK754
UPDATE public.questions
SET 
  question = 'Match List-I with List-II and choose the correct answer from the codes given below:

| List-I (Sports Cup/Trophy) | List-II (Sports) |
| :--- | :--- |
| (a) Vijay Hazare Trophy | (1) Tennis |
| (b) Sultan Azlan Shah Cup | (2) Football |
| (c) Davis Cup | (3) Cricket |
| (d) Durand Cup | (4) Hockey |',
  updated_at = NOW()
WHERE v1_id = 'SGK754';

-- 10. SGK756
UPDATE public.questions
SET 
  question = 'Match List-I with List-II and choose the correct answer from the codes given below:

| List-I (National Day) | List-II (Date) |
| :--- | :--- |
| (a) National Youth Day | (1) 15th January |
| (b) National Education Day | (2) 28th February |
| (c) National Science Day | (3) 12th January |
| (d) National Army Day | (4) 11th November |',
  updated_at = NOW()
WHERE v1_id = 'SGK756';
