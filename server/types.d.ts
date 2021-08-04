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
