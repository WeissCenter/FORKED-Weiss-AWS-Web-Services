import { SectionType } from "./sections/SectionType";

export interface ISection {
  type: SectionType; // defined list of available sections
  condition?: ISectionConditions;
  content: unknown;
  sectionLabel: string;
}

export interface ISectionConditions {
  operator: "AND" | "OR";
  conditions: ISectionCondition[];
}

export interface ISectionCondition {
  filterCode: string;
  value: string[];
}
