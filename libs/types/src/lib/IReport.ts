import { IRenderedTemplate } from "./ITemplate";
import { ReportVisibility } from "./ReportVisibility";

export interface IReport {
  translationsVerified: boolean;
  reportID: string;
  name: string;
  lang?: string;
  updated: string;
  template: IRenderedTemplate;
  author: string;
  approval: string;
  published: string;
  version: string;
  dataSourceID: string;
  dataSetID: string;
  dataView: string;
  slug?: string;
  visibility: ReportVisibility;
}
