import path from "path";
import "../../../test-utils/extendExpect";
import { BibleReferenceValidator, SermonFormDataValidator } from "..";
import { UserError } from "../../models/errors";
import { series, speakers } from "../../json-data"; // This data will get mocked out
import type { SermonFormData } from "../../types";

// SNAPSHOTS WARNING: Jest cannot handle generating multiple inline snaphots at the same time,
// in the same place. If you want to use loops to verify that multiple inline snapshots look
// the same, you will have to create the snapshot FIRST, then place the snapshot test inside a loop.
// Similarly, if you need to update an inline snapshot that's in a loop, you'll first have to
// update the snapshot on its own -- outside the loop. Then you'll have to put the snapshot back
// inside the loop.

describe("Sermon Form Data Validator", () => {
  // Replace series/speaker data with test data
  jest.mock("../../json-data", () => jest.requireActual("./test-data"));

  // Spied-on Functions
  const mockBibleReferenceValidator = jest.spyOn(BibleReferenceValidator, "validate");

  // Constants
  const thumbnail = "thumbnail.png" as const;
  const sermonFile = "sermon-file.mp3" as const;

  beforeAll(() => {
    // Setup mock file directories
    process.env.THUMBNAILS_DIR = path.resolve(__dirname, "test-data", "thumbnails-dir");
    process.env.SERMON_FILES_DIR = path.resolve(__dirname, "test-data", "sermon-files-dir");
  });

  describe("Speaker Validation", () => {
    it("Rejects non-existent speakers", async () => {
      const badSpeaker = { value: "Invalid Speaker" } as SermonFormData["speaker"];
      const form = { ...fillFormWithout("speaker"), speaker: badSpeaker };

      await expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: No existing speaker was found with the name \\"Invalid Speaker\\".
            info: 
            suggestion: "
          `);
        }
      );
    });

    it("Rejects new speakers with incomplete names", async () => {
      const speakerNoFirst = { new: true, firstName: "New" } as SermonFormData["speaker"];
      const speakerNoLast = { new: true, lastName: "Speaker" } as SermonFormData["speaker"];

      await Promise.all(
        [speakerNoFirst, speakerNoLast].map((speaker) => {
          const form = { ...fillFormWithout("speaker"), speaker };

          return expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
            (error: UserError) => {
              expect(error).toMatchInlineUserErrorSnapshot(`
                "message: A first name and last name are required for new speakers.
                info: 
                suggestion: "
              `);
            }
          );
        })
      );
    });

    it("Accepts new speakers with full names", async () => {
      const newSpeaker = {
        new: true,
        firstName: "New",
        lastName: "Speaker",
      } as SermonFormData["speaker"];
      const form = { ...fillFormWithout("speaker"), speaker: newSpeaker };

      await SermonFormDataValidator.validate(form);
    });

    it("Accepts existing speakers", async () => {
      const speaker = { value: speakers[0] } as SermonFormData["speaker"];
      const form = { ...fillFormWithout("speaker"), speaker };

      await SermonFormDataValidator.validate(form);
    });
  });

  describe("Title Validation", () => {
    it("Rejects empty titles outside of evening service", async () => {
      const badTitle = "";
      const form = { ...fillFormWithout("title"), title: badTitle };

      await Promise.all(
        (["Sunday Morning", "Other"] as const).map((time: SermonFormData["time"]) => {
          form.time = time;

          return expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
            (error: UserError) => {
              expect(error).toMatchInlineUserErrorSnapshot(`
                "message: An empty title is only allowed for evening services.
                info: 
                suggestion: "
              `);
            }
          );
        })
      );
    });

    it("Allows empty titles during evening service", async () => {
      const title = "";
      const form = { ...fillFormWithout("title"), title };
      form.time = "Sunday Evening";

      await SermonFormDataValidator.validate(form);
    });

    it("Accepts any non-empty title", async () => {
      const title = "Sermon Title" as const;
      const form = { ...fillFormWithout("title"), title };

      const times = ["Sunday Morning", "Sunday Evening", "Other"] as const;
      await Promise.all(
        times.map((time: SermonFormData["time"]) => {
          form.time = time;
          return SermonFormDataValidator.validate(form);
        })
      );
    });
  });

  describe("Series Validation", () => {
    it("Rejects a non-existent series", async () => {
      const badSeries = { value: "Invalid Series" } as SermonFormData["series"];
      const form = { ...fillFormWithout("series"), series: badSeries };

      await expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: No existing series called \\"Invalid Series\\" was found.
            info: 
            suggestion: "
          `);
        }
      );
    });

    it("Rejects new series that are empty", async () => {
      const badSeries = { new: true, newValue: "" } as SermonFormData["series"];
      const form = { ...fillFormWithout("series"), series: badSeries };

      await expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: A valid series name is required for new series.
            info: 
            suggestion: "
          `);
        }
      );
    });

    it("Accepts new series that are non-empty", async () => {
      const goodSeries = { new: true, newValue: "New Series" } as SermonFormData["series"];
      const form = { ...fillFormWithout("series"), series: goodSeries };

      await SermonFormDataValidator.validate(form);
    });

    it("Accepts existing series", async () => {
      const goodSeries = { value: series[0] } as SermonFormData["series"];
      const form = { ...fillFormWithout("series"), series: goodSeries };

      await SermonFormDataValidator.validate(form);
    });
  });

  // NOTE: More intense reference validation can be found in the Bible Reference Validator tests
  describe("Reference Validation", () => {
    it("Rejects an incomplete Bible reference", async () => {
      const noBook = { passage: "1:1" } as SermonFormData["reference"];
      const noReference = { book: "Genesis" } as SermonFormData["reference"];

      await Promise.all(
        [noBook, noReference].map((reference) => {
          const form = { ...fillFormWithout("reference"), reference };

          return expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
            (error: UserError) => {
              expect(error).toMatchInlineUserErrorSnapshot(`
                "message: An incomplete Bible reference was provided.
                info: 
                suggestion: Please use a complete Bible reference or exclude it entirely."
              `);
            }
          );
        })
      );
    });

    it("Accepts an empty Bible reference", async () => {
      const noReference = {} as SermonFormData["reference"];
      const form = { ...fillFormWithout("reference"), reference: noReference };

      await SermonFormDataValidator.validate(form);
    });

    it("Accepts a complete, valid Bible reference", async () => {
      const reference = { book: "Genesis", passage: "1:1" } as SermonFormData["reference"];
      const form = { ...fillFormWithout("reference"), reference };

      await SermonFormDataValidator.validate(form);
      expect(mockBibleReferenceValidator).toBeCalledWith(`${reference.book} ${reference.passage}`);
    });
  });

  describe("Date Validation", () => {
    it("Rejects dates with an invalid format", async () => {
      const notADate = "not-a-date" as const;
      const onlyNumbers = "12345678" as const;
      const wrongFormat = `01-01-${new Date().getFullYear()}` as const;

      await Promise.all(
        [notADate, onlyNumbers, wrongFormat].map((badDate) => {
          const form = { ...fillFormWithout("date"), date: badDate as SermonFormData["date"] };

          return expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
            (error: UserError) => {
              expect(error).toMatchInlineUserErrorSnapshot(`
                "message: An invalid date was provided.
                info: The expected date format is 'YYYY-MM-DD'.
                suggestion: "
              `);
            }
          );
        })
      );
    });

    it("Rejects dates before 1900 and after the current year", async () => {
      const [, thisMonth, thisDay] = new Date().toISOString().split("T")[0].split("-");
      const tooEarly = `1899-${thisMonth}-${thisDay}`;
      const tooLate = `${new Date().getFullYear() + 1}-${thisMonth}-${thisDay}`;

      await Promise.all(
        [tooEarly, tooLate].map((badDate) => {
          const form = { ...fillFormWithout("date"), date: badDate as SermonFormData["date"] };

          return expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
            (error: UserError) => {
              expect(error).toMatchInlineUserErrorSnapshot(`
                "message: An invalid year was provided.
                info: Year must be no earlier than 1900 and no later than this year.
                suggestion: "
              `);
            }
          );
        })
      );
    });

    it("Rejects dates with an invalid month", async () => {
      const [thisYear, , thisDay] = new Date().toISOString().split("T")[0].split("-");
      const badMonthDate1 = `${thisYear}-00-${thisDay}`;
      const badMonthDate2 = `${thisYear}-13-${thisDay}`;

      await Promise.all(
        [badMonthDate1, badMonthDate2].map((badDate) => {
          const form = { ...fillFormWithout("date"), date: badDate as SermonFormData["date"] };

          return expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
            (error: UserError) => {
              expect(error).toMatchInlineUserErrorSnapshot(`
                "message: An invalid month was provided.
                info: 
                suggestion: "
              `);
            }
          );
        })
      );
    });

    it("Rejects dates with an invalid day", async () => {
      const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const; // Shifted to account for last-day dates
      const year = new Date().getFullYear() - 1;

      await Promise.all(
        months.map((month) => {
          // Create a date whose day is greater than the last day of the month
          const [, mm, dd] = new Date(year, month, 0).toISOString().split("T")[0].split("-");
          const afterLastDay = Number(dd) + 1;
          const badDayDate = `${year}-${mm}-${afterLastDay}`;
          const form = { ...fillFormWithout("date"), date: badDayDate as SermonFormData["date"] };

          return expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
            (error: UserError) => {
              expect(error).toMatchInlineUserErrorSnapshot(`
                "message: An invalid day was provided for the given month and year.
                info: 
                suggestion: Remember to account for leap years."
              `);
            }
          );
        })
      );
    });

    it("Accounts for leap years", async () => {
      const leapYear = 2000;
      const nonLeapYear = 1999;
      const month = "02";
      const day = "29";
      const leapDate = `${leapYear}-${month}-${day}`;
      const nonLeapDate = `${nonLeapYear}-${month}-${day}`;

      // Enforce proper setup
      expect(nonLeapYear).toBe(leapYear - 1);

      // Expect error for using `29` on a non leap year
      const badForm = { ...fillFormWithout("date"), date: nonLeapDate as SermonFormData["date"] };
      await expect(() => SermonFormDataValidator.validate(badForm)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: An invalid day was provided for the given month and year.
            info: 
            suggestion: Remember to account for leap years."
          `);
        }
      );

      // Expect success for using `29` on a leap year
      const goodForm = { ...fillFormWithout("date"), date: leapDate as SermonFormData["date"] };
      await SermonFormDataValidator.validate(goodForm);
    });

    it("Accepts valid dates", async () => {
      const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
      const year = new Date().getFullYear() - 1;

      await Promise.all(
        months.map((m) => {
          const date = new Date(year, m, 1).toISOString().split("T")[0];
          const form = { ...fillFormWithout("date"), date: date as SermonFormData["date"] };
          return SermonFormDataValidator.validate(form);
        })
      );
    });
  });

  describe("Time Validation", () => {
    it("Only accepts valid times", async () => {
      const validTimes = ["Sunday Morning", "Sunday Evening", "Other"] as const;
      const invalidTime = "Invalid Time" as const;

      // Fail case
      const badForm = { ...fillFormWithout("time"), time: invalidTime as SermonFormData["time"] };
      await expect(() => SermonFormDataValidator.validate(badForm)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: An invalid time of day was provided.
            info: 
            suggestion: "
          `);
        }
      );

      // Pass case
      await Promise.all(
        validTimes.map((time: SermonFormData["time"]) => {
          const form = { ...fillFormWithout("time"), time };
          return SermonFormDataValidator.validate(form);
        })
      );
    });
  });

  describe("Thumbnail Validation", () => {
    it("Rejects any thumbnails that are not png's", async () => {
      const badFileType = `${thumbnail}.jpg` as const;
      const form = { ...fillFormWithout("sermonPicName"), sermonPicName: badFileType };

      expect(badFileType).not.toMatch(/\.png$/);
      await expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: Only .png files are allowed for thumbnails.
            info: 
            suggestion: "
          `);
        }
      );
    });

    it("Requires the thumbnail to exist in the proper directory", async () => {
      const nonExistentPic = "no-thumbnail.png" as const;
      const form = { ...fillFormWithout("sermonPicName"), sermonPicName: nonExistentPic };

      expect(nonExistentPic).toMatch(/\.png$/);
      await expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: Could not find thumbnail with the name \\"no-thumbnail.png\\".
            info: Thumbnails are only allowed to come from /Users/isaiahthomason/repos/personal/ghc-podbean-helper/server/validators/__tests__/test-data/thumbnails-dir.
            suggestion: "
          `);
        }
      );
    });

    it("Accepts thumbnails of the correct format in the proper directory", async () => {
      const form = { ...fillFormWithout("sermonPicName"), sermonPicName: thumbnail };

      expect(thumbnail).toMatch(/\.png$/);
      await SermonFormDataValidator.validate(form);
    });
  });

  describe("Sermon File Validation", () => {
    it("Rejects any files that are not mp3's", async () => {
      const badFileType = `${sermonFile}.wav` as const;
      const form = { ...fillFormWithout("sermonFileName"), sermonFileName: badFileType };

      expect(badFileType).not.toMatch(/\.mp3$/);
      await expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: Only .mp3 files are allowed for sermon files.
            info: 
            suggestion: "
          `);
        }
      );
    });

    it("Requires the sermon file to exist in the proper directory", async () => {
      const nonExistentFile = "no-sermon-file.mp3" as const;
      const form = { ...fillFormWithout("sermonFileName"), sermonFileName: nonExistentFile };

      expect(nonExistentFile).toMatch(/\.mp3$/);
      await expect(() => SermonFormDataValidator.validate(form)).rejects.toThrowWithError(
        (error: UserError) => {
          expect(error).toMatchInlineUserErrorSnapshot(`
            "message: Could not find sermon file with the name \\"no-sermon-file.mp3\\".
            info: Sermon files are only allowed to come from /Users/isaiahthomason/repos/personal/ghc-podbean-helper/server/validators/__tests__/test-data/sermon-files-dir.
            suggestion: "
          `);
        }
      );
    });

    it("Accepts sermon files of the correct format in the proper directory", async () => {
      const form = { ...fillFormWithout("sermonFileName"), sermonFileName: sermonFile };

      expect(sermonFile).toMatch(/\.mp3$/);
      await SermonFormDataValidator.validate(form);
    });
  });
});

function fillFormWithout<K extends keyof SermonFormData>(piece: K): Omit<SermonFormData, K> {
  const form = {
    speaker: { value: speakers[0] },
    title: "Sermon Title",
    series: { value: series[0] },
    reference: {},
    date: new Date().toISOString().split("T")[0],
    time: "Sunday Morning",
    sermonPicName: "thumbnail.png",
    sermonFileName: "sermon-file.mp3",
  } as SermonFormData;

  delete form[piece];
  return form;
}
