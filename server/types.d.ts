export interface SermonFormData {
  speaker: { new: boolean; value: string; firstName: string; lastName: string };
  title: string;
  series: { new: boolean; value: string; newValue: string };
  reference: { book: string; passage: string };
  date: `${number}${number}${number}${number}-${number}${number}-${number}${number}`;
  time: "Sunday Morning" | "Sunday Evening" | "Other";
  sermonFileName: string;
  sermonPicName: string;
}

export interface SermonDetails extends Omit<SermonFormData, "speaker" | "series"> {
  speaker: string;
  series: string;
}

// Add custom jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      /**
       * Used to test that a function throws when it is called. Allows
       * assertions to be performed on the error that is generated.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toThrowWithError(expected: (error: any) => void): R extends Promise<void> ? R : void;

      /** Used to create inline snapshots of `UserError` errors. */
      toMatchInlineUserErrorSnapshot(expected?: string): void;
    }
  }
}
