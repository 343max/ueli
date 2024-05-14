import { chineseTranslationSet } from "./chinese-translation-set";
import { englishTranslationSet } from "./english-translation-set";
import { germanTranslationSet } from "./german-translation-set";
import { hindiTranslationSet } from "./hindi-translation-set";
import { italianTranslationSet } from "./italian-translation-set";
import { japaneseTranslationSet } from "./japanese-translation-set";
import { koreanTranslationSet } from "./korean-translation-set";
import { Language } from "./language";
import { portugueseTranslationSet } from "./portuguese-translation-set";
import { russianTranslationSet } from "./russian-translation-set";
import { spanishTranslationSet } from "./spanish-translation-set";
import { TranslationSet } from "./translation-set";
import { turkishTranslationSet } from "./turkish-translation-set";

export function getTranslationSet(language: Language): TranslationSet {
    switch (language) {
        case Language.English:
            return englishTranslationSet;
        case Language.German:
            return { ...germanTranslationSet, ...englishTranslationSet };
        case Language.Hindi:
            return { ...hindiTranslationSet, ...englishTranslationSet };
        case Language.Portuguese:
            return { ...portugueseTranslationSet, ...englishTranslationSet };
        case Language.Russian:
            return { ...russianTranslationSet, ...englishTranslationSet };
        case Language.Turkish:
            return { ...turkishTranslationSet, ...englishTranslationSet };
        case Language.Spanish:
            return { ...spanishTranslationSet, ...englishTranslationSet };
        case Language.Chinese:
            return { ...chineseTranslationSet, ...englishTranslationSet };
        case Language.Korean:
            return { ...koreanTranslationSet, ...englishTranslationSet };
        case Language.Japanese:
            return { ...japaneseTranslationSet, ...englishTranslationSet };
        case Language.Italian:
            return { ...italianTranslationSet, ...englishTranslationSet };
        default:
            return englishTranslationSet;
    }
}
