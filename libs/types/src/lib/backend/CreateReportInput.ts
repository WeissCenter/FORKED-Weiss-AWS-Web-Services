import { IRenderedTemplate, ITemplate } from '../ITemplate';
import { ReportVisibility } from '../ReportVisibility';

export interface CreateReportInput {
  name: string;
  dataSourceID?: string;
  dataSetID?: string;
  dataViews?: string[];
  dataView?: string;
  template: ITemplate;
  visibility: ReportVisibility;
}
