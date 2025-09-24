import { StringTemplate } from "../ITemplate";

export interface QuickSummary {
  heading: StringTemplate | string;
  sections: QuickSummarySection[];
}

export interface QuickSummarySection {
  title: StringTemplate | string;
  //   filterTag: string,
  tags: string | string[];
  body: StringTemplate | string;
}
