import "../../../test-utils/extendExpect";
import { UserError } from "../../models/errors";
import BibleData from "../bibleData.json";
import { BibleReferenceValidator } from "..";

// SNAPSHOTS WARNING: Jest cannot handle generating multiple inline snaphots at the same time,
// in the same place. If you want to use loops to verify that multiple inline snapshots look
// the same, you will have to create the snapshot FIRST, then place the snapshot test inside a loop.
// Similarly, if you need to update an inline snapshot that's in a loop, you'll first have to
// update the snapshot on its own -- outside the loop. Then you'll have to put the snapshot back
// inside the loop.

describe("Bible Reference Validator", () => {
  /* -------------------- Passing Cases -------------------- */
  it("Accepts a lone book", () => {
    const testRegex = /\w+/;
    const book = "Jude" as const;

    expect(testRegex.test(book)).toBe(true);
    BibleReferenceValidator.validate(book);
  });

  it("Accepts single-chapter references", () => {
    const testRegex = /\w+ \d+/;
    const reference = "Genesis 1" as const;

    expect(testRegex.test(reference)).toBe(true);
    BibleReferenceValidator.validate(reference);
  });

  it("Accepts single-verse references", () => {
    const testRegex = /\w+ \d+:\d+/;
    const reference = "Genesis 1:1" as const;

    expect(testRegex.test(reference)).toBe(true);
    BibleReferenceValidator.validate(reference);
  });

  it("Accepts a single-chapter reference with multiple verses", () => {
    const testRegex = /\w+ \d+:\d+-\d+/;
    const reference = "Genesis 1:1-2" as const;

    expect(testRegex.test(reference)).toBe(true);
    BibleReferenceValidator.validate(reference);
  });

  it("Accepts chapter-to-chapter references", () => {
    const testRegex = /\w+ \d+-\d+/;
    const reference = "Genesis 1-2" as const;

    expect(testRegex.test(reference)).toBe(true);
    BibleReferenceValidator.validate(reference);
  });

  it("Accepts references that start at the beginning of one chapter and end in the middle of another", () => {
    const testRegex = /\w+ \d+-\d+:\d+/;
    const reference = "Genesis 1-2:3" as const;

    expect(testRegex.test(reference)).toBe(true);
    BibleReferenceValidator.validate(reference);
  });

  it("Accepts references with verses that go from one chapter to another", () => {
    const testRegex = /\w+ \d+:\d+-\d+:\d+/;
    const reference = "Genesis 1:5-2:6" as const;

    expect(testRegex.test(reference)).toBe(true);
    BibleReferenceValidator.validate(reference);
  });

  it("Handles books 'with only 1 chapter'", () => {
    const book = "Jude" as const;
    const reference = `${book} 5-12` as const;

    // TODO: Should we also validate the error case?
    expect(BibleData.filter((b) => b.chapters.length === 1).map((b) => b.name)).toContain(book);
    BibleReferenceValidator.validate(reference);
  });

  /* -------------------- Failing Cases -------------------- */
  it("Rejects invalid books", () => {
    const badBook = "Hezekiah" as const;

    expect(BibleData.map((b) => b.name)).not.toContain(badBook);
    expect(() => BibleReferenceValidator.validate(badBook)).toThrowWithError((error: UserError) => {
      expect(error).toMatchInlineUserErrorSnapshot(`
        "message: An invalid Bible reference was provided.
        info: The provided book could not be found.
        suggestion: "
      `);
    });
  });

  it("Rejects references whose chapters are out of range", () => {
    const book = "Genesis" as const;
    const badChapter = 1000;

    const referenceBadStart = `${book} ${badChapter}` as const;
    const referenceBadEnd = `${book} 1-${badChapter}` as const;

    expect(BibleData.find((b) => b.name === book)?.chapters.length).toBeLessThan(badChapter);
    [referenceBadStart, referenceBadEnd].forEach((r) => {
      expect(() => BibleReferenceValidator.validate(r)).toThrowWithError((error: UserError) => {
        expect(error).toMatchInlineUserErrorSnapshot(`
          "message: An invalid Bible reference was provided.
          info: The provided reference is out of range.
          suggestion: "
        `);
      });
    });
  });

  it("Rejects references whose verses are out of range", () => {
    const book = "Genesis" as const;
    const chapter = 1;
    const badVerse = 1000;

    const referenceBadStart = `${book} ${chapter}:${badVerse}` as const;
    const referenceBadEnd = `${book} ${chapter}:1-${badVerse}` as const;

    expect(BibleData.find((b) => b.name === book)?.chapters[chapter - 1]).toBeLessThan(badVerse);
    [referenceBadStart, referenceBadEnd].forEach((r) => {
      expect(() => BibleReferenceValidator.validate(r)).toThrowWithError((error: UserError) => {
        expect(error).toMatchInlineUserErrorSnapshot(`
          "message: An invalid Bible reference was provided.
          info: The provided reference is out of range.
          suggestion: "
        `);
      });
    });
  });

  it("Rejects references that end before they start", () => {
    const book = "Genesis" as const;
    const goodChapter = 1;
    const badStart = 2;
    const badEnd = 1;

    const referenceBadChapters = `${book} ${badStart}-${badEnd}` as const;
    const referenceBadVerses = `${book} ${goodChapter}:${badStart}-${badEnd}` as const;

    expect(badStart).toBeGreaterThan(badEnd);
    [referenceBadChapters, referenceBadVerses].forEach((r) => {
      expect(() => BibleReferenceValidator.validate(r)).toThrowWithError((error: UserError) => {
        expect(error).toMatchInlineUserErrorSnapshot(`
          "message: An invalid Bible reference was provided.
          info: The beginning of the reference is larger than the end of the reference.
          suggestion: "
        `);
      });
    });
  });

  it("Rejects references with too many hyphens (-)", () => {
    const badReference = "Genesis 1-2-3" as const;

    expect(badReference.split("-").length).toBeGreaterThan(2);
    expect(() => BibleReferenceValidator.validate(badReference)).toThrowWithError(
      (error: UserError) => {
        expect(error).toMatchInlineUserErrorSnapshot(`
          "message: An invalid Bible reference was provided.
          info: Expected only 1 dash in the reference.
          suggestion: "
        `);
      }
    );
  });

  it("Rejects references with too many colons (:)", () => {
    const referenceBadStart = "Genesis 1:2:3-4" as const;
    const referenceBadEnd1 = "Genesis 1-2:3:4" as const;
    const referenceBadEnd2 = "Genesis 1:1-2:3:4" as const;

    expect(referenceBadStart.split(":").length).toBeGreaterThan(2);
    expect(referenceBadEnd1.split(":").length).toBeGreaterThan(2);
    expect(referenceBadEnd2.split(":").length).toBeGreaterThan(3);

    expect(() => BibleReferenceValidator.validate(referenceBadStart)).toThrowWithError(
      (error: UserError) => {
        expect(error).toMatchInlineUserErrorSnapshot(`
          "message: An invalid Bible reference was provided.
          info: Too many colons were found at the beginning of the reference.
          suggestion: "
        `);
      }
    );

    [referenceBadEnd1, referenceBadEnd2].forEach((r) => {
      expect(() => BibleReferenceValidator.validate(r)).toThrowWithError((error: UserError) => {
        expect(error).toMatchInlineUserErrorSnapshot(`
          "message: An invalid Bible reference was provided.
          info: Too many colons were found at the end of the reference.
          suggestion: "
        `);
      });
    });
  });
});
