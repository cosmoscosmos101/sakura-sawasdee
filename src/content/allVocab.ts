import { parseVocabFile, type VocabEntry } from "./schema";
import rawN5_01 from "./ja/vocab_n5_01.json";
import rawN5_02a from "./ja/vocab_n5_02a.json";
import rawN5_02b from "./ja/vocab_n5_02b.json";
import rawN5_03 from "./ja/vocab_n5_03.json";
import rawN5_04a from "./ja/vocab_n5_04a.json";
import rawN5_04b from "./ja/vocab_n5_04b.json";
import rawN5_05 from "./ja/vocab_n5_05.json";
import rawParticles from "./ja/vocab_particles.json";
import rawKeigo from "./ja/vocab_keigo.json";
import rawCounter from "./ja/vocab_counter.json";
import rawHiragana from "./ja/vocab_hiragana.json";
import rawHira01 from "./ja/vocab_hira_01.json";
import rawHira02 from "./ja/vocab_hira_02.json";
import rawHira03 from "./ja/vocab_hira_03.json";
import rawHira04 from "./ja/vocab_hira_04.json";
import rawHira05 from "./ja/vocab_hira_05.json";
import rawKata01 from "./ja/vocab_kata_01.json";
import rawKata02 from "./ja/vocab_kata_02.json";
import rawKata03 from "./ja/vocab_kata_03.json";
import rawKata04 from "./ja/vocab_kata_04.json";
import rawKata05 from "./ja/vocab_kata_05.json";
import rawN5_06 from "./ja/vocab_n5_06.json";
import rawN5_07 from "./ja/vocab_n5_07.json";
import rawN5_08 from "./ja/vocab_n5_08.json";
import rawN5_09 from "./ja/vocab_n5_09.json";
import rawN5_10 from "./ja/vocab_n5_10.json";
import rawN5_11 from "./ja/vocab_n5_11.json";
import rawThConsMid from "./th/vocab_cons_mid.json";
import rawThConsMidB from "./th/vocab_cons_mid_b.json";
import rawThConsHighLow from "./th/vocab_cons_high_low.json";
import rawThConsHighB from "./th/vocab_cons_high_b.json";
import rawThConsHighC from "./th/vocab_cons_high_c.json";
import rawThConsLowA from "./th/vocab_cons_low_a.json";
import rawThFoodA from "./th/vocab_th_food_a.json";
import rawThVerbsA from "./th/vocab_th_verbs_a.json";
import rawThBody from "./th/vocab_th_body.json";
import rawThAdjectives from "./th/vocab_th_adjectives.json";
import rawThNature from "./th/vocab_th_nature.json";
import rawThPlaces from "./th/vocab_th_places.json";
import rawThTime from "./th/vocab_th_time.json";
import rawThPeople from "./th/vocab_th_people.json";
import rawThNumbers from "./th/vocab_th_numbers.json";
import rawThObjects from "./th/vocab_th_objects.json";
import rawThPhrases from "./th/vocab_th_phrases.json";
import rawThExtraA from "./th/vocab_th_extra_a.json";
import rawThExtraB from "./th/vocab_th_extra_b.json";

