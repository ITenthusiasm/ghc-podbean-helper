import { UserError } from "../models/errors";
import books from "./utils/bibleData.json";

// Utility Types
type BibleVerse = { chapter: number; verse?: number };
type BibleReference = { start: BibleVerse; end?: BibleVerse };

class BibleReferenceValidator {
  /**
   * @param referenceStr String representation of the Bible reference
   */
  static validate(referenceStr: string): void {
    const commonErrorMessage = "An invalid Bible reference was provided." as const;

    /* -------------------- Determine Bible book -------------------- */
    const book = books.find((b) =>
      new RegExp(`^(${b.name}|${b.abbr.join("|")})\\b`, "i").test(referenceStr)
    );

    if (!book) {
      const error = new UserError(commonErrorMessage);
      error.info = "The provided book could not be found.";
      throw error;
    }

    /* -------------------- Create Bible reference object -------------------- */
    /** Object representation of the Bible reference */
    const referenceObj = ((): BibleReference => {
      const passage = referenceStr.replace(book.name, "").replace(/\s/g, "").split("-");
      const startRefArr = passage[0].split(":").map((str) => Number(str));
      const endRefArr = passage[1]?.split(":").map((str) => Number(str));

      // Invalid reference. Eg. Genesis 1-2-3
      if (passage.length > 2) {
        const error = new UserError(commonErrorMessage);
        error.info = "Expected only 1 dash in the reference.";
        throw error;
      }

      // Possibilities: Genesis
      if (!passage[0]) return { start: { chapter: 1 } };
      // Possibilities: a) Genesis 1, b) Genesis 1-2, c) Genesis 1-2:3
      if (startRefArr.length === 1) {
        const reference: BibleReference = { start: { chapter: startRefArr[0] } };

        // Single chapter only. Eg. Genesis 1
        if (!endRefArr) return reference;
        // Chapter to chapter. Eg. Genesis 1-2
        if (endRefArr.length === 1) reference.end = { chapter: endRefArr[0] };
        // Chapter to specific verse. Eg. Genesis 1-2:3
        else if (endRefArr.length === 2)
          reference.end = { chapter: endRefArr[0], verse: endRefArr[1] };
        // Invalid reference. Eg. Genesis 1-2:3:4
        else {
          const error = new UserError(commonErrorMessage);
          error.info = "Too many colons were found at the end of the reference.";
          throw error;
        }

        return reference;
      }
      // Possibilities: a) Genesis 1:1, b) Genesis 1:1-2, c) Genesis 1:1-2:1
      if (startRefArr.length === 2) {
        const reference: BibleReference = {
          start: { chapter: startRefArr[0], verse: startRefArr[1] },
        };

        // Single chapter and verse. Eg. Genesis 1:1
        if (!endRefArr) return reference;
        // Single chapter with verses. Eg. Gensis 1:1-2
        if (endRefArr.length === 1)
          reference.end = { chapter: startRefArr[0], verse: endRefArr[0] };
        // Chapter-verse to Chapter-verse. Eg. Genesis 1:1-2:1
        else if (endRefArr.length === 2)
          reference.end = { chapter: endRefArr[0], verse: endRefArr[1] };
        // Invalid reference. Eg. 1:1-2:3:4
        else {
          const error = new UserError(commonErrorMessage);
          error.info = "Too many colons were found at the end of the reference.";
          throw error;
        }

        return reference;
      }
      // Invalid reference. Eg 1:2:3-4
      const error = new UserError(commonErrorMessage);
      error.info = "Too many colons were found at the beginning of the reference.";
      throw error;
    })();

    /* -------------------- Validate Bible reference object ranges -------------------- */
    // Helpers
    const chapterInRange = (chapter: number): boolean => {
      if (book.chapters.length === 1) return chapter <= book.chapters[0];
      return chapter <= book.chapters.length;
    };
    const verseInRange = (chapter: number, verse: number): boolean =>
      verse <= book.chapters[chapter - 1];

    // Validation
    const { start, end } = referenceObj;

    if (
      !chapterInRange(start.chapter) ||
      (start.verse && !verseInRange(start.chapter, start.verse)) ||
      (end?.chapter && !chapterInRange(end.chapter)) ||
      (end?.verse && !verseInRange(end.chapter, end.verse))
    ) {
      const error = new UserError(commonErrorMessage);
      error.info = "The provided reference is out of range.";
      throw error;
    }

    if (end)
      if (
        start.chapter > end.chapter ||
        (start.chapter === end.chapter && start.verse && end.verse && start.verse > end.verse)
      ) {
        const error = new UserError(commonErrorMessage);
        error.info = "The beginning of the reference is larger than the end of the reference.";
        throw error;
      }
  }
}

export default BibleReferenceValidator;
