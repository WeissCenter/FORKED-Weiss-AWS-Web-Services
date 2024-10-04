import { IRenderedTemplate } from '../ITemplate';
import { ReportVisibility } from '../ReportVisibility';

export interface ReportDBItem {
  type: string;
  id: string;
  reportID: string;
  name: string;
  updated: string;
  template: IRenderedTemplate;
  author: string;
  approval: string;
  status: string;
  dataSourceID: string;
  dataSetID: string;
  visibility: ReportVisibility;
}
