import { IRenderedTemplate } from './ITemplate';
import { ReportVisibility } from './ReportVisibility';

export interface IReport {
  reportID: string;
  name: string;
  updated: string;
  template: IRenderedTemplate;
  author: string;
  approval: string;
  version: string;
  dataSourceID: string;
  dataSetID: string;
  dataView: string;
  visibility: ReportVisibility;
}