/** All vocab from every content file — used as the encounter pool and Dex source. */
export const ALL_VOCAB: VocabEntry[] = [
  ...parseVocabFile(rawN5_01 as unknown, "vocab_n5_01.json"),
  ...parseVocabFile(rawN5_02a as unknown, "vocab_n5_02a.json"),
  ...parseVocabFile(rawN5_02b as unknown, "vocab_n5_02b.json"),
  ...parseVocabFile(rawN5_03 as unknown, "vocab_n5_03.json"),
  ...parseVocabFile(rawN5_04a as unknown, "vocab_n5_04a.json"),
  ...parseVocabFile(rawN5_04b as unknown, "vocab_n5_04b.json"),
  ...parseVocabFile(rawN5_05 as unknown, "vocab_n5_05.json"),
  ...parseVocabFile(rawParticles as unknown, "vocab_particles.json"),
  ...parseVocabFile(rawKeigo as unknown, "vocab_keigo.json"),
  ...parseVocabFile(rawCounter as unknown, "vocab_counter.json"),
  ...parseVocabFile(rawHiragana as unknown, "vocab_hiragana.json"),
  ...parseVocabFile(rawHira01 as unknown, "ja/vocab_hira_01.json"),
  ...parseVocabFile(rawHira02 as unknown, "ja/vocab_hira_02.json"),
  ...parseVocabFile(rawHira03 as unknown, "ja/vocab_hira_03.json"),
  ...parseVocabFile(rawHira04 as unknown, "ja/vocab_hira_04.json"),
  ...parseVocabFile(rawHira05 as unknown, "ja/vocab_hira_05.json"),
  ...parseVocabFile(rawKata01 as unknown, "ja/vocab_kata_01.json"),
  ...parseVocabFile(rawKata02 as unknown, "ja/vocab_kata_02.json"),
  ...parseVocabFile(rawKata03 as unknown, "ja/vocab_kata_03.json"),
  ...parseVocabFile(rawKata04 as unknown, "ja/vocab_kata_04.json"),
  ...parseVocabFile(rawKata05 as unknown, "ja/vocab_kata_05.json"),
  ...parseVocabFile(rawN5_06 as unknown, "ja/vocab_n5_06.json"),
  ...parseVocabFile(rawN5_07 as unknown, "ja/vocab_n5_07.json"),
  ...parseVocabFile(rawN5_08 as unknown, "ja/vocab_n5_08.json"),
  ...parseVocabFile(rawN5_09 as unknown, "ja/vocab_n5_09.json"),
  ...parseVocabFile(rawN5_10 as unknown, "ja/vocab_n5_10.json"),
  ...parseVocabFile(rawN5_11 as unknown, "ja/vocab_n5_11.json"),
  ...parseVocabFile(rawThConsMid as unknown, "th/vocab_cons_mid.json"),
  ...parseVocabFile(rawThConsMidB as unknown, "th/vocab_cons_mid_b.json"),
  ...parseVocabFile(rawThConsHighLow as unknown, "th/vocab_cons_high_low.json"),
  ...parseVocabFile(rawThConsHighB as unknown, "th/vocab_cons_high_b.json"),
  ...parseVocabFile(rawThConsHighC as unknown, "th/vocab_cons_high_c.json"),
  ...parseVocabFile(rawThConsLowA as unknown, "th/vocab_cons_low_a.json"),
  ...parseVocabFile(rawThFoodA as unknown, "th/vocab_th_food_a.json"),
  ...parseVocabFile(rawThVerbsA as unknown, "th/vocab_th_verbs_a.json"),
  ...parseVocabFile(rawThBody as unknown, "th/vocab_th_body.json"),
  ...parseVocabFile(rawThAdjectives as unknown, "th/vocab_th_adjectives.json"),
  ...parseVocabFile(rawThNature as unknown, "th/vocab_th_nature.json"),
  ...parseVocabFile(rawThPlaces as unknown, "th/vocab_th_places.json"),
  ...parseVocabFile(rawThTime as unknown, "th/vocab_th_time.json"),
  ...parseVocabFile(rawThPeople as unknown, "th/vocab_th_people.json"),
  ...parseVocabFile(rawThNumbers as unknown, "th/vocab_th_numbers.json"),
  ...parseVocabFile(rawThObjects as unknown, "th/vocab_th_objects.json"),
  ...parseVocabFile(rawThPhrases as unknown, "th/vocab_th_phrases.json"),
  ...parseVocabFile(rawThExtraA as unknown, "th/vocab_th_extra_a.json"),
  ...parseVocabFile(rawThExtraB as unknown, "th/vocab_th_extra_b.json"),
];

/** Japanese-only pool — used in Japan-world encounters. */
export const JA_VOCAB: VocabEntry[] = ALL_VOCAB.filter((v) => v.lang === "ja");

/** Thai-only pool — used in Thai-world encounters. */
export const TH_VOCAB: VocabEntry[] = ALL_VOCAB.filter((v) => v.lang === "th");
